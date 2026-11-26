'use client';

import { PuzzleVictory } from '@shared/ui/puzzle-victory';
import { SIDE } from '@views/walls/config/board';
import { STEP_TEXT } from '@views/walls/config/copy';
import { STEP } from '@views/walls/config/game';
import { useWallsGuide } from '@views/walls/model/hooks/useWallsGuide';
import styles from '@views/walls/ui/WallsGuide.module.css';
import { WallsGuideBoard } from '@views/walls/ui/WallsGuideBoard';
import { WallsGuideEdges } from '@views/walls/ui/WallsGuideEdges';

export function WallsGuide() {
  const guide = useWallsGuide();
  const { pawn, target } = guide.selection;
  const isWon = Boolean(guide.territory);
  const canPickWall = target !== null && !isWon;
  const nextStep = pawn === null ? STEP.PICK_PAWN : STEP.PICK_CELL;
  const step = canPickWall ? STEP.PICK_WALL : nextStep;
  const score = guide.territory?.scores;

  return (
    <div className={styles.guide}>
      <WallsGuideBoard guide={guide} />
      {canPickWall ? <WallsGuideEdges target={target} edges={guide.edges} onPick={guide.pickWall} /> : null}
      <div className={styles.feedback}>
        <p role="status">{isWon ? <PuzzleVictory /> : guide.notice || STEP_TEXT[step]}</p>
        {score ? (
          <p>
            내 땅 {score[SIDE.ME]}칸 · 상대 {score[SIDE.COMPUTER]}칸
          </p>
        ) : null}
        <button type="button" onClick={guide.reset}>
          다른 판
        </button>
      </div>
    </div>
  );
}
