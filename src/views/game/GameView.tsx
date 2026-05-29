'use client';

import { useAtomValue } from 'jotai';
import { GAME_STATUS } from '@shared/constants';
import { statusAtom } from '@entities/game/model/store';
import {
  useAutoDecay,
  useCharacterMovement,
} from '@entities/game/model/hooks';
import DeathScreen from '@views/death/DeathScreen';
import { StatusBar } from '@widgets/status-bar/ui';
import { Room } from '@widgets/game-room/ui';
import { ActionButtons } from '@widgets/action-bar/ui';
import { GameMessages, ModalRoot } from './ui';

export default function GameView() {
  useAutoDecay();
  useCharacterMovement();

  const status = useAtomValue(statusAtom);

  if (status === GAME_STATUS.DEAD) return <DeathScreen />;

  return (
    <div className="flex flex-col flex-1 p-2 sm:p-3 gap-2 sm:gap-3">
      <StatusBar />
      <Room />
      <ActionButtons />
      <GameMessages />
      <ModalRoot />
    </div>
  );
}
