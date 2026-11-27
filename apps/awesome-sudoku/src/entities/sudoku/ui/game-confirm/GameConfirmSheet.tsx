'use client';
import { GAME_CONFIRM_COPY } from '@entities/sudoku/config/gameConfirm';
import { discardDetail } from '@entities/sudoku/lib/newGameLabel';
import {
  confirmDiscardAtom,
  gameConfirmAtom,
  keepCurrentGameAtom,
} from '@entities/sudoku/model/store/gameConfirmAtoms';
import { BottomSheet } from '@shared/ui/bottom-sheet';
import { Button } from '@shared/ui/button';
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
      <div className="mt-6 grid grid-cols-2 gap-2">
        <Button variant="weak" size="l" onClick={keepCurrentGame}>
          계속하기
        </Button>
        <Button size="l" onClick={discard}>
          {copy.confirm}
        </Button>
      </div>
    </BottomSheet>
  );
}
