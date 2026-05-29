'use client';

import type {
	CharacterInfo,
	GameState,
} from '@shared/types';
import {
	DANGER_THRESHOLD,
	GAME_STATUS,
	MAX_CLEANLINESS,
	MAX_HEARTS,
	MAX_HUNGER,
} from '@shared/constants';
import { CharacterSprite } from '@shared/ui';

type FriendCardProps = {
	character: CharacterInfo;
	state?: GameState;
	onClick: () => void;
};

const STATS_BY_STATE = (state: GameState) => [
	{ icon: '🍖', value: state.hunger, max: MAX_HUNGER },
	{ icon: '✨', value: state.cleanliness, max: MAX_CLEANLINESS },
	{ icon: '💕', value: state.hearts, max: MAX_HEARTS },
];

export default function FriendCard({
	character,
	state,
	onClick,
}: FriendCardProps) {
	const isStarted = !!state;
	const stats = state ? STATS_BY_STATE(state) : [];

	return (
		<button
			onClick={onClick}
			className="flex items-center gap-3 p-3 rounded-2xl btn-press shadow-sm bg-white/85 backdrop-blur-sm w-full"
			style={{ border: `2px solid ${character.color}80` }}
		>
			<div className="shrink-0">
				<CharacterSprite
					characterId={character.id}
					size={56}
					direction="down"
				/>
			</div>

			<div className="flex-1 text-left min-w-0">
				<div className="flex items-center justify-between gap-2">
					<span
						className="text-sm font-black truncate"
						style={{ color: character.color }}
					>
						{isStarted && state.nickname ? state.nickname : character.name}
					</span>
					{isStarted ? (
						<span className="text-[10px] font-bold text-white bg-gray-700 px-1.5 py-0.5 rounded-md shrink-0">
							Lv.{state.level}
						</span>
					) : (
						<span className="text-[10px] font-bold text-gray-400 shrink-0">
							NEW
						</span>
					)}
				</div>

				{isStarted ? (
					<div className="flex items-center gap-2 mt-1.5">
						{stats.map((stat) => {
							const percent = (stat.value / stat.max) * 100;
							const isDanger = percent <= DANGER_THRESHOLD;
							return (
								<span
									key={stat.icon}
									className={`flex items-center gap-0.5 text-[10px] tabular-nums ${
										isDanger ? 'text-red-500 font-bold' : 'text-gray-500'
									}`}
								>
									<span>{stat.icon}</span>
									<span>{Math.round(stat.value)}</span>
								</span>
							);
						})}
						{state.isSick && (
							<span className="text-[10px] font-bold text-red-500">🤒</span>
						)}
						{state.isSleeping && (
							<span className="text-[10px] font-bold text-blue-400">💤</span>
						)}
						{state.status === GAME_STATUS.DEAD && (
							<span className="text-[10px] font-bold text-gray-400">
								별이 됐어요
							</span>
						)}
					</div>
				) : (
					<div className="text-[11px] text-gray-400 mt-0.5">
						이름을 지어주고 만나보기
					</div>
				)}
			</div>
		</button>
	);
}
