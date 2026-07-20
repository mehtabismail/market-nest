import { Injectable } from '@nestjs/common';
import { Prisma, ProductOwnerType, ProductStatus } from '@prisma/client';
import type { BuyerProductListItemDTO } from '@marketnest/shared-types';
import { PrismaService } from '../prisma/prisma.service';
import { toBuyerProductListItemDTO } from '../products/buyer-product.mapper';
import { EmbeddingsService } from './embeddings.service';

type SemanticRow = {
  id: string;
  title: string;
  description: string | null;
  price: unknown;
  compare_price: unknown;
  stock_qty: number;
  sku: string | null;
  images: unknown;
  category_id: string | null;
  status: string;
  owner_type: string;
  similarity: number;
};

@Injectable()
export class SemanticSearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddings: EmbeddingsService,
  ) {}

  async search(
    query: string,
    limit = 20,
  ): Promise<{ items: BuyerProductListItemDTO[]; mode: 'semantic' | 'text' }> {
    if (this.embeddings.isConfigured()) {
      try {
        const vector = await this.embeddings.createEmbedding(query);
        const literal = `[${vector.join(',')}]`;
        const rows = await this.prisma.$queryRawUnsafe<SemanticRow[]>(
          `SELECT id, title, description, price, compare_price, stock_qty, sku, images,
                  category_id, status, owner_type,
                  1 - (embedding <=> $1::vector) AS similarity
           FROM products
           WHERE status = 'published' AND embedding IS NOT NULL
           ORDER BY embedding <=> $1::vector
           LIMIT $2`,
          literal,
          limit,
        );

        if (rows.length > 0) {
          const semanticItems = rows.map((r) =>
            toBuyerProductListItemDTO({
              id: r.id,
              title: r.title,
              description: r.description,
              price: r.price as Prisma.Decimal,
              comparePrice: r.compare_price as Prisma.Decimal | null,
              stockQty: r.stock_qty,
              sku: r.sku,
              images: r.images as Prisma.JsonValue,
              categoryId: r.category_id,
              status: r.status as ProductStatus,
              ownerType: r.owner_type as ProductOwnerType,
            }),
          );

          if (semanticItems.length >= 3) {
            return {
              mode: 'semantic',
              items: semanticItems,
            };
          }

          const textItems = await this.textSearch(query, limit);
          const seen = new Set(semanticItems.map((item) => item.id));
          const merged = [...semanticItems];
          for (const textItem of textItems) {
            if (seen.has(textItem.id)) continue;
            merged.push(textItem);
            seen.add(textItem.id);
            if (merged.length >= limit) break;
          }

          return {
            mode: 'semantic',
            items: merged,
          };
        }
      } catch {
        /* fall through to text search */
      }
    }

    return {
      mode: 'text',
      items: await this.textSearch(query, limit),
    };
  }

  private async textSearch(query: string, limit: number): Promise<BuyerProductListItemDTO[]> {
    const products = await this.prisma.product.findMany({
      where: {
        status: 'published',
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
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
      },
      take: limit,
      orderBy: { updatedAt: 'desc' },
    });

    return products.map((p) => toBuyerProductListItemDTO(p));
  }
}
