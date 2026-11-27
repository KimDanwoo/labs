import { BULK_TICKET_PRESETS, LOTTO_PICK_COUNT, type LottoRank } from '@views/lotto/config/lotto';

export type BulkPreset = (typeof BULK_TICKET_PRESETS)[number];
export type JackpotOutcome = 'idle' | 'running' | 'won' | 'missed' | 'stopped';

export type LottoStatusKind =
  | 'picking'
  | 'ready'
  | 'drawn'
  | 'bulkRunning'
  | 'jackpotRunning'
  | 'bulkDone'
  | 'bulkStopped'
  | 'jackpotWon'
  | 'jackpotMissed'
  | 'jackpotStopped';

export interface StatusFacts {
  pickedCount: number;
  matches: number;
  rank: LottoRank | null;
  ticketsText: string;
  targetText: string;
  profitText: string;
}

type StatusTemplate = (facts: StatusFacts) => string;

export const LOTTO_COPY = {
  title: '로또 시뮬레이터',
  boardLabel: '번호판',
  ticketLabel: '내 번호',
  winningLabel: '당첨 번호',
  bonusLabel: '보너스',
  emptySlot: '빈 칸',
  matchedBall: '맞힘',
  autoFill: '자동',
  clear: '비우기',
  draw: '추첨',
  bulk: '몰아 사기',
  jackpot: '1등까지',
  stop: '멈추기',
  drawing: '추첨하는 중…',
  bulkProgress: '몰아 사기 진행률',
  jackpotProgress: '1등 찾는 중',
  bulkPanelTitle: '몇 장 살까요?',
  bulkCost: (wonText: string) => `${wonText}어치`,
  rankColumn: '등수',
  countColumn: '당첨',
  oddsColumn: '실제 · 이론',
  countText: (countText: string) => `${countText}번`,
  spent: '쓴 돈',
  won: '받은 돈',
  profitRate: '수익률',
  returnNote: (returnText: string) => `1,000원을 쓸 때마다 ${returnText}을 돌려받은 셈이에요.`,
  jackpotDuration: (ticketsText: string, durationText: string) =>
    `${ticketsText}이면 매주 5장씩 사서 약 ${durationText} 걸리는 양이에요.`,
  assumedMark: '*',
  assumedNote: '* 1~3등 상금은 회차마다 달라 20억·5,500만·150만 원으로 가정했어요. 4·5등은 고정 금액이에요.',
  neverHit: '없음',
  close: '닫기',
  rule: '1부터 45까지 중 6개를 고르면 번호 6개와 보너스 1개를 뽑아요. 6개가 맞으면 1등, 5개와 보너스 2등, 5개 3등, 4개 4등, 3개 5등이고 한 장은 1,000원으로 쳐요.',
  disclaimer: '실제 구매와 관계없는 시뮬레이션이에요.',
} as const;

export const RANK_LABEL: Record<LottoRank, string> = {
  1: '1등',
  2: '2등',
  3: '3등',
  4: '4등',
  5: '5등',
};

const RANK_MATCH_TEXT: Record<LottoRank, string> = {
  1: '6개',
  2: '5개 + 보너스',
  3: '5개',
  4: '4개',
  5: '3개',
};

const drawnText = ({ matches, rank }: StatusFacts): string => {
  if (rank === null) return `${matches}개 맞힘 · 낙첨`;
  return `${RANK_MATCH_TEXT[rank]} 맞힘 · ${RANK_LABEL[rank]}`;
};

export const STATUS_TEXT: Record<LottoStatusKind, StatusTemplate> = {
  picking: ({ pickedCount }) => `번호 ${LOTTO_PICK_COUNT}개를 골라요 · ${pickedCount}/${LOTTO_PICK_COUNT}`,
  ready: () => '다 골랐어요 · 추첨해 볼까요?',
  drawn: drawnText,
  bulkRunning: ({ targetText, ticketsText }) => `${targetText} 중 ${ticketsText}…`,
  jackpotRunning: ({ ticketsText }) => `1등까지 ${ticketsText}째…`,
  bulkDone: ({ ticketsText, profitText }) => `${ticketsText} 샀어요 · 수익률 ${profitText}`,
  bulkStopped: ({ ticketsText, profitText }) => `${ticketsText}에서 멈춤 · 수익률 ${profitText}`,
  jackpotWon: ({ ticketsText }) => `${ticketsText}째에 1등!`,
  jackpotMissed: ({ ticketsText }) => `${ticketsText}을 사도 1등은 없었어요`,
  jackpotStopped: ({ ticketsText }) => `${ticketsText}에서 멈췄어요`,
};

export const STATUS_ANNOUNCEMENT: Partial<Record<LottoStatusKind, StatusTemplate>> = {
  bulkRunning: ({ targetText }) => `${targetText}을 몰아 사는 중이에요`,
  jackpotRunning: () => '1등이 나올 때까지 사는 중이에요',
};

export const RESULT_TITLE: Partial<Record<LottoStatusKind, StatusTemplate>> = {
  bulkDone: ({ targetText }) => `${targetText} 몰아 사기 결과`,
  bulkStopped: ({ ticketsText }) => `${ticketsText}에서 멈췄어요`,
  jackpotWon: ({ ticketsText }) => `${ticketsText}째에 1등!`,
  jackpotMissed: ({ ticketsText }) => `${ticketsText}을 사도 1등은 없었어요`,
  jackpotStopped: ({ ticketsText }) => `${ticketsText}에서 멈췄어요`,
};

export const BULK_PRESET_LABEL: Record<BulkPreset, string> = {
  1_000: '1천 장',
  10_000: '1만 장',
  100_000: '10만 장',
  1_000_000: '100만 장',
};
