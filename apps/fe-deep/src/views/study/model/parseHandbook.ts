/**
 * 면접 핸드북 마크다운을 학습 단계로 분해한다.
 * `# N. 주제` = 주제, 그 아래 H2는 제목으로 역할을 판별한다.
 *   키워드/암기 → 키워드 카드 · 답변/한 줄/설명/개념 → 모범 답변 · 꼬꼬무 → 꼬리질문 · 나머지 → 참고 자료
 * 특수 문법은 없다. 평범한 마크다운이면 그대로 학습 화면이 된다.
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
  /** 답 확인 시 펼칠 마크다운. 꼬리질문은 비어 있다. */
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

type Block = { level: 1 | 2; heading: string; body: string };

type TopicDraft = {
  title: string;
  lead: string;
  keywordItems: string[];
  answers: Section[];
  followUps: FollowUp[];
  notes: Section[];
};

const FENCE_PATTERN = /^\s*(?:```|~~~)/;
const HEADING_PATTERN = /^(#{1,2})\s+(.+?)\s*#*\s*$/;
const TRAILING_RULE_PATTERN = /\n*[-*_]{3,}\s*$/;
const FENCE_WRAPPER_PATTERN = /^```[a-z]*\n|\n?```$/g;
const LIST_MARKER_PATTERN = /^[-*+]\s+/;
const ARROW_PREFIX_PATTERN = /^→\s*/;
const ORDERED_MARKER_PATTERN = /^\d+\.\s+/;
const FOLLOWUP_HEADING_PATTERN = /^###\s+(.+?)\s*#*\s*$/;

function classifySection(heading: string): SectionRole {
  const text = heading.replace(/\s+/g, '');
  if (text.includes('꼬꼬무')) return 'followUp';
  if (text.includes('키워드') || text.includes('암기')) return 'keyword';
  if (text.includes('나쁜')) return 'note';
  if (text.includes('답변') || text.includes('한줄') || text === '설명' || text === '개념') return 'answer';
  return 'note';
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

/** 꼬꼬무 섹션: `### 질문` + 답변이면 답까지, 불릿 목록이면 질문만 뽑는다. */
function splitFollowUps(body: string): FollowUp[] {
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

    const question = isInFence ? null : FOLLOWUP_HEADING_PATTERN.exec(line)?.[1];
    if (question) {
      flush();
      current = { question, answer: '' };
      continue;
    }
    if (current) answerLines.push(line);
  }
  flush();

  if (items.length > 0) return items;
  return extractItems(body).map((question) => ({ question, answer: '' }));
}

function matchHeading(line: string): Pick<Block, 'level' | 'heading'> | null {
  const matched = HEADING_PATTERN.exec(line);
  if (!matched) return null;

  const hashes = matched[1];
  const heading = matched[2];
  if (!hashes || !heading) return null;

  return { level: hashes.length as 1 | 2, heading };
}

function splitBlocks(markdown: string): { intro: string; blocks: Block[] } {
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
    if (heading) {
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

function addSection(draft: TopicDraft, section: Section): void {
  const role = classifySection(section.heading);
  if (role === 'keyword') {
    draft.keywordItems.push(...extractItems(section.body));
    return;
  }
  if (role === 'followUp') {
    draft.followUps.push(...splitFollowUps(section.body));
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
  const { intro, blocks } = splitBlocks(markdown);

  const introParts = intro ? [intro] : [];
  const drafts: TopicDraft[] = [];
  let title = '';
  let current: TopicDraft | null = null;

  for (const block of blocks) {
    if (block.level === 1) {
      if (!title) {
        title = block.heading;
        if (block.body) introParts.push(block.body);
        continue;
      }
      current = createDraft(block.heading, block.body);
      drafts.push(current);
      continue;
    }

    if (!current) {
      introParts.push(`### ${block.heading}\n\n${block.body}`);
      continue;
    }
    addSection(current, { heading: block.heading, body: block.body });
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
