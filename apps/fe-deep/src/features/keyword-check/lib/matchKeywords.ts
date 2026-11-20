type KeywordMatch = { keyword: string; isMatched: boolean };

const TRAILING_PARTICLE_PATTERN = /[와과을를이가은는의에로도]$/;
const TOKEN_SEPARATOR_PATTERN = /[\s/·,()]+/;

const isMajority = (count: number, total: number): boolean => count * 2 >= total;

export function matchKeywords(keywords: string[], recall: string): KeywordMatch[] {
  const normalizedRecall = normalize(recall);

  return keywords.map((keyword) => {
    const tokens = toTokens(keyword);
    if (tokens.length === 0) return { keyword, isMatched: normalizedRecall.includes(normalize(keyword)) };

    const hitCount = tokens.filter((token) => normalizedRecall.includes(token)).length;
    return { keyword, isMatched: isMajority(hitCount, tokens.length) };
  });
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '');
}

function toTokens(keyword: string): string[] {
  return keyword
    .split(TOKEN_SEPARATOR_PATTERN)
    .map((token) => (token.length >= 3 ? token.replace(TRAILING_PARTICLE_PATTERN, '') : token))
    .map(normalize)
    .filter((token) => token.length >= 2);
}
