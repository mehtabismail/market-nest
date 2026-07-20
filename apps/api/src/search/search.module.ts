import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmbeddingsService } from './embeddings.service';
import { EmbeddingProcessor } from './embedding.processor';
import { SemanticSearchService } from './semantic-search.service';
import { SearchController } from './search.controller';

const redisUrl = process.env.REDIS_URL;
const hasOpenAi = Boolean(process.env.OPENAI_API_KEY);

@Module({
  imports: [NotificationsModule],
  controllers: [SearchController],
  providers: [
    EmbeddingsService,
    SemanticSearchService,
    ...(redisUrl && hasOpenAi ? [EmbeddingProcessor] : []),
  ],
  exports: [EmbeddingsService, SemanticSearchService],
})
export class SearchModule {}
