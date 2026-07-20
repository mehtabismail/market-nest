import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EmbeddingsService } from './embeddings.service';
import { QUEUE_EMBEDDING } from './search.constants';

@Processor(QUEUE_EMBEDDING)
export class EmbeddingProcessor extends WorkerHost {
  private readonly logger = new Logger(EmbeddingProcessor.name);

  constructor(private readonly embeddings: EmbeddingsService) {
    super();
  }

  async process(job: Job<{ productId: string }>) {
    try {
      await this.embeddings.embedAndStore(job.data.productId);
    } catch (err) {
      this.logger.warn(
        `Embedding job failed for ${job.data.productId}: ${err instanceof Error ? err.message : err}`,
      );
      throw err;
    }
  }
}
