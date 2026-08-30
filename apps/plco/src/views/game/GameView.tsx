'use client';

import { activeRoomAtom } from '@entities/chat-room/model/store';
import { useAutoDecay, useBathroomExit, useCharacterMovement, useMeetingPlayScene } from '@entities/game/model/hooks';
import { statusAtom } from '@entities/game/model/store';
import { GAME_STATUS } from '@shared/constants';
import DeathView from '@views/death/DeathView';
import { GameMessages, ModalRoot } from '@views/game/ui';
import { ActionButtons } from '@widgets/action-bar/ui';
import { Room, SharedRoomScene } from '@widgets/game-room/ui';
import { StatusBar } from '@widgets/status-bar/ui';
import { useAtomValue } from 'jotai';

export default function GameView() {
  useAutoDecay();
  useCharacterMovement();
  useBathroomExit();
  useMeetingPlayScene();

  const status = useAtomValue(statusAtom);
  const activeRoom = useAtomValue(activeRoomAtom);

  if (status === GAME_STATUS.DEAD) return <DeathView />;

  if (activeRoom) {
    return (
      <div className="flex flex-col flex-1 p-2 sm:p-3 gap-2 sm:gap-3">
        <StatusBar />
        <SharedRoomScene room={activeRoom} />
        <ModalRoot />
      </div>
    );
  }

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
