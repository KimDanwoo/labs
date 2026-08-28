/**
 * 면접 핸드북 마크다운을 학습 단계로 분해한다.
 *
 * 계층은 "주제 레벨"을 기준으로 상대적으로 읽는다. 문서가 `#`을 주제로 쓰든 `##`을 쓰든 따라간다.
 *   주제        문서에서 처음 번호가 붙은 제목의 레벨. 그 레벨의 제목은 전부 주제다
 *   역할 섹션   주제보다 한 단계 깊은 제목. 키워드 / 답변 / 꼬리질문 / 나머지(참고 자료)로 갈린다
 *   꼬리질문    `## 꼬리`·`## 꼬꼬무` 안의 목록이나 한 단계 깊은 제목, 또는 물음표로 끝나는 섹션 제목 자체
 *
 * 특수 문법은 없다. 제목 텍스트만으로 역할을 판별한다.
 */

export const STEP_KIND = {
  keywords: 'keywords',
  answer: 'answer',
  followUp: 'followUp',
} as const;

export type StepKind = (typeof STEP_KIND)[keyof typeof STEP_KIND];

export type StudyStep = {
  id: string;
  kind: StepKind;
  /** 카드 상단에 크게 보여줄 질문 또는 지시문 */
  prompt: string;
  /** 키워드 카드에서 곧바로 노출할 키워드들 */
  keywords: string[];
  /** 답 확인 시 펼칠 마크다운 */
  reveal: string;
};

export type StudyTopic = {
  id: string;
  title: string;
  steps: StudyStep[];
  /** 배경 설명 — 카드 하단에서 필요할 때만 펼친다. */
  notes: string;
};

export type StudyDoc = {
  slug: string;
  title: string;
  intro: string;
  topics: StudyTopic[];
};

type SectionRole = 'keyword' | 'answer' | 'followUp' | 'question' | 'note';

type Section = { heading: string; body: string };

type FollowUp = { question: string; answer: string };

type Block = { level: number; heading: string; body: string };

type TopicDraft = {
  title: string;
  lead: string;
  keywordItems: string[];
  answers: Section[];
  followUps: FollowUp[];
  notes: Section[];
};

const MAX_HEADING_LEVEL = 6;
const DEFAULT_TOPIC_LEVEL = 2;

const FENCE_PATTERN = /^\s*(?:```|~~~)/;
const ANY_HEADING_PATTERN = /^(#{1,6})\s+(.+?)\s*#*\s*$/;
const TOPIC_NUMBER_PATTERN = /^\d+[.)]\s+/;
const QUESTION_HEADING_PATTERN = /[?？]\s*$/;
const TRAILING_RULE_PATTERN = /\n*[-*_]{3,}\s*$/;
const LIST_MARKER_PATTERN = /^[-*+]\s+/;
const ORDERED_MARKER_PATTERN = /^\d+\.\s+/;
const ARROW_PREFIX_PATTERN = /^→\s*/;
/** 꼬꼬무 안의 주의·참고류 제목은 질문이 아니라 직전 답변에 붙는 경고다. */
const FOLLOW_UP_NOTE_PATTERN = /^(주의|위험|경고|금지|참고|중요)/;
/** 꼬리질문 답변 첫 줄의 `키워드: a, b, c`는 본문이 아니라 그 질문의 키워드 목록이다. */
const KEYWORD_LINE_PATTERN = /^키워드\s*[:：]\s*(.+)$/;

/** 답변 첫 비어있지 않은 줄이 키워드 줄이면 분리해서 반환한다. */
function extractKeywordLine(answer: string): { keywords: string[]; body: string } {
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

function matchHeading(line: string): Pick<Block, 'level' | 'heading'> | null {
  const matched = ANY_HEADING_PATTERN.exec(line);
  if (!matched) return null;

  const hashes = matched[1];
  const heading = matched[2];
  if (!hashes || !heading) return null;

  return { level: hashes.length, heading };
}

/** 처음으로 번호가 붙은 제목의 레벨이 주제 레벨이다. 번호 제목이 없으면 문서 첫 제목의 레벨을 따른다. */
function findTopicLevel(markdown: string): number {
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

const ANSWER_HEADINGS = ['설명', '개념', '첫문장'];

function classifySection(heading: string): SectionRole {
  const text = heading.replace(/\s+/g, '');
  // `Why 1 — 왜 리팩터링이 아니었나요?`처럼 제목이 곧 질문이면 본문이 그 답이다.
  if (QUESTION_HEADING_PATTERN.test(heading)) return 'question';
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
function extractItems(body: string): string[] {
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

/** 꼬꼬무 섹션: 질문 제목이 있으면 답까지, 불릿 목록이면 질문만 뽑는다. */
function splitFollowUps(body: string, questionLevel: number): FollowUp[] {
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

/** 역할 섹션보다 깊은 제목은 그 섹션의 본문으로 남긴다. */
function splitBlocks(markdown: string, maxLevel: number): { intro: string; blocks: Block[] } {
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

function createDraft(title: string, lead: string): TopicDraft {
  return { title, lead, keywordItems: [], answers: [], followUps: [], notes: [] };
}

function addSection(draft: TopicDraft, section: Section, followUpLevel: number): void {
  const role = classifySection(section.heading);
  if (role === 'keyword') {
    draft.keywordItems.push(...extractItems(section.body));
    return;
  }
  if (role === 'followUp') {
    draft.followUps.push(...splitFollowUps(section.body, followUpLevel));
    return;
  }
  if (role === 'question') {
    draft.followUps.push({ question: section.heading, answer: section.body });
    return;
  }
  if (role === 'answer') {
    draft.answers.push(section);
    return;
  }
  draft.notes.push(section);
}

function buildTopic(draft: TopicDraft, index: number): StudyTopic {
  const steps: StudyStep[] = [];
  const push = (kind: StepKind, prompt: string, reveal: string, keywords: string[] = []) => {
    steps.push({ id: `topic-${index}-step-${steps.length}`, kind, prompt, reveal, keywords });
  };

  const noteParts = draft.notes.map((note) => `### ${note.heading}\n\n${note.body}`);
  if (draft.lead) noteParts.unshift(draft.lead);
  const notes = noteParts.join('\n\n');

  // 답변 섹션이 여러 개여도 카드는 하나다 — 질문 형태가 아닌 제목이 카드로 노출되지 않게
  // 전부 첫 카드의 공개 내용으로 합친다.
  const answerBody =
    draft.answers.length > 1
      ? draft.answers.map((answer) => `**${answer.heading}**\n\n${answer.body}`).join('\n\n')
      : (draft.answers[0]?.body ?? '');

  // 첫 카드는 항상 주제 자체를 묻는다. 모범 답변 섹션이 없으면 배경 섹션이 사실상 답이므로
  // 참고 자료로 미뤄두지 않고 답으로 올린다.
  const openingReveal = answerBody || notes;
  const isNotesConsumed = !answerBody && Boolean(notes);

  if (draft.keywordItems.length > 0) {
    push(STEP_KIND.keywords, draft.title, openingReveal, [...new Set(draft.keywordItems)]);
  } else if (openingReveal) {
    push(STEP_KIND.answer, draft.title, openingReveal);
  }

  for (const followUp of draft.followUps) {
    const { keywords, body } = extractKeywordLine(followUp.answer);
    push(STEP_KIND.followUp, followUp.question, body, [...new Set(keywords)]);
  }

  return { id: `topic-${index}`, title: draft.title, steps, notes: isNotesConsumed ? '' : notes };
}

export function parseStudyDoc(slug: string, markdown: string): StudyDoc {
  const topicLevel = findTopicLevel(markdown);
  const sectionLevel = topicLevel + 1;
  const followUpLevel = topicLevel + 2;

  const { intro, blocks } = splitBlocks(markdown, sectionLevel);

  const introParts = intro ? [intro] : [];
  const drafts: TopicDraft[] = [];
  let title = '';
  let current: TopicDraft | null = null;

  for (const block of blocks) {
    // 주제 레벨의 제목은 전부 주제다. 번호는 주제 레벨을 찾을 때만 쓴다.
    const isTopic = Boolean(title) && block.level <= topicLevel;

    if (isTopic) {
      current = createDraft(block.heading, block.body);
      drafts.push(current);
      continue;
    }

    if (!title && block.level <= topicLevel) {
      title = block.heading;
      if (block.body) introParts.push(block.body);
      continue;
    }

    if (!current) {
      introParts.push(`${'#'.repeat(sectionLevel)} ${block.heading}\n\n${block.body}`);
      continue;
    }
    addSection(current, { heading: block.heading, body: block.body }, followUpLevel);
  }

  return {
    slug,
    title: title || slug,
    intro: introParts.join('\n\n'),
    topics: drafts.map(buildTopic).filter((topic) => topic.steps.length > 0),
  };
}

export function countSteps(doc: StudyDoc): number {
  return doc.topics.reduce((sum, topic) => sum + topic.steps.length, 0);
}
