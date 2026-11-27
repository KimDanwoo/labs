import { BULK_TICKET_PRESETS, LOTTO_PICK_COUNT, type LottoRank } from '@views/lotto/config/lotto';
import type { SimulationStatus } from '@views/lotto/model/types/lotto';

export type BulkPreset = (typeof BULK_TICKET_PRESETS)[number];
export type JackpotOutcome = 'idle' | 'running' | 'won' | 'missed' | 'stopped';

export interface JackpotFacts {
  ticketsText: string;
  spentText: string;
  durationText: string;
}

export interface JackpotMessage {
  title: string;
  detail: string;
}

export const LOTTO_COPY = {
  title: '로또 시뮬레이터',
  description: '번호 6개를 골라 추첨해 보고, 1등이 나올 때까지 몇 장을 사야 하는지 직접 돌려 봐요.',
  boardTitle: '번호 고르기',
  boardDescription: '1부터 45까지 중에서 6개를 골라요.',
  ticketTitle: '내 번호',
  ticketCount: (count: number) => `${count}/${LOTTO_PICK_COUNT}개 골랐어요`,
  emptySlot: '빈 칸',
  autoFill: '자동',
  clear: '비우기',
  drawTitle: '한 장 추첨',
  drawDescription: '고른 번호로 한 번 추첨해요.',
  drawButton: '추첨하기',
  lockedHint: '번호 6개를 다 고르면 누를 수 있어요.',
  winningNumbers: '당첨 번호',
  bonus: '보너스',
  matchedBall: '일치',
  matches: (count: number) => `${count}개 맞힘`,
  bonusMatched: '보너스 맞힘',
  bulkTitle: '몰아 사기',
  bulkDescription: '고른 번호로 여러 장을 한꺼번에 사요. 한 장마다 새로 추첨해요.',
  bulkCost: (wonText: string) => `${wonText}어치`,
  progressBought: (ticketsText: string) => `${ticketsText} 샀어요`,
  progressLabel: '몰아 사기 진행률',
  stop: '멈추기',
  jackpotTitle: '1등 나올 때까지',
  jackpotDescription: '1등이 나올 때까지 계속 사요. 최대 1억 장까지 돌려요.',
  jackpotButton: '1등 나올 때까지 사기',
  liveTickets: '지금까지 산 장수',
  liveSpent: '지금까지 쓴 돈',
  resultsTitleBulk: (ticketsText: string) => `${ticketsText} 몰아 사기 결과`,
  resultsTitleJackpot: '1등 나올 때까지 결과',
  rankColumn: '등수',
  countColumn: '당첨',
  prizeTotalColumn: '받은 상금',
  countText: (countText: string) => `${countText}번`,
  spent: '쓴 돈',
  won: '받은 돈',
  profitRate: '수익률',
  returnNote: (returnText: string) => `1,000원을 쓸 때마다 ${returnText}을 돌려받은 셈이에요.`,
  oddsTitle: '확률',
  oddsDescription: '등수별 이론 확률과, 직전에 돌린 결과에서 실제로 나온 비율을 나란히 봐요.',
  prizeColumn: '상금',
  theoreticalColumn: '이론',
  observedColumn: '직전 실행',
  assumedMark: '*',
  assumedNote: '* 1~3등 상금은 회차마다 달라 가정한 값이에요. 4등(5만 원)과 5등(5천 원)은 고정 금액이에요.',
  neverHit: '없음',
  aboutTitle: '안내',
  disclaimer: '실제 구매와는 관계없는 시뮬레이션이에요. 돈은 오가지 않아요.',
} as const;

export const RANK_LABEL: Record<LottoRank, string> = {
  1: '1등',
  2: '2등',
  3: '3등',
  4: '4등',
  5: '5등',
};

export const rankResultText = (rank: LottoRank | null): string =>
  rank === null ? '낙첨' : `${RANK_LABEL[rank]} 당첨!`;

export const BULK_PRESET_LABEL: Record<BulkPreset, string> = {
  1_000: '1천 장',
  10_000: '1만 장',
  100_000: '10만 장',
  1_000_000: '100만 장',
};

export const RESULTS_STATUS_NOTE: Record<SimulationStatus, string> = {
  idle: '',
  running: '계산하는 중이에요. 숫자가 계속 바뀌어요.',
  done: '',
  cancelled: '중간에 멈춰서, 멈춘 시점까지의 결과예요.',
};

export const JACKPOT_OUTCOME_TEXT: Record<JackpotOutcome, (facts: JackpotFacts) => JackpotMessage | null> = {
  idle: () => null,
  running: () => null,
  won: ({ ticketsText, spentText, durationText }) => ({
    title: `${ticketsText}째에 1등!`,
    detail: `${spentText}을 썼어요. 매주 5장씩 사면 약 ${durationText} 걸리는 양이에요.`,
  }),
  missed: ({ ticketsText, spentText }) => ({
    title: `${ticketsText}을 사도 1등이 나오지 않았어요`,
    detail: `최대치까지 돌렸어요. ${spentText}을 썼어요.`,
  }),
  stopped: ({ ticketsText, spentText }) => ({
    title: `${ticketsText}에서 멈췄어요`,
    detail: `그때까지 1등은 없었어요. ${spentText}을 썼어요.`,
  }),
};

export const LOTTO_RULES = [
  '1부터 45까지 번호 중 6개를 고르면, 추첨에서 번호 6개와 보너스 번호 1개를 뽑아요.',
  '6개가 맞으면 1등, 5개와 보너스가 맞으면 2등, 5개면 3등, 4개면 4등, 3개면 5등이에요.',
  '한 장은 1,000원으로 계산하고, 추첨은 이 브라우저 안에서 암호학적 난수로 돌려요.',
  '1등 확률은 8,145,060분의 1이에요. 매주 5장씩 사도 평균 3만 년쯤 걸려요.',
] as const;
