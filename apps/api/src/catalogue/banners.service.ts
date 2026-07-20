import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CacheService } from '../cache/cache.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BannersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  listActive() {
    return this.cache.wrap('catalogue:banners', 60, async () => {
      const now = new Date();
      return this.prisma.banner.findMany({
      where: {
        isActive: true,
        OR: [
          { activeFrom: null, activeUntil: null },
          { activeFrom: { lte: now }, activeUntil: null },
          { activeFrom: null, activeUntil: { gte: now } },
          { activeFrom: { lte: now }, activeUntil: { gte: now } },
        ],
      },
      orderBy: { sortOrder: 'asc' },
      });
    });
  }

  listAll() {
    return this.prisma.banner.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  private async bustCatalogueCache() {
    await this.cache.del('catalogue:banners', 'catalogue:featured');
  }

  async create(data: {
    title?: string;
    imageUrl: string;
    linkUrl?: string;
    sortOrder?: number;
    activeFrom?: Date;
    activeUntil?: Date;
  }) {
    const row = await this.prisma.banner.create({ data });
    await this.bustCatalogueCache();
    return row;
  }

  async update(
    id: string,
    data: Partial<{
      title: string;
      imageUrl: string;
      linkUrl: string;
      sortOrder: number;
      isActive: boolean;
      activeFrom: Date | null;
      activeUntil: Date | null;
    }>,
  ) {
    await this.ensure(id);
    const row = await this.prisma.banner.update({ where: { id }, data });
    await this.bustCatalogueCache();
    return row;
  }

  async remove(id: string) {
    await this.ensure(id);
    const row = await this.prisma.banner.update({ where: { id }, data: { isActive: false } });
    await this.bustCatalogueCache();
    return row;
  }

  listFeatured() {
    return this.cache.wrap('catalogue:featured', 60, () =>
      this.prisma.featuredListing.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            price: true,
            images: true,
            ownerType: true,
            status: true,
          },
        },
      },
      }),
    );
  }

  async setFeatured(productIds: string[]) {
    if (productIds.length > 8) {
      throw new BadRequestException('Maximum 8 featured products');
    }
    await this.prisma.featuredListing.deleteMany({});
    const result = await this.prisma.featuredListing.createMany({
      data: productIds.map((productId, i) => ({
        productId,
        sortOrder: i,
        isActive: true,
      })),
    });
    await this.bustCatalogueCache();
    return result;
  }

  private async ensure(id: string) {
    const b = await this.prisma.banner.findUnique({ where: { id } });
    if (!b) throw new NotFoundException('Banner not found');
  }
}
