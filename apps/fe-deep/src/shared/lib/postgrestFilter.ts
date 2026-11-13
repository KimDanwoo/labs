const LIKE_WILDCARDS = /[%_\\]/g;
const QUOTE_BREAKERS = /[\\"]/g;

/** 쉼표·괄호·중괄호가 든 값이 `.or()` 필터 문법으로 읽히지 않게 큰따옴표로 감싼다. */
const quote = (value: string): string => `"${value.replace(QUOTE_BREAKERS, '\\$&')}"`;

/**
 * `.or()`에 넣는 부분 일치 패턴(`question.ilike.${toContainsPattern(text)}`). `%`·`_`는 글자 그대로 찾는다.
 * `*`만은 PostgREST가 인용과 무관하게 와일드카드로 바꾼다 — 글자 그대로 찾을 방법이 없다.
 */
export const toContainsPattern = (text: string): string => quote(`%${text.replace(LIKE_WILDCARDS, '\\$&')}%`);

export const toSingleItemArray = (item: string): string => quote(`{${quote(item)}}`);
