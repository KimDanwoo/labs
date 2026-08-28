import type { StudyTopic } from './parseHandbook';

/** 진행 상태 필터 — 단일 선택 */
export const STUDY_FILTER = {
  all: 'all',
  todo: 'todo',
  done: 'done',
} as const;

export type StudyFilter = (typeof STUDY_FILTER)[keyof typeof STUDY_FILTER];

/** 우선순위 티어 — 다중 선택 */
export const STUDY_TIER = {
  a: 'a',
  b: 'b',
  c: 'c',
} as const;

export type StudyTier = (typeof STUDY_TIER)[keyof typeof STUDY_TIER];

export const STUDY_TIER_ORDER: StudyTier[] = [STUDY_TIER.a, STUDY_TIER.b, STUDY_TIER.c];

/**
 * 티어 목록. 목표가 바뀌면 이 두 배열만 교체한다. 어디에도 없는 주제는 자동으로 C가 된다.
 * 제목은 핸드북의 주제 제목과 정확히 일치해야 하며, 어긋나면 개발 환경에서 경고한다.
 */
const TIER_TITLES: Record<Exclude<StudyTier, 'c'>, readonly string[]> = {
  a: [
    '자기소개',
    '이직의 이유는 무엇인가요?',
    '왜 당근인가요? (기대하는 점 포함)',
    '아파트스토리를 왜 새로 만들었나요?',
    'AI Agent를 실제로 어떻게 활용했나요?',
    'AI Harness 구조',
    'Monorepo를 왜 선택했나요?',
    '인증은 어떻게 구성했나요?',
    'Reverse Proxy를 왜 선택했나요?',
    'A/B 테스트는 어떻게 구현했고, 본인의 역할은 무엇이었나요?',
    '웹뷰 환경에서의 웹 개발은 일반 브라우저와 무엇이 다른가요?',
    '당근알바 같은 양면시장에서 프론트엔드가 특별히 신경 쓸 것은 무엇인가요?',
  ],
  b: [
    '세션과 토큰이 혼재됐다는 게 무슨 뜻인가요?',
    '마이크로 프론트엔드는 검토하지 않으셨나요?',
    '상태관리 경험을 비교해 주세요',
    '상태를 바꾸면 React는 무엇을 하나요?',
    '전역 상태 라이브러리는 리렌더를 어떻게 줄이나요?',
    'Hydration이 무엇이고 왜 필요한가요?',
    'App Router에서 서버와 클라이언트 사이에 실제로 무엇이 오가나요?',
    'SPA에서 URL과 뒤로가기는 어떻게 처리하나요?',
    'Promise의 상태와 all·allSettled·race·any 차이를 설명해주세요',
    '이벤트 루프는 실제로 어떤 순서로 도나요?',
    '브라우저 렌더링 과정과 CSS가 성능에 미치는 영향을 설명해주세요',
    '성능을 개선했다면 무엇을 어떤 수치로 측정했나요?',
    '코드 스플리팅은 실제로 어떻게 동작하나요?',
    '로깅한 이벤트는 실제로 어떤 경로로 서버에 도착하나요?',
  ],
};

const TIER_SEPARATOR = ',';

export function parseStudyFilter(raw: string | null): StudyFilter {
  if (raw === STUDY_FILTER.todo || raw === STUDY_FILTER.done) return raw;
  return STUDY_FILTER.all;
}

function isStudyTier(value: string): value is StudyTier {
  return STUDY_TIER_ORDER.some((tier) => tier === value);
}

/** 빈 값이면 빈 Set — 티어로 좁히지 않는다는 뜻이다. */
export function parseStudyTiers(raw: string | null): Set<StudyTier> {
  if (!raw) return new Set();
  return new Set(raw.split(TIER_SEPARATOR).filter(isStudyTier));
}

export function serializeStudyTiers(tiers: Set<StudyTier>): string {
  return STUDY_TIER_ORDER.filter((tier) => tiers.has(tier)).join(TIER_SEPARATOR);
}

export function getTopicTier(topic: StudyTopic): StudyTier {
  if (TIER_TITLES.a.includes(topic.title)) return STUDY_TIER.a;
  if (TIER_TITLES.b.includes(topic.title)) return STUDY_TIER.b;
  return STUDY_TIER.c;
}

export function countByTier(topics: StudyTopic[]): Record<StudyTier, number> {
  const counts: Record<StudyTier, number> = { a: 0, b: 0, c: 0 };
  for (const topic of topics) counts[getTopicTier(topic)] += 1;
  return counts;
}

/** 핸드북 제목이 바뀌어 목록에서 조용히 빠지는 것을 개발 중에 잡는다. */
function warnMissingTierTitles(topics: StudyTopic[]): void {
  if (process.env.NODE_ENV === 'production') return;
  const titles = new Set(topics.map((topic) => topic.title));
  const missing = [...TIER_TITLES.a, ...TIER_TITLES.b].filter((title) => !titles.has(title));
  if (missing.length > 0) console.warn('[study] 티어 제목이 핸드북과 일치하지 않습니다:', missing);
}

export function filterTopics(
  topics: StudyTopic[],
  tiers: Set<StudyTier>,
  filter: StudyFilter,
  understood: Set<string>,
): StudyTopic[] {
  warnMissingTierTitles(topics);
  const byTier = tiers.size === 0 ? topics : topics.filter((topic) => tiers.has(getTopicTier(topic)));
  if (filter === STUDY_FILTER.done) return byTier.filter((topic) => understood.has(topic.title));
  if (filter === STUDY_FILTER.todo) return byTier.filter((topic) => !understood.has(topic.title));
  return byTier;
}
