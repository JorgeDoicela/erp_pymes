-- Habilitar extensión vectorial pgvector en PostgreSQL 15
CREATE EXTENSION IF NOT EXISTS vector;

-- Agregar huella SHA-256 de contenido y vector denso 768-dim (intfloat/multilingual-e5-base fine-tuned)
ALTER TABLE "knowledge_chunks"
  ADD COLUMN IF NOT EXISTS "contentHash" TEXT,
  ADD COLUMN IF NOT EXISTS "embedding" vector(768);

-- Índice de búsqueda por hash para sincronización idempotente del corpus
CREATE INDEX IF NOT EXISTS "knowledge_chunks_contentHash_idx"
  ON "knowledge_chunks"("contentHash");

-- Índice vectorial HNSW (similitud coseno) para búsqueda semántica sub-10ms en PostgreSQL
CREATE INDEX IF NOT EXISTS "knowledge_chunks_embedding_hnsw_idx"
  ON "knowledge_chunks" USING hnsw ("embedding" vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Índice funcional GIN Full-Text Search en español (evita columnas generadas no mapeadas en Prisma)
CREATE INDEX IF NOT EXISTS "knowledge_chunks_fts_es_gin_idx"
  ON "knowledge_chunks" USING gin (
    to_tsvector('spanish', coalesce("articleCode", '') || ' ' || "content")
  );
