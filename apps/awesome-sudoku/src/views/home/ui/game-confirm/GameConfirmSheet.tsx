'use client';
import { BottomSheet } from '@shared/ui/bottom-sheet';
import { useAtomValue, useSetAtom } from 'jotai';
import { newGameLabel } from '../../lib/newGameLabel';
import { confirmNewGameAtom, keepCurrentGameAtom, newGameConfirmAtom } from '../../model/store/newGameAtoms';
import { NewGameActionButton } from './NewGameActionButton';

export function NewGameConfirmSheet() {
  const confirm = useAtomValue(newGameConfirmAtom);
  const startNewGame = useSetAtom(confirmNewGameAtom);
  const keepCurrentGame = useSetAtom(keepCurrentGameAtom);

  if (!confirm) return null;

  return (
    <BottomSheet isOpen={confirm.isOpen} onClose={keepCurrentGame} title="새 게임을 시작할까요?">
      <div className="text-center space-y-2">
        <p className="text-lg font-semibold text-text-primary">{newGameLabel(confirm.request)}</p>
        <p className="text-sm text-text-secondary">진행 중인 게임은 저장되지 않고 사라져요.</p>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <NewGameActionButton variant="secondary" onClick={keepCurrentGame}>
          계속하기
        </NewGameActionButton>
        <NewGameActionButton variant="primary" onClick={startNewGame}>
          새 게임
        </NewGameActionButton>
      </div>
    </BottomSheet>
  );
}
