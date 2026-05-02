export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must be of the same length');
  }
  
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }
  
  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);
  
  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }
  
  return dotProduct / (magnitudeA * magnitudeB);
}

const STOP_WORDS = new Set(['the', 'is', 'at', 'which', 'on', 'in', 'a', 'an', 'near', 'by', 'of', 'and', 'for', 'to']);

export function calculateKeywordOverlap(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;
  
  const extractKeywords = (text: string) => {
    return new Set(
      text.toLowerCase()
          .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
          .split(/\s+/)
          .filter(word => word.length > 2 && !STOP_WORDS.has(word))
    );
  };

  const words1 = extractKeywords(text1);
  const words2 = extractKeywords(text2);

  if (words1.size === 0 || words2.size === 0) return 0;

  let overlap = 0;
  Array.from(words1).forEach(word => {
    if (words2.has(word)) overlap++;
  });

  // Jaccard similarity
  return overlap / (words1.size + words2.size - overlap);
}
