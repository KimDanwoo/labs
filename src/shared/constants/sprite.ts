import type { CharacterId } from '@shared/types';

export const SPRITE_MAP: Record<CharacterId, string> = {
  hako: '/character_1.png',
  ako: '/character_2.png',
  eunko: '/character_3.png',
  yeko: '/character_4.png',
  bamko: '/character_5.png',
};

// 4x4 스프라이트시트: 행=방향, 열=프레임
// Row 0: 앞 (down), Row 1: 뒤 (up), Row 2: 왼쪽, Row 3: 오른쪽
export const FRAME_SIZE = 256; // 1024 / 4
export const SHEET_SIZE = 1024;
export const WALK_FPS = 6;
export const TOTAL_FRAMES = 4;
