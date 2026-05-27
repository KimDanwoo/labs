'use client';

import { useState } from 'react';
import { CHARACTERS } from '@shared/constants';
import { CharacterSprite } from '@shared/ui';
import { useGameActions } from '@entities/game';

const CHARACTER_LIST = Object.values(CHARACTERS);

export default function CharacterSelectView() {
	const { selectCharacter } = useGameActions();
	const [currentIndex, setCurrentIndex] = useState(0);
	const [nickname, setNickname] = useState('');
	const [step, setStep] = useState<'select' | 'name'>('select');

	const current = CHARACTER_LIST[currentIndex];

	const handlePrev = () => {
		setCurrentIndex((prev) => (prev - 1 + CHARACTER_LIST.length) % CHARACTER_LIST.length);
	};

	const handleNext = () => {
		setCurrentIndex((prev) => (prev + 1) % CHARACTER_LIST.length);
	};

	const handleChoose = () => {
		setNickname(current.name);
		setStep('name');
	};

	const handleStart = () => {
		if (!nickname.trim()) return;
		selectCharacter(current.id, nickname.trim());
	};

	if (step === 'name') {
		return (
			<div className="flex flex-col items-center justify-center flex-1 px-6 relative overflow-hidden">
				<div
					className="absolute inset-0 opacity-10 transition-colors duration-500"
					style={{ backgroundColor: current.color }}
				/>
				<div
					className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-3xl opacity-20 transition-colors duration-500"
					style={{ backgroundColor: current.color }}
				/>

				<div className="relative flex flex-col items-center gap-8 w-full max-w-xs">
					<div className="relative">
						<div
							className="absolute inset-0 rounded-full blur-2xl opacity-25 scale-[2]"
							style={{ backgroundColor: current.color }}
						/>
						<CharacterSprite characterId={current.id} size={120} />
					</div>

					<div className="text-center">
						<span className="text-2xl">{current.emoji}</span>
						<h2 className="text-xl font-black mt-1 transition-colors duration-300" style={{ color: current.color }}>
							{current.name}
						</h2>
					</div>

					<div className="w-full space-y-2">
						<label className="text-xs font-bold text-gray-400 pl-1 uppercase tracking-wider">nickname</label>
						<input
							type="text"
							value={nickname}
							onChange={(e) => setNickname(e.target.value)}
							placeholder="이름을 입력하세요"
							maxLength={10}
							className="w-full px-4 py-3.5 text-center text-lg font-bold border-2 rounded-2xl focus:outline-none bg-white/80 backdrop-blur-sm transition-colors duration-300"
							style={{
								borderColor: nickname.trim() ? current.borderColor : '#E5E7EB',
							}}
							autoFocus
							onKeyDown={(e) => e.key === 'Enter' && handleStart()}
						/>
					</div>

					<div className="flex gap-3 w-full">
						<button
							onClick={() => setStep('select')}
							className="flex-1 py-3.5 rounded-2xl bg-white/60 text-gray-400 font-bold btn-press backdrop-blur-sm"
						>
							뒤로
						</button>
						<button
							onClick={handleStart}
							disabled={!nickname.trim()}
							className="flex-2 py-3.5 rounded-2xl text-white font-bold btn-press disabled:opacity-30 transition-colors duration-300 shadow-lg"
							style={{
								backgroundColor: current.color,
								boxShadow: `0 4px 20px ${current.color}40`,
							}}
						>
							시작!
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center justify-center flex-1 relative overflow-hidden">
			<div
				className="absolute inset-0 transition-colors duration-500"
				style={{
					background: `radial-gradient(circle at 50% 40%, ${current.color}15 0%, transparent 70%)`,
				}}
			/>

			<div className="relative flex flex-col items-center gap-6 sm:gap-8 w-full">
				<div className="text-center space-y-1">
					<h1 className="text-3xl sm:text-4xl font-black tracking-tight bg-linear-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
						PLAVE GOTCHI
					</h1>
					<p className="text-xs sm:text-sm text-gray-400">함께할 친구를 골라주세요</p>
				</div>

				<div className="flex items-center justify-center w-full gap-2 sm:gap-4 px-4">
					<button
						onClick={handlePrev}
						className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/60 backdrop-blur-sm flex items-center justify-center text-gray-400 hover:text-gray-600 btn-press shadow-sm shrink-0"
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
						className="relative flex flex-col items-center gap-4 py-8 px-6 sm:px-10 rounded-3xl transition-all duration-500 w-full max-w-[260px] sm:max-w-[280px]"
						style={{
							backgroundColor: `${current.bgColor}`,
							border: `2px solid ${current.borderColor}40`,
							boxShadow: `0 12px 40px ${current.color}15`,
						}}
					>
						<div
							className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full blur-3xl opacity-20 transition-colors duration-500"
							style={{ backgroundColor: current.color }}
						/>

						<div className="relative">
							<CharacterSprite characterId={current.id} size={110} />
						</div>

						<div className="text-center space-y-1">
							<div className="text-2xl">{current.emoji}</div>
							<h2 className="text-xl font-black transition-colors duration-300" style={{ color: current.color }}>
								{current.name}
							</h2>
						</div>
					</div>

					<button
						onClick={handleNext}
						className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/60 backdrop-blur-sm flex items-center justify-center text-gray-400 hover:text-gray-600 btn-press shadow-sm shrink-0"
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
					{CHARACTER_LIST.map((char, i) => (
						<button
							key={char.id}
							onClick={() => setCurrentIndex(i)}
							className="transition-all duration-300 rounded-full btn-press"
							style={{
								width: i === currentIndex ? 24 : 8,
								height: 8,
								backgroundColor: i === currentIndex ? current.color : '#D1D5DB',
							}}
						/>
					))}
				</div>

				<button
					onClick={handleChoose}
					className="px-12 py-4 rounded-2xl text-white font-bold text-base sm:text-lg btn-press shadow-xl transition-all duration-300"
					style={{
						backgroundColor: current.color,
						boxShadow: `0 6px 24px ${current.color}35`,
					}}
				>
					이 친구로 할래!
				</button>
			</div>
		</div>
	);
}
