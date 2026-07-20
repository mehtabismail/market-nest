import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, Optional } from '@nestjs/common';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { QUEUE_EMBEDDING } from './search.constants';

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIM = 1536;

@Injectable()
export class EmbeddingsService {
  private readonly logger = new Logger(EmbeddingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() @InjectQueue(QUEUE_EMBEDDING) private readonly queue?: Queue,
  ) {}

  isConfigured(): boolean {
    return Boolean(process.env.OPENAI_API_KEY);
  }

  async enqueue(productId: string): Promise<void> {
    if (!this.isConfigured() || !this.queue) return;
    await this.queue.add(
      'embed-product',
      { productId },
      { removeOnComplete: 100, attempts: 3, backoff: { type: 'exponential', delay: 2000 } },
    );
  }

  async enqueueAllPublished(): Promise<{ queued: number }> {
    const products = await this.prisma.product.findMany({
      where: { status: 'published' },
      select: { id: true },
    });
    for (const p of products) {
      await this.enqueue(p.id);
    }
    return { queued: products.length };
  }

  async embedAndStore(productId: string): Promise<boolean> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, title: true, description: true, status: true },
    });
    if (!product || product.status !== 'published') return false;

    const text = [product.title, product.description ?? ''].filter(Boolean).join('\n');
    const vector = await this.createEmbedding(text);
    await this.storeEmbedding(productId, vector);
    return true;
  }

  async createEmbedding(text: string): Promise<number[]> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: EMBEDDING_MODEL, input: text.slice(0, 8000) }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI embeddings failed: ${err}`);
    }

    const data = (await res.json()) as {
      data: { embedding: number[] }[];
    };
    const embedding = data.data[0]?.embedding;
    if (!embedding?.length) {
      throw new Error('Empty embedding response');
    }
    if (embedding.length !== EMBEDDING_DIM) {
      this.logger.warn(`Expected ${EMBEDDING_DIM} dims, got ${embedding.length}`);
    }
    return embedding;
  }

  async storeEmbedding(productId: string, values: number[]): Promise<void> {
    const literal = `[${values.join(',')}]`;
    await this.prisma.$executeRawUnsafe(
      `UPDATE products SET embedding = $1::vector, updated_at = NOW() WHERE id = $2::uuid`,
      literal,
      productId,
    );
  }
}
