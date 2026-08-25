/**
 * 면접 핸드북 마크다운을 학습 단계로 분해한다.
 *
 * 계층은 "주제 레벨"을 기준으로 상대적으로 읽는다. 문서가 `#`을 주제로 쓰든 `##`을 쓰든 따라간다.
 *   주제        번호가 붙은 제목 (`## 1. 자기소개`) — 문서에서 처음 번호가 붙은 제목의 레벨이 기준이 된다
 *   역할 섹션   주제보다 한 단계 깊은 제목. 키워드 / 답변 / 꼬꼬무 / 나머지(참고 자료)로 갈린다
 *   꼬리질문    주제보다 두 단계 깊은 제목. 꼬꼬무 섹션 안에서만 질문으로 읽는다
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

type SectionRole = 'keyword' | 'answer' | 'followUp' | 'note';

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
const TRAILING_RULE_PATTERN = /\n*[-*_]{3,}\s*$/;
const FENCE_WRAPPER_PATTERN = /^```[a-z]*\n|\n?```$/g;
const LIST_MARKER_PATTERN = /^[-*+]\s+/;
const ORDERED_MARKER_PATTERN = /^\d+\.\s+/;
const ARROW_PREFIX_PATTERN = /^→\s*/;

function matchHeading(line: string): Pick<Block, 'level' | 'heading'> | null {
  const matched = ANY_HEADING_PATTERN.exec(line);
  if (!matched) return null;

  const hashes = matched[1];
  const heading = matched[2];
  if (!hashes || !heading) return null;

  return { level: hashes.length, heading };
}

/** 문서에서 처음으로 번호가 붙은 제목의 레벨이 주제 레벨이다. */
function findTopicLevel(markdown: string): number {
  let isInFence = false;

  for (const line of markdown.split('\n')) {
    if (FENCE_PATTERN.test(line)) {
      isInFence = !isInFence;
      continue;
    }
    if (isInFence) continue;

    const heading = matchHeading(line);
    if (heading && TOPIC_NUMBER_PATTERN.test(heading.heading)) return heading.level;
  }

  return DEFAULT_TOPIC_LEVEL;
}

function classifySection(heading: string): SectionRole {
  const text = heading.replace(/\s+/g, '');
  if (text.includes('꼬꼬무')) return 'followUp';
  if (text.includes('키워드') || text.includes('암기')) return 'keyword';
  if (text.includes('나쁜')) return 'note';
  if (text.includes('답변') || text.includes('한줄') || text === '설명' || text === '개념') return 'answer';
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

/** 불릿 목록이든 코드펜스 안의 화살표 흐름이든 항목 배열로 만든다. */
function extractItems(body: string): string[] {
  return body
    .replace(FENCE_WRAPPER_PATTERN, '')
    .split('\n')
    .map((line) =>
      line
        .replace(LIST_MARKER_PATTERN, '')
        .replace(ORDERED_MARKER_PATTERN, '')
        .replace(ARROW_PREFIX_PATTERN, '')
        .trim(),
    )
    .filter(Boolean);
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

  const [firstAnswer, ...restAnswers] = draft.answers;

  if (draft.keywordItems.length > 0) {
    push(STEP_KIND.keywords, draft.title, firstAnswer?.body ?? '', draft.keywordItems);
  } else if (firstAnswer) {
    push(STEP_KIND.answer, draft.title, firstAnswer.body);
  }

  for (const answer of restAnswers) {
    push(STEP_KIND.answer, `${draft.title} — ${answer.heading}`, answer.body);
  }

  for (const followUp of draft.followUps) {
    push(STEP_KIND.followUp, followUp.question, followUp.answer);
  }

  const noteParts = draft.notes.map((note) => `### ${note.heading}\n\n${note.body}`);
  if (draft.lead) noteParts.unshift(draft.lead);
  const notes = noteParts.join('\n\n');

  if (steps.length === 0) {
    push(STEP_KIND.answer, draft.title, notes);
    return { id: `topic-${index}`, title: draft.title, steps, notes: '' };
  }

  // 모범 답변 섹션이 없는 주제는 배경 섹션이 사실상 답이다. 참고 자료로 미뤄두지 않는다.
  const firstStep = steps[0];
  if (firstStep && firstStep.kind !== STEP_KIND.followUp && !firstStep.reveal && notes) {
    firstStep.reveal = notes;
    return { id: `topic-${index}`, title: draft.title, steps, notes: '' };
  }

  return { id: `topic-${index}`, title: draft.title, steps, notes };
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
    const isTopic = block.level <= topicLevel && TOPIC_NUMBER_PATTERN.test(block.heading);

    if (isTopic) {
      current = createDraft(block.heading, block.body);
      drafts.push(current);
      continue;
    }

    if (!current && !title && block.level <= topicLevel) {
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
