import { CARD_KIND } from '@views/gostop/config/cards';
import { TURN_EVENT } from '@views/gostop/config/game';
import type { Bak, CardKind, TurnEvent } from '@views/gostop/model/types/gostop';
import type { BakRisk, CardMark, GameStatus, Outcome } from '@views/gostop/model/types/view';

export const GOSTOP_COPY = {
  tableLabel: '맞고 판',
  floorLabel: '바닥 패',
  handLabel: '내 손패',
  capturedLabel: '내가 먹은 패',
  rivalLabel: '컴퓨터',
  rivalHand: '장',
  cardUnit: '장',
  goTimes: '번',
  matchHint: '바닥과 짝',
  rivalCapturedLabel: '컴퓨터가 먹은 패',
  deckLabel: '더미',
  deal: '패 돌리기',
  dealHint: '패를 돌리면 내가 먼저 내요',
  newGame: '새 판',
  playAgain: '다시 하기',
  go: '고',
  stop: '스톱',
  decideTitle: '고? 스톱?',
  decideNow: '지금 점수',
  decideStop: '스톱하면',
  decideGo: '하면',
  decideNote: '박은 판이 끝날 때 따로 계산해요.',
  points: '점',
  goUnit: '고',
  turnMe: '내가',
  turnComputer: '컴퓨터가',
  stolenByMe: '피 뺏음',
  stolenByRival: '피 뺏김',
  resultBase: '기본 점수',
  resultGo: '고',
  resultBaks: '박',
  resultNoBak: '없음',
  bakTimes: '×2',
  resultDraw: '아무도 스톱하지 못하고 패가 떨어져 점수 없이 끝났어요.',
  ruleTitle: '맞고 규칙',
  ruleCaption: '같은 달끼리 짝을 맞춰 먼저 7점',
} as const;

export const STATUS_TEXT: Record<GameStatus, string> = {
  ready: '패를 돌려 시작하세요',
  myTurn: '내 차례예요',
  rivalTurn: '컴퓨터 생각 중…',
  deciding: '고? 스톱?',
  over: '',
};

export const OUTCOME_TITLE: Record<Outcome, string> = {
  win: '이겼어요!',
  lose: '졌어요',
  draw: '나가리',
};

export const RESULT_POINTS_LABEL: Record<Outcome, string> = {
  win: '내 최종 점수',
  lose: '컴퓨터 최종 점수',
  draw: '',
};

export const KIND_LABEL: Record<CardKind, string> = {
  [CARD_KIND.GWANG]: '광',
  [CARD_KIND.YEOL]: '열끗',
  [CARD_KIND.TTI]: '띠',
  [CARD_KIND.PI]: '피',
};

export const MARK_LABEL: Record<CardMark, string> = {
  gwang: '광',
  rainGwang: '비광',
  godori: '고도리 열끗',
  yeol: '열끗',
  hong: '홍단 띠',
  cheong: '청단 띠',
  cho: '초단 띠',
  plain: '띠',
  ssangPi: '쌍피',
  pi: '피',
};

export const EVENT_LABEL: Record<TurnEvent, string> = {
  [TURN_EVENT.JJOK]: '쪽',
  [TURN_EVENT.PPUK]: '뻑',
  [TURN_EVENT.TTADAK]: '따닥',
  [TURN_EVENT.COLLECT]: '뻑 먹기',
  [TURN_EVENT.SWEEP]: '싹쓸이',
};

export const BAK_LABEL: Record<Bak, string> = {
  piBak: '피박',
  gwangBak: '광박',
  meongTta: '멍따',
  goBak: '고박',
};

export const GOSTOP_RULES = [
  '같은 달끼리 짝을 맞춰 가져와요. 패를 낸 뒤 더미에서 한 장을 뒤집어 한 번 더 맞춰요.',
  '바닥에 같은 달이 2장 있으면 값이 큰 패를 자동으로 가져와요.',
  '광은 3장 3점(비광이 끼면 2점), 4장 4점, 5장 15점이에요.',
  '열끗·띠는 5장부터, 피는 10장부터 1점이고 한 장 늘 때마다 1점씩 더해요. 쌍피는 피 2장으로 세요.',
  '고도리는 5점, 홍단·청단·초단은 각각 3점이에요.',
  '7점 이상이 되면 고 또는 스톱을 골라요. 고는 1번에 +1점, 2번에 +2점, 3번부터는 두 배씩 늘어요. 고 뒤에는 점수가 더 올라야 다시 고나 스톱을 고를 수 있고, 마지막 패에서 점수가 오르면 자동으로 스톱해요.',
  '쪽·따닥·뻑 먹기·싹쓸이(마지막 차례 제외)를 하면 상대 피 1장을 가져와요. 뻑이 나면 세 장이 바닥에 남아요.',
  '피박(상대 피 7장 이하, 쌍피는 2장), 광박(상대 광 0장), 멍따(열끗 7장 이상), 고박(고를 부른 쪽이 지면)은 각각 두 배예요.',
  '아무도 스톱하지 못하고 패가 떨어지면 나가리예요. 고를 한 뒤 점수를 더 내지 못한 채 끝나도 나가리예요.',
  '흔들기·폭탄·총통은 없어요.',
] as const;

export const CUT_IN_COPY = {
  events: {
    [TURN_EVENT.JJOK]: '쪽!',
    [TURN_EVENT.PPUK]: '뻑!',
    [TURN_EVENT.TTADAK]: '따닥!',
    [TURN_EVENT.COLLECT]: '뻑 먹기!',
    [TURN_EVENT.SWEEP]: '싹쓸이!',
  } satisfies Record<TurnEvent, string>,
  go: '고!',
  stop: '스톱!',
} as const;

export const ANNOUNCE_COPY = {
  dealt: '패를 돌렸어요.',
  played: '냄.',
  flipped: '뒤집음.',
  taken: '장 먹음.',
  placed: '바닥에 둠.',
  stolenByMe: '피를 뺏음',
  stolenByRival: '피를 뺏김',
  go: '고를 불렀어요.',
  stop: '스톱했어요.',
  myTurn: '내 차례예요.',
  rivalTurn: '컴퓨터 차례예요.',
  deciding: '고 또는 스톱을 고르세요.',
} as const;

export const BOARD_COPY = {
  score: '점수',
  goBonus: '고 횟수, 지금 스톱하면 붙는 고 보너스',
  risks: '박 위험',
  computerName: '컴퓨터',
  mineLabel: '내 점수와 먹은 패',
} as const;

export const RISK_LABEL: Record<BakRisk, string> = {
  piBak: '피박 위험',
  gwangBak: '광박 위험',
};

export const SETTINGS_COPY = {
  sound: '효과음',
  soundOn: '효과음 켜짐',
  soundOff: '효과음 꺼짐',
  speed: '진행 속도',
  speedNormal: '보통',
  speedFast: '빠름',
} as const;

export const RECORD_COPY = {
  title: '내 전적',
  played: '판',
  wins: '승',
  losses: '패',
  draws: '나가리',
  streak: '연승',
  bestPoints: '최고 점수',
} as const;

export const DEAL_COPY = {
  title: '한 판 붙어 볼까요?',
} as const;
