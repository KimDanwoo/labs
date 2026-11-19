import {
  ARROW_PREFIX_PATTERN,
  FENCE_PATTERN,
  FOLLOW_UP_NOTE_PATTERN,
  LIST_MARKER_PATTERN,
  MAX_HEADING_LEVEL,
  ORDERED_MARKER_PATTERN,
  QUESTION_HEADING_PATTERN,
  TRAILING_RULE_PATTERN,
  matchHeading,
} from './handbookLines';

type SectionRole = 'keyword' | 'answer' | 'mistake' | 'improve' | 'followUp' | 'question' | 'note';
export type Section = { heading: string; body: string };
export type FollowUp = { question: string; answer: string };

export type Block = { level: number; heading: string; body: string };
const ANSWER_HEADINGS = ['설명', '개념', '첫문장'];
export function classifySection(heading: string): SectionRole {
  const text = heading.replace(/\s+/g, '');
  if (QUESTION_HEADING_PATTERN.test(heading)) return 'question';
  if (text.includes('오답')) return 'mistake';
  if (text.includes('보완')) return 'improve';
  if (text.includes('꼬꼬무') || text.includes('꼬리')) return 'followUp';
  if (text.includes('키워드') || text.includes('암기')) return 'keyword';
  if (text.includes('나쁜')) return 'note';
  if (text.includes('답변') || text.includes('한줄') || ANSWER_HEADINGS.includes(text)) return 'answer';
  return 'note';
}
/** 목록 마커가 붙은 줄만 뽑는다. 섹션 안내 문장이 질문으로 섞이는 걸 막는다. */
function extractListItems(body: string): string[] {
  return body
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => LIST_MARKER_PATTERN.test(line) || ORDERED_MARKER_PATTERN.test(line))
    .map((line) => line.replace(LIST_MARKER_PATTERN, '').replace(ORDERED_MARKER_PATTERN, '').trim())
    .filter(Boolean);
}
/**
 * 불릿 목록이든 코드펜스 안의 화살표 흐름이든 항목 배열로 만든다.
 * 펜스 안은 한 줄이 항목 하나, 펜스 밖은 목록 마커가 붙은 줄만 — 안내 문장이 항목으로 섞이지 않게.
 */
export function extractItems(body: string): string[] {
  const items: string[] = [];
  let isInFence = false;

  for (const raw of body.split('\n')) {
    if (FENCE_PATTERN.test(raw)) {
      isInFence = !isInFence;
      continue;
    }
    const line = raw.trim();
    if (!line) continue;

    if (isInFence) {
      items.push(line.replace(ARROW_PREFIX_PATTERN, '').trim());
    } else if (LIST_MARKER_PATTERN.test(line) || ORDERED_MARKER_PATTERN.test(line)) {
      items.push(line.replace(LIST_MARKER_PATTERN, '').replace(ORDERED_MARKER_PATTERN, '').trim());
    }
  }

  return items.filter(Boolean);
}
export function splitFollowUps(body: string, questionLevel: number): FollowUp[] {
  const questionPattern = new RegExp(`^#{${Math.min(questionLevel, MAX_HEADING_LEVEL)}}\\s+(.+?)\\s*#*\\s*$`);
  const items: FollowUp[] = [];
  let current: FollowUp | null = null;
  let answerLines: string[] = [];
  let isInFence = false;

  const flush = () => {
    if (current) items.push({ ...current, answer: answerLines.join('\n').trim() });
    answerLines = [];
  };

  for (const line of body.split('\n')) {
    if (FENCE_PATTERN.test(line)) isInFence = !isInFence;

    const question = isInFence ? null : questionPattern.exec(line)?.[1];
    if (question) {
      if (FOLLOW_UP_NOTE_PATTERN.test(question)) {
        answerLines.push(`**${question}**`);
        continue;
      }
      flush();
      current = { question, answer: '' };
      continue;
    }
    if (current) answerLines.push(line);
  }
  flush();

  if (items.length > 0) return items;
  return extractListItems(body).map((question) => ({ question, answer: '' }));
}
export function splitBlocks(markdown: string, maxLevel: number): { intro: string; blocks: Block[] } {
  const blocks: Block[] = [];
  const introLines: string[] = [];
  let current: Pick<Block, 'level' | 'heading'> | null = null;
  let bodyLines: string[] = [];
  let isInFence = false;

  const flush = () => {
    if (current) blocks.push({ ...current, body: bodyLines.join('\n').trim().replace(TRAILING_RULE_PATTERN, '') });
    bodyLines = [];
  };

  for (const line of markdown.split('\n')) {
    if (FENCE_PATTERN.test(line)) isInFence = !isInFence;

    const heading = isInFence ? null : matchHeading(line);
    if (heading && heading.level <= maxLevel) {
      flush();
      current = heading;
      continue;
    }

    if (current) bodyLines.push(line);
    else introLines.push(line);
  }
  flush();

  return { intro: introLines.join('\n').trim().replace(TRAILING_RULE_PATTERN, ''), blocks };
}
