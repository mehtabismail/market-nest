import { Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { EmbeddingsService } from './embeddings.service';
import { SemanticSearchService } from './semantic-search.service';

@ApiTags('search')
@Controller()
export class SearchController {
  constructor(
    private readonly semantic: SemanticSearchService,
    private readonly embeddings: EmbeddingsService,
  ) {}

  @Public()
  @Get('search/products')
  searchProducts(@Query('q') q?: string, @Query('limit') limit?: number) {
    const query = (q ?? '').trim();
    if (!query) {
      return { items: [], mode: 'text' as const, total: 0 };
    }
    return this.semantic.search(query, Math.min(Number(limit) || 20, 50));
  }

  @ApiBearerAuth()
  @Roles('superadmin')
  @Post('admin/search/reindex')
  reindex() {
    return this.embeddings.enqueueAllPublished();
  }

  @Public()
  @Get('search/status')
  status() {
    return {
      embeddingsEnabled: this.embeddings.isConfigured(),
      model: 'text-embedding-3-small',
    };
  }
}
