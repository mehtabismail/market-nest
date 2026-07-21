import { Injectable, NotFoundException } from '@nestjs/common';
import { CacheService } from '../cache/cache.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  listPublic() {
    return this.cache.wrap('catalogue:categories', 60, () =>
      this.prisma.category.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        select: { id: true, name: true, slug: true, parentId: true, imageUrl: true },
      }),
    );
  }

  async create(dto: CreateCategoryDto) {
    const row = await this.prisma.category.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        parentId: dto.parentId,
        imageUrl: dto.imageUrl,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
    await this.cache.del('catalogue:categories');
    return row;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.ensureExists(id);
    const row = await this.prisma.category.update({ where: { id }, data: dto });
    await this.cache.del('catalogue:categories');
    return row;
  }

  async remove(id: string) {
    await this.ensureExists(id);
    const productCount = await this.prisma.product.count({
      where: { categoryId: id, status: { not: 'archived' } },
    });
    if (productCount > 0) {
      throw new NotFoundException('Category has active products — reassign first');
    }
    const row = await this.prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
    await this.cache.del('catalogue:categories');
    return row;
  }

  private async ensureExists(id: string) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found');
  }
}
