import type { GameId } from '@entities/game-catalog';

export const HOME_HEADLINE_LINES = ['잠깐의 여유,', '미니게임 한 판'] as const;

export const TODAY_GAME_ID: GameId = 'guess';

export const TODAY_TEXT = {
  badge: '오늘의 단어',
  meta: '매일 새 단어',
  cta: '오늘의 단어 맞히기',
} as const;

export const GAME_LIST_TEXT = {
  title: '게임 목록',
  start: '시작',
} as const;
