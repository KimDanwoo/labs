'use client';
import { GAME_CONFIRM_COPY } from '@entities/sudoku/config/gameConfirm';
import { discardDetail } from '@entities/sudoku/lib/newGameLabel';
import {
  confirmDiscardAtom,
  gameConfirmAtom,
  keepCurrentGameAtom,
} from '@entities/sudoku/model/store/gameConfirmAtoms';
import { GameConfirmButton } from '@entities/sudoku/ui/game-confirm/GameConfirmButton';
import { BottomSheet } from '@shared/ui/bottom-sheet';
import { useAtomValue, useSetAtom } from 'jotai';

export function GameConfirmSheet() {
  const confirm = useAtomValue(gameConfirmAtom);
  const discard = useSetAtom(confirmDiscardAtom);
  const keepCurrentGame = useSetAtom(keepCurrentGameAtom);

  if (!confirm) return null;
  const copy = GAME_CONFIRM_COPY[confirm.action.kind];
  const detail = discardDetail(confirm.action);

  return (
    <BottomSheet isOpen={confirm.isOpen} onClose={keepCurrentGame} title={copy.title}>
      <div className="text-center space-y-2">
        {detail && <p className="text-lg font-semibold text-text-primary">{detail}</p>}
        <p className="text-sm text-text-secondary break-keep">{copy.message}</p>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <GameConfirmButton variant="secondary" onClick={keepCurrentGame}>
          계속하기
        </GameConfirmButton>
        <GameConfirmButton variant="primary" onClick={discard}>
          {copy.confirm}
        </GameConfirmButton>
      </div>
    </BottomSheet>
  );
}
