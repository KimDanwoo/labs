'use client';

import { useState } from 'react';
import { useSetAtom } from 'jotai';
import { CHARACTERS } from '@shared/constants';
import { CharacterSprite } from '@shared/ui';
import { CHARACTER_SELECT_STEP } from '../model/constants';
import { pendingCharacterAtom, stepAtom } from '../model/store';
import { usePointerSwipe } from '../model/hooks';

const ALL_CHARACTER_LIST = Object.values(CHARACTERS);

export default function CharacterCarousel() {
	const setStep = useSetAtom(stepAtom);
	const setPending = useSetAtom(pendingCharacterAtom);
	const [index, setIndex] = useState(0);

	const current = ALL_CHARACTER_LIST[index];

	const handlePrev = () => {
		setIndex(
			(prev) => (prev - 1 + ALL_CHARACTER_LIST.length) % ALL_CHARACTER_LIST.length,
		);
	};
	const handleNext = () => {
		setIndex((prev) => (prev + 1) % ALL_CHARACTER_LIST.length);
	};

	const { onPointerDown, onPointerUp, onPointerCancel } = usePointerSwipe({
		onSwipeLeft: handleNext,
		onSwipeRight: handlePrev,
	});

	const handleBack = () => setStep(CHARACTER_SELECT_STEP.INTRO);

	const handleConfirm = () => {
		setPending({ id: current.id, defaultNickname: current.name });
		setStep(CHARACTER_SELECT_STEP.NAME);
	};

	return (
		<div className="flex flex-col items-center justify-center flex-1 relative overflow-hidden px-4">
			<div
				className="absolute inset-0 transition-colors duration-500"
				style={{
					background: `radial-gradient(circle at 50% 40%, ${current.color}15 0%, transparent 70%)`,
				}}
			/>

			<div className="relative flex flex-col items-center gap-6 w-full max-w-xs">
				<div className="text-center space-y-1">
					<h1 className="text-2xl sm:text-3xl font-black tracking-tight bg-linear-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
						PLCO GOTCHI
					</h1>
					<p className="text-xs sm:text-sm text-gray-400">
						함께할 친구를 골라주세요
					</p>
				</div>

				<div className="flex items-center justify-center w-full gap-2 sm:gap-4">
					<button
						onClick={handlePrev}
						className="w-10 h-10 rounded-full bg-white/60 backdrop-blur-sm flex items-center justify-center text-gray-400 hover:text-gray-600 btn-press shadow-sm shrink-0"
						aria-label="이전 친구"
					>
						<svg
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<polyline points="15 18 9 12 15 6" />
						</svg>
					</button>

					<div
						onPointerDown={onPointerDown}
						onPointerUp={onPointerUp}
						onPointerCancel={onPointerCancel}
						className="relative flex flex-col items-center gap-4 py-7 px-6 rounded-3xl transition-all duration-500 w-full max-w-[220px] touch-pan-y select-none"
						style={{
							backgroundColor: current.bgColor,
							border: `2px solid ${current.borderColor}40`,
							boxShadow: `0 12px 40px ${current.color}15`,
						}}
					>
						<div
							className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full blur-3xl opacity-20 transition-colors duration-500"
							style={{ backgroundColor: current.color }}
						/>

						<div className="relative pointer-events-none">
							<CharacterSprite
								characterId={current.id}
								size={100}
								direction="down"
							/>
						</div>

						<div className="text-center space-y-1 pointer-events-none">
							<div className="text-xl">{current.emoji}</div>
							<h2
								className="text-lg font-black"
								style={{ color: current.color }}
							>
								{current.name}
							</h2>
						</div>
					</div>

					<button
						onClick={handleNext}
						className="w-10 h-10 rounded-full bg-white/60 backdrop-blur-sm flex items-center justify-center text-gray-400 hover:text-gray-600 btn-press shadow-sm shrink-0"
						aria-label="다음 친구"
					>
						<svg
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<polyline points="9 18 15 12 9 6" />
						</svg>
					</button>
				</div>

				<div className="flex gap-2">
					{ALL_CHARACTER_LIST.map((char, i) => (
						<button
							key={char.id}
							onClick={() => setIndex(i)}
							className="transition-all duration-300 rounded-full btn-press"
							style={{
								width: i === index ? 24 : 8,
								height: 8,
								backgroundColor: i === index ? current.color : '#D1D5DB',
							}}
							aria-label={`${char.name} 선택`}
						/>
					))}
				</div>

				<div className="flex items-center gap-3 w-full">
					<button
						onClick={handleBack}
						className="px-5 py-3.5 rounded-2xl bg-white/70 text-gray-500 font-bold btn-press backdrop-blur-sm shadow-sm"
					>
						뒤로
					</button>
					<button
						onClick={handleConfirm}
						className="flex-1 py-3.5 rounded-2xl text-white font-bold text-base btn-press shadow-xl transition-all duration-300"
						style={{
							backgroundColor: current.color,
							boxShadow: `0 6px 24px ${current.color}35`,
						}}
					>
						이 친구로 할래!
					</button>
				</div>
			</div>
		</div>
	);
}
