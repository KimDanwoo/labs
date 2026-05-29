'use client';

import { useState, useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { MINIGAME_COIN_PER_CORRECT, MINIGAME_HEART_PER_CORRECT } from '@shared/constants';
import { CHARACTERS } from '@shared/constants';
import { CharacterSprite } from '@shared/ui';
import { characterIdAtom } from '@entities/game/model/store';
import { useGameActions, useMinigameStatus } from '@entities/game/model/hooks';
import { pickQuizQuestions, QUIZ_PHASE, QUIZ_ROUNDS } from '../model/constants';
import type { QuizPhase } from '../model/types';

const PICK_DELAY_MS = 350;

type QuizGameProps = {
	onExitToMenu: () => void;
};

function formatRegen(ms: number): string {
	const totalSec = Math.ceil(ms / 1000);
	const m = Math.floor(totalSec / 60);
	const s = totalSec % 60;
	return m > 0 ? `${m}분 ${s}초` : `${s}초`;
}

export default function QuizGame({ onExitToMenu }: QuizGameProps) {
	const myCharacterId = useAtomValue(characterIdAtom);
	const { minigameReward, markMinigamePlayed, closeModal } = useGameActions();
	const minigame = useMinigameStatus();
	const [phase, setPhase] = useState<QuizPhase>(QUIZ_PHASE.READY);
	const [roundIdx, setRoundIdx] = useState(0);
	const [correctCount, setCorrectCount] = useState(0);
	const [picked, setPicked] = useState<number | null>(null);

	const questions = useMemo(() => pickQuizQuestions(QUIZ_ROUNDS, myCharacterId), [myCharacterId]);
	const current = questions[roundIdx];
	const myCharacter = myCharacterId ? CHARACTERS[myCharacterId] : null;

	const handlePick = (index: number) => {
		if (picked !== null) return;
		setPicked(index);
		const correct = index === current.correctIndex;
		if (correct) setCorrectCount((c) => c + 1);

		setTimeout(() => {
			setPicked(null);
			if (roundIdx + 1 >= QUIZ_ROUNDS) {
				setPhase(QUIZ_PHASE.RESULT);
			} else {
				setRoundIdx((i) => i + 1);
			}
		}, PICK_DELAY_MS);
	};

	const startGame = () => {
		if (!minigame.canPlay) return;
		markMinigamePlayed();
		setRoundIdx(0);
		setCorrectCount(0);
		setPicked(null);
		setPhase(QUIZ_PHASE.PLAYING);
	};

	const handleFinish = () => {
		minigameReward({ correctCount });
		closeModal();
	};

	if (phase === QUIZ_PHASE.READY) {
		return (
			<div className="space-y-5 py-4">
				<h3 className="text-lg font-bold text-gray-700">
					{myCharacter ? `${myCharacter.name} 취향 퀴즈` : 'PLCO 취향 퀴즈'}
				</h3>
				{myCharacterId ? (
					<div className="flex justify-center py-2">
						<CharacterSprite characterId={myCharacterId} size={72} />
					</div>
				) : (
					<div className="text-5xl py-2">💡</div>
				)}
				<p className="text-sm text-gray-400 leading-relaxed">
					{myCharacter ? `${myCharacter.name}의 진짜 취향을` : 'PLCO 멤버들의 진짜 취향을'}
					<br />
					맞춰보세요! 총 {QUIZ_ROUNDS}문제
				</p>
				{!minigame.canPlay && (
					<div className="text-[11px] text-gray-400">
						⏳ 다음 플레이까지 {formatRegen(minigame.cooldownRemainingMs)}
					</div>
				)}
				<button
					onClick={startGame}
					disabled={!minigame.canPlay}
					className="btn-primary btn-press w-full disabled:opacity-40"
					style={{ backgroundColor: '#A78BFA' }}
				>
					{minigame.canPlay ? '시작!' : '에너지 부족'}
				</button>
				<button onClick={onExitToMenu} className="w-full py-2 text-xs text-gray-400 btn-press">
					다른 게임 고르기
				</button>
			</div>
		);
	}

	if (phase === QUIZ_PHASE.PLAYING && current) {
		return (
			<div className="space-y-4">
				<div className="flex justify-between items-center text-xs text-gray-400">
					<span className="font-bold text-violet-400">
						{roundIdx + 1} / {QUIZ_ROUNDS}
					</span>
				</div>

				<div className="flex justify-center">
					<CharacterSprite characterId={current.characterId} size={64} />
				</div>

				<div className="px-4 py-3 rounded-2xl bg-gray-50 text-sm text-gray-700 font-bold min-h-[60px] flex items-center justify-center text-center">
					{current.question}
				</div>

				<div className="space-y-2">
					{current.options.map((opt, i) => {
						const isPicked = picked === i;
						const bg = isPicked
							? 'bg-violet-100 border-violet-300 text-violet-700'
							: 'bg-white border-gray-200 text-gray-700 hover:border-violet-300 hover:bg-violet-50';

						return (
							<button
								key={i}
								onClick={() => handlePick(i)}
								disabled={picked !== null}
								className={`w-full px-4 py-3 rounded-xl border text-sm font-bold btn-press transition-colors text-left ${bg}`}
							>
								{opt}
							</button>
						);
					})}
				</div>
			</div>
		);
	}

	if (phase === QUIZ_PHASE.RESULT) {
		const allCorrect = correctCount === QUIZ_ROUNDS;
		return (
			<div className="space-y-5 py-4">
				<div className="text-5xl">{allCorrect ? '🎉' : correctCount >= 2 ? '😊' : '😅'}</div>
				<h3 className="text-xl font-bold text-gray-700">
					{correctCount} / {QUIZ_ROUNDS} 맞췄어요!
				</h3>
				<div className="flex justify-center gap-6">
					<div className="text-center">
						<div className="text-lg font-bold text-amber-500">🪙 +{correctCount * MINIGAME_COIN_PER_CORRECT}</div>
						<div className="text-[10px] text-gray-400">코인</div>
					</div>
					<div className="text-center">
						<div className="text-lg font-bold text-pink-400">💕 +{correctCount * MINIGAME_HEART_PER_CORRECT}</div>
						<div className="text-[10px] text-gray-400">행복도</div>
					</div>
				</div>
				<button onClick={handleFinish} className="btn-primary btn-press w-full" style={{ backgroundColor: '#A78BFA' }}>
					받기!
				</button>
			</div>
		);
	}

	return null;
}
