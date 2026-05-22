import type { CharacterId, SpriteDirection } from '@shared/types';

export const SPRITE_MAP: Record<CharacterId, string> = {
  hako: '/character_1.webp',
  ako: '/character_2.webp',
  eunko: '/character_3.webp',
  yeko: '/character_4.webp',
  bamko: '/character_5.webp',
};

// 4x4 스프라이트시트: 행=방향, 열=프레임
// Row 0: 정면(front), Row 1: 뒷모습(back), Row 2: 왼쪽, Row 3: 오른쪽
// 걷기는 col 1 ↔ col 3 교차, 정지는 col 0
export const FRAME_SIZE = 256;
export const SHEET_SIZE = 1024;
export const WALK_FPS = 4;

const DIRECTION_ROW: Record<SpriteDirection, number> = {
  front: 0,
  left: 2,
  right: 3,
};

// 걷기 사이클: 한 발 → 정지 → 다른 발 → 정지 (4 step)
export const WALK_STEP_COLS = [1, 0, 3, 0] as const;
export const IDLE_COL = 0;

export type SpritePose = { row: number; col: number };

export function getSpritePose(direction: SpriteDirection, col: number): SpritePose {
  return {
    row: DIRECTION_ROW[direction],
    col,
  };
}
