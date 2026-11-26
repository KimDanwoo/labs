import { EDGE_COUNT, SIDE } from '@views/walls/config/board';
import { GUIDE_POSITIONS } from '@views/walls/config/guide';
import type { Board, Owner } from '@views/walls/model/types/walls';

export function createGuideBoard(index: number): Board {
  const fixture = GUIDE_POSITIONS[index] ?? GUIDE_POSITIONS[0];
  const walls = new Uint8Array(EDGE_COUNT);
  fixture.walls.forEach((edge) => {
    walls[edge] = 1;
  });
  return { pawns: [...fixture.pawns], walls };
}

export function getGuideCellRole(side: Owner): string {
  if (side === null) return '빈칸';
  return side === SIDE.ME ? '내 말' : '상대 말';
}
