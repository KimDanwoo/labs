import { extractKeywordLine, findTopicLevel, splitFrontmatter } from './handbookLines';
import {
  type FollowUp,
  type Section,
  classifySection,
  extractItems,
  splitBlocks,
  splitFollowUps,
} from './handbookSections';
import { STEP_KIND, type StepKind, type StudyDoc, type StudyStep, type StudyTopic } from './studyDoc';

type TopicDraft = {
  title: string;
  lead: string;
  keywordItems: string[];
  answers: Section[];
  mistakes: Section[];
  improvements: Section[];
  followUps: FollowUp[];
  notes: Section[];
};

function createDraft(title: string, lead: string): TopicDraft {
  return { title, lead, keywordItems: [], answers: [], mistakes: [], improvements: [], followUps: [], notes: [] };
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
  if (role === 'mistake') {
    draft.mistakes.push(section);
    return;
  }
  if (role === 'improve') {
    draft.improvements.push(section);
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

  for (const mistake of draft.mistakes) {
    const { keywords, body } = extractKeywordLine(mistake.body);
    push(STEP_KIND.mistake, mistake.heading, body, [...new Set(keywords)]);
  }

  for (const followUp of draft.followUps) {
    const { keywords, body } = extractKeywordLine(followUp.answer);
    push(STEP_KIND.followUp, followUp.question, body, [...new Set(keywords)]);
  }

  for (const improvement of draft.improvements) {
    const { keywords, body } = extractKeywordLine(improvement.body);
    push(STEP_KIND.improve, improvement.heading, body, [...new Set(keywords)]);
  }

  return { id: `topic-${index}`, title: draft.title, steps, notes: isNotesConsumed ? '' : notes };
}

export function parseStudyDoc(slug: string, raw: string): StudyDoc {
  const { date, markdown } = splitFrontmatter(raw);
  const topicLevel = findTopicLevel(markdown);
  const sectionLevel = topicLevel + 1;
  const followUpLevel = topicLevel + 2;

  const { intro, blocks } = splitBlocks(markdown, sectionLevel);

  const introParts = intro ? [intro] : [];
  const drafts: TopicDraft[] = [];
  let title = '';
  let current: TopicDraft | null = null;

  for (const block of blocks) {
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
    date,
    intro: introParts.join('\n\n'),
    topics: drafts.map(buildTopic).filter((topic) => topic.steps.length > 0),
  };
}

export function countSteps(doc: StudyDoc): number {
  return doc.topics.reduce((sum, topic) => sum + topic.steps.length, 0);
}
