import { GoogleGenerativeAI, TaskType } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

/** Matches Postgres `vector(768)` on reports.embedding */
export const EMBEDDING_DIMENSIONS = 768;

/**
 * Truncate + L2-normalize so embeddings always fit our 768-dim column.
 * gemini-embedding-001 defaults to 3072; MRL allows safe prefix truncation.
 */
export function fitEmbeddingDimensions(
  values: number[],
  dims: number = EMBEDDING_DIMENSIONS
): number[] {
  if (!values?.length) return [];

  const truncated = values.length > dims ? values.slice(0, dims) : values.slice();

  // Pad only if somehow short (shouldn't happen with Gemini)
  while (truncated.length < dims) truncated.push(0);

  let norm = 0;
  for (let i = 0; i < truncated.length; i++) {
    norm += truncated[i] * truncated[i];
  }
  norm = Math.sqrt(norm);

  if (norm === 0 || !Number.isFinite(norm)) {
    return truncated;
  }

  return truncated.map((v) => v / norm);
}

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });

    // Request 768 dims when the API supports it (passed through JSON body).
    // SDK types omit outputDimensionality — cast is intentional.
    const result = await model.embedContent({
      content: { role: 'user', parts: [{ text }] },
      taskType: TaskType.SEMANTIC_SIMILARITY,
      outputDimensionality: EMBEDDING_DIMENSIONS,
    } as Parameters<typeof model.embedContent>[0]);

    const raw = result.embedding?.values ?? [];
    return fitEmbeddingDimensions(raw, EMBEDDING_DIMENSIONS);
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}
