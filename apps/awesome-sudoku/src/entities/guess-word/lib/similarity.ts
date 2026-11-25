export interface WordVectors {
  values: Int8Array;
  norms: Float32Array;
  dimensions: number;
}

const PERCENT = 100;
const DISPLAY_SCALE = 100;

function valueAt(array: Int8Array | Float32Array, index: number): number {
  return array[index] ?? 0;
}

function rowNorm(values: Int8Array, offset: number, dimensions: number): number {
  let sum = 0;
  for (let i = 0; i < dimensions; i += 1) sum += valueAt(values, offset + i) ** 2;
  return Math.sqrt(sum);
}

function rowDot(values: Int8Array, offsetA: number, offsetB: number, dimensions: number): number {
  let dot = 0;
  for (let i = 0; i < dimensions; i += 1) dot += valueAt(values, offsetA + i) * valueAt(values, offsetB + i);
  return dot;
}

export function createWordVectors(values: Int8Array, dimensions: number): WordVectors {
  const norms = Float32Array.from({ length: values.length / dimensions }, (_, row) =>
    rowNorm(values, row * dimensions, dimensions),
  );
  return { values, norms, dimensions };
}

export function similaritiesTo({ values, norms, dimensions }: WordVectors, target: number): Float32Array {
  const targetNorm = valueAt(norms, target);
  return Float32Array.from({ length: norms.length }, (_, row) => {
    const denominator = valueAt(norms, row) * targetNorm;
    return denominator > 0 ? rowDot(values, row * dimensions, target * dimensions, dimensions) / denominator : 0;
  });
}

export function foldSenses(rowSimilarities: Float32Array, wordCount: number, senseOwners: number[]): Float32Array {
  const similarities = rowSimilarities.slice(0, wordCount);
  senseOwners.forEach((owner, sense) => {
    similarities[owner] = Math.max(valueAt(similarities, owner), valueAt(rowSimilarities, wordCount + sense));
  });
  return similarities;
}

export function elementwiseMax(arrays: Float32Array[]): Float32Array {
  const [first = new Float32Array(), ...rest] = arrays;
  return first.map((value, index) => Math.max(value, ...rest.map((array) => valueAt(array, index))));
}

export function nearestNeighbors(similarities: Float32Array, target: number, limit: number): number[] {
  return Array.from(similarities.keys())
    .filter((index) => index !== target)
    .sort((a, b) => valueAt(similarities, b) - valueAt(similarities, a))
    .slice(0, limit);
}

export function toDisplaySimilarity(similarity: number): number {
  return Math.round(similarity * PERCENT * DISPLAY_SCALE) / DISPLAY_SCALE;
}
