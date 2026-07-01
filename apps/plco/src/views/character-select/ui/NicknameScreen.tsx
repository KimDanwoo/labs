'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAtomValue, useSetAtom } from 'jotai';
import { CHARACTERS } from '@shared/constants';
import { CharacterSprite } from '@shared/ui';
import { useGameActions } from '@entities/game/model/hooks';
import { CHARACTER_SELECT_STEP } from '../model/constants';
import { pendingCharacterAtom, stepAtom } from '../model/store';
import { useVisibleCharacters } from '../model/hooks';

export default function NicknameScreen() {
	const router = useRouter();
	const { selectCharacter } = useGameActions();
	const setStep = useSetAtom(stepAtom);
	const pending = useAtomValue(pendingCharacterAtom);
	const visibleCharacters = useVisibleCharacters();

	const [nickname, setNickname] = useState(pending?.defaultNickname ?? '');

	useEffect(() => {
		if (!pending) setStep(CHARACTER_SELECT_STEP.INTRO);
	}, [pending, setStep]);

	if (!pending) return null;

	const character = CHARACTERS[pending.id];

	const handleBack = () => {
		setStep(
			visibleCharacters.length > 0
				? CHARACTER_SELECT_STEP.INTRO
				: CHARACTER_SELECT_STEP.CAROUSEL,
		);
	};

	const handleStart = () => {
		const trimmed = nickname.trim();
		if (!trimmed) return;
		selectCharacter(character.id, trimmed);
		router.push(`/play/${character.id}`);
	};

	return (
		<div className="flex flex-col items-center justify-center flex-1 px-6 relative overflow-hidden">
			<div
				className="absolute inset-0 opacity-10 transition-colors duration-500"
				style={{ backgroundColor: character.color }}
			/>
			<div
				className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-3xl opacity-20 transition-colors duration-500"
				style={{ backgroundColor: character.color }}
			/>

			<div className="relative flex flex-col items-center gap-8 w-full max-w-xs">
				<div className="relative">
					<div
						className="absolute inset-0 rounded-full blur-2xl opacity-25 scale-[2]"
						style={{ backgroundColor: character.color }}
					/>
					<CharacterSprite
						characterId={character.id}
						size={120}
						direction="down"
					/>
				</div>

				<div className="text-center">
					<span className="text-2xl">{character.emoji}</span>
					<h2
						className="text-xl font-black mt-1 transition-colors duration-300"
						style={{ color: character.color }}
					>
						{character.name}
					</h2>
				</div>

				<div className="w-full space-y-2">
					<label className="text-xs font-bold text-gray-400 pl-1 uppercase tracking-wider">
						nickname
					</label>
					<input
						type="text"
						value={nickname}
						onChange={(e) => setNickname(e.target.value)}
						placeholder="이름을 입력하세요"
						maxLength={10}
						className="w-full px-4 py-3.5 text-center text-lg font-bold border-2 rounded-2xl focus:outline-none bg-white/80 backdrop-blur-sm transition-colors duration-300"
						style={{
							borderColor: nickname.trim() ? character.borderColor : '#E5E7EB',
						}}
						autoFocus
						onKeyDown={(e) => e.key === 'Enter' && handleStart()}
					/>
				</div>

				<div className="flex gap-3 w-full">
					<button
						onClick={handleBack}
						className="flex-1 py-3.5 rounded-2xl bg-white/60 text-gray-400 font-bold btn-press backdrop-blur-sm"
					>
						뒤로
					</button>
					<button
						onClick={handleStart}
						disabled={!nickname.trim()}
						className="flex-2 py-3.5 rounded-2xl text-white font-bold btn-press disabled:opacity-30 transition-colors duration-300 shadow-lg"
						style={{
							backgroundColor: character.color,
							boxShadow: `0 4px 20px ${character.color}40`,
						}}
					>
						시작!
					</button>
				</div>
			</div>
		</div>
	);
}
