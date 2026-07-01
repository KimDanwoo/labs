'use client';

import { useAtomValue } from 'jotai';
import { GAME_STATUS } from '@shared/constants';
import { statusAtom } from '@entities/game/model/store';
import { activeRoomAtom } from '@entities/chat-room/model/store';
import {
	useAutoDecay,
	useBathroomExit,
	useCharacterMovement,
	useMeetingPlayScene,
} from '@entities/game/model/hooks';
import DeathScreen from '@views/death/DeathScreen';
import { StatusBar } from '@widgets/status-bar/ui';
import { Room, SharedRoomScene } from '@widgets/game-room/ui';
import { ActionButtons } from '@widgets/action-bar/ui';
import { GameMessages, ModalRoot } from '@views/game/ui';

export default function GameView() {
	useAutoDecay();
	useCharacterMovement();
	useBathroomExit();
	useMeetingPlayScene();

	const status = useAtomValue(statusAtom);
	const activeRoom = useAtomValue(activeRoomAtom);

	if (status === GAME_STATUS.DEAD) return <DeathScreen />;

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
