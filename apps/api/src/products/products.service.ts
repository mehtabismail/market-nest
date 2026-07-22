import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProductOwnerType, ProductStatus, Prisma } from '@prisma/client';
import type { BuyerProductDTO } from '@marketnest/shared-types';
import { PrismaService } from '../prisma/prisma.service';
import type { RequestUser } from '../auth/auth.types';
import { toBuyerProductDTO, toBuyerProductListItemDTO } from './buyer-product.mapper';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ListProductsQuery } from './dto/list-products.query';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
import { ReviewsService } from '../reviews/reviews.service';
import { EmbeddingsService } from '../search/embeddings.service';
import { SemanticSearchService } from '../search/semantic-search.service';

const buildBuyerListSelect = (): Prisma.ProductSelect => ({
  id: true,
  title: true,
  description: true,
  price: true,
  comparePrice: true,
  stockQty: true,
  sku: true,
  images: true,
  categoryId: true,
  status: true,
  ownerType: true,
  hue: true,
  dealEndsAt: true,
  // Category and brand names only. Explicitly NOT the seller relation — this
  // select is the boundary that keeps store identity out of buyer responses.
  category: { select: { name: true } },
  brand: { select: { name: true } },
});

const buildBuyerDetailSelect = (): Prisma.ProductSelect => ({
  ...buildBuyerListSelect(),
  variants: {
    select: {
      id: true,
      name: true,
      options: true,
      priceDelta: true,
      stockQty: true,
      isDefault: true,
    },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
  },
});

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reviews: ReviewsService,
    private readonly embeddings: EmbeddingsService,
    private readonly semanticSearch: SemanticSearchService,
  ) {}

  async listForBuyer(query: ListProductsQuery) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    if (query.search && query.semantic) {
      const { items, mode } = await this.semanticSearch.search(query.search, limit);
      const productIds = items.map((dto) => dto.id);
      const statsMap = await this.reviews.aggregateBatch(productIds);
      const withReviews = items.map((dto) => {
        const stats = statsMap.get(dto.id) ?? { averageRating: null, reviewCount: 0 };
        return { ...dto, ...stats };
      });
      return {
        items: withReviews,
        total: withReviews.length,
        page: 1,
        limit,
        totalPages: 1,
        searchMode: mode,
      };
    }

    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      status: 'published',
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        select: buildBuyerListSelect(),
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    const productIds = items.map((p) => p.id);
    const statsMap = await this.reviews.aggregateBatch(productIds);

    const mapped = items.map((p) => {
      const dto = toBuyerProductListItemDTO(p);
      const stats = statsMap.get(p.id) ?? { averageRating: null, reviewCount: 0 };
      return { ...dto, ...stats };
    });

    return {
      items: mapped,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getForBuyer(id: string): Promise<BuyerProductDTO> {
    const product = await this.prisma.product.findFirst({
      where: { id, status: 'published' },
      select: buildBuyerDetailSelect(),
    });
    if (!product) throw new NotFoundException('Product not found');
    const stats = await this.reviews.aggregate(id);
    return {
      ...toBuyerProductDTO(product),
      averageRating: stats.averageRating ?? undefined,
      reviewCount: stats.reviewCount,
    };
  }

  async getBuyerPreviewForAdmin(id: string): Promise<BuyerProductDTO> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: buildBuyerDetailSelect(),
    });
    if (!product) throw new NotFoundException('Product not found');
    const stats = await this.reviews.aggregate(id);
    return {
      ...toBuyerProductDTO(product),
      averageRating: stats.averageRating ?? undefined,
      reviewCount: stats.reviewCount,
    };
  }

  async listForSeller(user: RequestUser) {
    if (!user.sellerId) throw new ForbiddenException('Seller profile required');
    return this.prisma.product.findMany({
      where: { sellerId: user.sellerId },
      orderBy: { updatedAt: 'desc' },
      include: { category: { select: { name: true, slug: true } } },
    });
  }

  async listForAdmin(query: ListProductsQuery) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const where: Prisma.ProductWhereInput = {
      ...(query.ownerType ? { ownerType: query.ownerType } : {}),
      ...(query.search
        ? { title: { contains: query.search, mode: 'insensitive' } }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          seller: { select: { id: true, storeName: true, storeSlug: true } },
          category: { select: { name: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async createForSeller(user: RequestUser, dto: CreateProductDto) {
    if (!user.sellerId) throw new ForbiddenException('Seller profile required');
    return this.createProduct({
      ...dto,
      ownerType: 'seller_owned',
      sellerId: user.sellerId,
      status: dto.status ?? 'draft',
    });
  }

  async createForAdmin(dto: CreateProductDto, adminId: string) {
    const ownerType = dto.ownerType ?? 'platform_owned';

    if (ownerType === 'platform_owned') {
      return this.createProduct({
        ...dto,
        ownerType: 'platform_owned',
        sellerId: null,
        status: dto.status ?? 'published',
        createdByAdmin: adminId,
      });
    }

    if (ownerType === 'seller_assigned' && !dto.sellerId) {
      throw new BadRequestException('sellerId required for seller_assigned products');
    }

    return this.createProduct({
      ...dto,
      ownerType: 'seller_assigned',
      sellerId: dto.sellerId!,
      status: dto.status ?? 'published',
      createdByAdmin: adminId,
    });
  }

  private async createProduct(params: {
    title: string;
    description?: string;
    categoryId?: string;
    price: number;
    comparePrice?: number;
    stockQty?: number;
    sku?: string;
    images?: string[];
    status: ProductStatus;
    ownerType: ProductOwnerType;
    sellerId: string | null;
    createdByAdmin?: string;
  }) {
    const product = await this.prisma.product.create({
      data: {
        title: params.title,
        description: params.description,
        categoryId: params.categoryId,
        price: params.price,
        comparePrice: params.comparePrice,
        stockQty: params.stockQty ?? 0,
        sku: params.sku,
        images: params.images ?? [],
        status: params.status,
        ownerType: params.ownerType,
        sellerId: params.sellerId,
      },
    });
    if (product.status === 'published') {
      void this.embeddings.enqueue(product.id);
    }
    return product;
  }

  async updateForSeller(user: RequestUser, id: string, dto: UpdateProductDto) {
    const product = await this.getSellerProduct(user, id);
    if (product.ownerType === 'seller_assigned' && dto.ownerType) {
      throw new ForbiddenException('Cannot change owner_type on admin-assigned products');
    }
    const updated = await this.prisma.product.update({
      where: { id },
      data: this.pickProductUpdate(dto),
    });
    if (updated.status === 'published') {
      void this.embeddings.enqueue(updated.id);
    }
    return updated;
  }

  async updateForAdmin(id: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');

    let sellerId = product.sellerId;
    let ownerType = product.ownerType;

    if (dto.ownerType) {
      ownerType = dto.ownerType;
      if (dto.ownerType === 'platform_owned') sellerId = null;
      else if (dto.sellerId) sellerId = dto.sellerId;
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        ...this.pickProductUpdate(dto),
        ownerType,
        sellerId,
      } as Prisma.ProductUncheckedUpdateInput,
    });
    if (updated.status === 'published') {
      void this.embeddings.enqueue(updated.id);
    }
    return updated;
  }

  async archiveForSeller(user: RequestUser, id: string) {
    await this.getSellerProduct(user, id);
    return this.prisma.product.update({
      where: { id },
      data: { status: 'archived' },
    });
  }

  async listVariantsForSeller(user: RequestUser, productId: string) {
    await this.getSellerProduct(user, productId);
    return this.prisma.productVariant.findMany({
      where: { productId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async createVariantForSeller(
    user: RequestUser,
    productId: string,
    dto: CreateProductVariantDto,
  ) {
    await this.getSellerProduct(user, productId);
    const variantCount = await this.prisma.productVariant.count({
      where: { productId },
    });
    const makeDefault = dto.isDefault ?? variantCount === 0;

    return this.prisma.$transaction(async (tx) => {
      if (makeDefault) {
        await tx.productVariant.updateMany({
          where: { productId },
          data: { isDefault: false },
        });
      }

      return tx.productVariant.create({
        data: {
          productId,
          name: dto.name,
          options: (dto.options ?? {}) as Prisma.InputJsonValue,
          priceDelta: dto.priceDelta ?? 0,
          stockQty: dto.stockQty ?? 0,
          sku: dto.sku,
          isDefault: makeDefault,
        },
      });
    });
  }

  async updateVariantForSeller(
    user: RequestUser,
    productId: string,
    variantId: string,
    dto: UpdateProductVariantDto,
  ) {
    await this.getSellerProduct(user, productId);
    await this.getSellerVariant(productId, variantId);

    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault === true) {
        await tx.productVariant.updateMany({
          where: { productId },
          data: { isDefault: false },
        });
      }

      return tx.productVariant.update({
        where: { id: variantId },
        data: {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.options !== undefined
            ? { options: dto.options as Prisma.InputJsonValue }
            : {}),
          ...(dto.priceDelta !== undefined ? { priceDelta: dto.priceDelta } : {}),
          ...(dto.stockQty !== undefined ? { stockQty: dto.stockQty } : {}),
          ...(dto.sku !== undefined ? { sku: dto.sku } : {}),
          ...(dto.isDefault !== undefined ? { isDefault: dto.isDefault } : {}),
        },
      });
    });
  }

  async deleteVariantForSeller(user: RequestUser, productId: string, variantId: string) {
    await this.getSellerProduct(user, productId);
    const variant = await this.getSellerVariant(productId, variantId);

    return this.prisma.$transaction(async (tx) => {
      await tx.productVariant.delete({ where: { id: variantId } });
      if (variant.isDefault) {
        const next = await tx.productVariant.findFirst({
          where: { productId },
          orderBy: { createdAt: 'asc' },
        });
        if (next) {
          await tx.productVariant.update({
            where: { id: next.id },
            data: { isDefault: true },
          });
        }
      }
      return { success: true };
    });
  }

  private pickProductUpdate(dto: UpdateProductDto) {
    const data: Prisma.ProductUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.categoryId !== undefined) data.category = dto.categoryId
      ? { connect: { id: dto.categoryId } }
      : { disconnect: true };
    if (dto.price !== undefined) data.price = dto.price;
    if (dto.comparePrice !== undefined) data.comparePrice = dto.comparePrice;
    if (dto.stockQty !== undefined) data.stockQty = dto.stockQty;
    if (dto.sku !== undefined) data.sku = dto.sku;
    if (dto.images !== undefined) data.images = dto.images;
    if (dto.status !== undefined) data.status = dto.status;
    return data;
  }

  private async getSellerProduct(user: RequestUser, id: string) {
    if (!user.sellerId) throw new ForbiddenException('Seller profile required');
    const product = await this.prisma.product.findFirst({
      where: { id, sellerId: user.sellerId },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  private async getSellerVariant(productId: string, variantId: string) {
    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variantId, productId },
    });
    if (!variant) throw new NotFoundException('Variant not found');
    return variant;
  }

  /** Used by cart/orders ? validates stock, returns internal row */
  async getPublishedForPurchase(productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, status: 'published' },
    });
    if (!product) throw new NotFoundException(`Product ${productId} not available`);
    return product;
  }
}
