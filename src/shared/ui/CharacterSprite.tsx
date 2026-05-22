'use client';

import { useState, useEffect } from 'react';
import type { CharacterId, SpriteDirection } from '@shared/types';
import {
	SPRITE_MAP,
	FRAME_SIZE,
	SHEET_SIZE,
	WALK_FPS,
	WALK_STEP_COLS,
	IDLE_COL,
	LEVEL_SCALE_PER_LEVEL,
	getSpritePose,
} from '@shared/constants';

type CharacterSpriteProps = {
	characterId: CharacterId;
	size?: number;
	direction?: SpriteDirection;
	isMoving?: boolean;
	isSleeping?: boolean;
	isSick?: boolean;
	isDead?: boolean;
	level?: number;
};

function useWalkCol(active: boolean): number {
	const [stepIndex, setStepIndex] = useState(0);

	useEffect(() => {
		if (!active) return;
		const interval = setInterval(() => {
			setStepIndex((prev) => (prev + 1) % WALK_STEP_COLS.length);
		}, 1000 / WALK_FPS);
		return () => clearInterval(interval);
	}, [active]);

	return active ? WALK_STEP_COLS[stepIndex] : IDLE_COL;
}

export default function CharacterSprite({
	characterId,
	size = 64,
	direction = 'front',
	isMoving = false,
	isSleeping = false,
	isSick = false,
	isDead = false,
	level = 1,
}: CharacterSpriteProps) {
	const isWalking = isMoving && !isSleeping && !isDead;
	const col = useWalkCol(isWalking);
	const { row, col: spriteCol } = getSpritePose(direction, col);

	const scale = 1 + (level - 1) * LEVEL_SCALE_PER_LEVEL;
	const actualSize = size * scale;
	const bgX = -(spriteCol * FRAME_SIZE);
	const bgY = -(row * FRAME_SIZE);

	const wrapperClass = isDead ? 'death-animation' : isSleeping ? 'idle' : '';

	return (
		<div className={`relative ${wrapperClass}`} style={{ width: actualSize, height: actualSize }}>
			<div
				className="pixel-art"
				style={{
					width: actualSize,
					height: actualSize,
					backgroundImage: `url(${SPRITE_MAP[characterId]})`,
					backgroundSize: `${(SHEET_SIZE / FRAME_SIZE) * actualSize}px ${(SHEET_SIZE / FRAME_SIZE) * actualSize}px`,
					backgroundPosition: `${(bgX / FRAME_SIZE) * actualSize}px ${(bgY / FRAME_SIZE) * actualSize}px`,
					backgroundRepeat: 'no-repeat',
					opacity: isDead ? 0.5 : 1,
					filter: isSleeping ? 'brightness(0.7)' : undefined,
				}}
			/>

			{isSleeping && (
				<div className="absolute -top-2 -right-2 text-sm font-bold text-blue-300">
					<span className="sleep-z inline-block">Z</span>
					<span className="sleep-z inline-block" style={{ animationDelay: '0.5s' }}>
						z
					</span>
					<span className="sleep-z inline-block" style={{ animationDelay: '1s' }}>
						z
					</span>
				</div>
			)}

			{isSick && !isSleeping && !isDead && <div className="absolute -top-3 -left-1 text-lg animate-pulse">💀</div>}
		</div>
	);
}
