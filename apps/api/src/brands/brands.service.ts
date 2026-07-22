import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Brands with at least one published product.
   *
   * The filter matters: the "Top Brands" row is a navigation affordance, and a
   * brand chip that leads to an empty results page is worse than no chip.
   */
  listPublic() {
    return this.prisma.brand.findMany({
      where: { isActive: true, products: { some: { status: 'published' } } },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, slug: true, logoUrl: true },
    });
  }

  /** Admin view — unfiltered, with product counts for the management table. */
  listAll() {
    return this.prisma.brand.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { products: true } } },
    });
  }

  create(data: { name: string; slug?: string; logoUrl?: string; sortOrder?: number }) {
    return this.prisma.brand.create({
      data: {
        name: data.name,
        slug: data.slug?.trim() || slugify(data.name),
        logoUrl: data.logoUrl ?? null,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  }

  update(id: string, data: Prisma.BrandUpdateInput) {
    return this.prisma.brand.update({ where: { id }, data });
  }

  /**
   * Deactivates rather than deletes.
   *
   * Products carry a `brand_id`, and a hard delete would either orphan them or
   * cascade into the catalogue. Deactivating hides the brand from the shop and
   * leaves historical product associations intact.
   */
  deactivate(id: string) {
    return this.prisma.brand.update({ where: { id }, data: { isActive: false } });
  }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
