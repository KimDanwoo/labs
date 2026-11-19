import type { Block } from './handbookSections';

export const MAX_HEADING_LEVEL = 6;
const DEFAULT_TOPIC_LEVEL = 2;
export const FENCE_PATTERN = /^\s*(?:```|~~~)/;
const ANY_HEADING_PATTERN = /^(#{1,6})\s+(.+?)\s*#*\s*$/;
const TOPIC_NUMBER_PATTERN = /^\d+[.)]\s+/;
export const QUESTION_HEADING_PATTERN = /[?？]\s*$/;
export const TRAILING_RULE_PATTERN = /\n*[-*_]{3,}\s*$/;
export const LIST_MARKER_PATTERN = /^[-*+]\s+/;
export const ORDERED_MARKER_PATTERN = /^\d+\.\s+/;
export const ARROW_PREFIX_PATTERN = /^→\s*/;
const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/;
const DATE_FIELD_PATTERN = /^date:\s*(\d{4}-\d{2}-\d{2})\s*$/m;
/** 꼬꼬무 안의 주의·참고류 제목은 질문이 아니라 직전 답변에 붙는 경고다. */
export const FOLLOW_UP_NOTE_PATTERN = /^(주의|위험|경고|금지|참고|중요)/;
/** 꼬리질문 답변 첫 줄의 `키워드: a, b, c`는 본문이 아니라 그 질문의 키워드 목록이다. */
const KEYWORD_LINE_PATTERN = /^키워드\s*[:：]\s*(.+)$/;
export function extractKeywordLine(answer: string): { keywords: string[]; body: string } {
  const lines = answer.split('\n');
  const firstIndex = lines.findIndex((line) => line.trim());
  const first = firstIndex >= 0 ? lines[firstIndex]?.trim() : undefined;
  const matched = first ? KEYWORD_LINE_PATTERN.exec(first) : null;
  if (!matched?.[1]) return { keywords: [], body: answer };

  return {
    keywords: matched[1]
      .split(/[,·]/)
      .map((keyword) => keyword.trim())
      .filter(Boolean),
    body: lines
      .slice(firstIndex + 1)
      .join('\n')
      .trim(),
  };
}
export function matchHeading(line: string): Pick<Block, 'level' | 'heading'> | null {
  const matched = ANY_HEADING_PATTERN.exec(line);
  if (!matched) return null;

  const hashes = matched[1];
  const heading = matched[2];
  if (!hashes || !heading) return null;

  return { level: hashes.length, heading };
}
export function findTopicLevel(markdown: string): number {
  let isInFence = false;
  let firstHeadingLevel: number | null = null;

  for (const line of markdown.split('\n')) {
    if (FENCE_PATTERN.test(line)) {
      isInFence = !isInFence;
      continue;
    }
    if (isInFence) continue;

    const heading = matchHeading(line);
    if (!heading) continue;
    if (TOPIC_NUMBER_PATTERN.test(heading.heading)) return heading.level;
    firstHeadingLevel ??= heading.level;
  }

  return firstHeadingLevel ?? DEFAULT_TOPIC_LEVEL;
}
export function splitFrontmatter(raw: string): { date: string | null; markdown: string } {
  const matched = FRONTMATTER_PATTERN.exec(raw);
  if (!matched) return { date: null, markdown: raw };

  const date = DATE_FIELD_PATTERN.exec(matched[1] ?? '')?.[1] ?? null;
  return { date, markdown: raw.slice(matched[0].length) };
}
