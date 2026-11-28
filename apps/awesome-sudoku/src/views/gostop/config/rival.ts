export const RIVAL_NAME = '호 사장';

export const MOOD = {
  IDLE: 'idle',
  HAPPY: 'happy',
  SHOCKED: 'shocked',
  ANGRY: 'angry',
  GLOAT: 'gloat',
} as const;

export const REACTION = {
  QUIET: 'quiet',
  RIVAL_EVENT: 'rivalEvent',
  MY_EVENT: 'myEvent',
  RIVAL_BLUNDER: 'rivalBlunder',
  MY_BLUNDER: 'myBlunder',
  ROBBED: 'robbed',
  RIVAL_GO: 'rivalGo',
  MY_GO: 'myGo',
  MY_DECIDING: 'myDeciding',
  RIVAL_WON: 'rivalWon',
  RIVAL_LOST: 'rivalLost',
  DRAW: 'draw',
} as const;

type MoodName = (typeof MOOD)[keyof typeof MOOD];
type ReactionName = (typeof REACTION)[keyof typeof REACTION];

export const REACTION_MOOD: Record<ReactionName, MoodName> = {
  [REACTION.QUIET]: MOOD.IDLE,
  [REACTION.RIVAL_EVENT]: MOOD.HAPPY,
  [REACTION.MY_EVENT]: MOOD.SHOCKED,
  [REACTION.RIVAL_BLUNDER]: MOOD.SHOCKED,
  [REACTION.MY_BLUNDER]: MOOD.HAPPY,
  [REACTION.ROBBED]: MOOD.ANGRY,
  [REACTION.RIVAL_GO]: MOOD.GLOAT,
  [REACTION.MY_GO]: MOOD.ANGRY,
  [REACTION.MY_DECIDING]: MOOD.SHOCKED,
  [REACTION.RIVAL_WON]: MOOD.GLOAT,
  [REACTION.RIVAL_LOST]: MOOD.ANGRY,
  [REACTION.DRAW]: MOOD.IDLE,
};

export const REACTION_LINES: Record<ReactionName, readonly string[]> = {
  [REACTION.QUIET]: [],
  [REACTION.RIVAL_EVENT]: ['이 맛에 치지!', '어흥, 잘 붙는다', '패가 말을 듣네'],
  [REACTION.MY_EVENT]: ['어? 그게 붙어?', '잠깐, 방금 뭐였지', '운이 좋구먼'],
  [REACTION.RIVAL_BLUNDER]: ['아이고, 뻑이네', '이게 왜 안 붙어', '손이 미끄러졌어'],
  [REACTION.MY_BLUNDER]: ['뻑! 고맙구먼', '그건 내가 먹지', '어흥, 잘 쌌다'],
  [REACTION.ROBBED]: ['내 피를 가져가?', '그건 두고 가지', '두고 보자고'],
  [REACTION.RIVAL_GO]: ['고! 더 먹어야겠어', '아직 배고프다, 고!', '여기서 멈출 순 없지'],
  [REACTION.MY_GO]: ['고라고? 간이 크네', '후회하게 될걸', '어디 한번 가 보자고'],
  [REACTION.MY_DECIDING]: ['스톱하지? 응?', '욕심내다 다쳐', '천천히 골라, 천천히'],
  [REACTION.RIVAL_WON]: ['어흥! 내가 이겼다', '다음에 또 오라고', '판돈은 잘 받아 가지'],
  [REACTION.RIVAL_LOST]: ['이번 판은 봐준 거야', '한 판 더! 한 판 더 해', '손이 미끄러졌을 뿐이야'],
  [REACTION.DRAW]: ['싱겁게 끝났구먼', '다음 판에 가리자고'],
};

export const MOOD_LABEL: Record<MoodName, string> = {
  [MOOD.IDLE]: '느긋한 표정',
  [MOOD.HAPPY]: '웃는 표정',
  [MOOD.SHOCKED]: '놀란 표정',
  [MOOD.ANGRY]: '화난 표정',
  [MOOD.GLOAT]: '의기양양한 표정',
};

export const MOODS: readonly MoodName[] = Object.values(MOOD);

export const RIVAL_IMAGE = {
  folder: '/rival/',
  extension: '.webp',
  sizes: '(min-width: 1024px) 99px, 69px',
} as const;

export const BUBBLE_MS = 2500;
export const BUBBLE_OUT_MS = 220;
export const BUBBLE_TIMING = { animationDelay: `0ms, ${BUBBLE_MS - BUBBLE_OUT_MS}ms` } as const;

export const MOOD_HOP = {
  durationMs: 280,
  easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  frames: [
    { transform: 'translateY(0) scale(1)' },
    { transform: 'translateY(-5px) scale(1.1)', offset: 0.4 },
    { transform: 'translateY(0) scale(0.97)', offset: 0.75 },
    { transform: 'translateY(0) scale(1)' },
  ],
} as const;
