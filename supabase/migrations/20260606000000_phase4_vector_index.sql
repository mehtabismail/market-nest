-- Phase 4: pgvector index for semantic product search
-- Safe if DB was created via Prisma (embedding column may be missing)

CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

CREATE INDEX IF NOT EXISTS products_embedding_hnsw_idx
  ON products
  USING hnsw (embedding vector_cosine_ops)
  WHERE embedding IS NOT NULL AND status = 'published';
