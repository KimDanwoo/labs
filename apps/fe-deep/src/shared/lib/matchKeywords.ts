export type KeywordMatch = { keyword: string; isMatched: boolean };

/** 토큰 끝의 한 글자 조사는 떼고 비교한다 — "구조와"가 "구조를"과도 맞게. */
const TRAILING_PARTICLE_PATTERN = /[와과을를이가은는의에로도]$/;
/** 구문형 키워드를 의미 단위로 쪼개는 구분자. */
const TOKEN_SEPARATOR_PATTERN = /[\s/·,()]+/;

/**
 * 대소문자·공백 차이를 무시하고 recall 텍스트에 키워드가 언급됐는지 검사한다.
 * 여러 단어로 된 키워드는 토큰 과반이 등장하면 매칭으로 본다 — 문구 그대로 말하지 않아도 개념을 언급했으면 인정.
 */
export function matchKeywords(keywords: string[], recall: string): KeywordMatch[] {
  const normalizedRecall = normalize(recall);

  return keywords.map((keyword) => {
    const tokens = toTokens(keyword);
    if (tokens.length === 0) return { keyword, isMatched: normalizedRecall.includes(normalize(keyword)) };

    const hitCount = tokens.filter((token) => normalizedRecall.includes(token)).length;
    return { keyword, isMatched: hitCount * 2 >= tokens.length };
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
