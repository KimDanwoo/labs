'use client';

import { useRouter } from 'next/navigation';
import { useAtomValue, useSetAtom } from 'jotai';
import { characterStatesAtom } from '@entities/game/model/store';
import { useGameActions } from '@entities/game/model/hooks';
import { CHARACTER_SELECT_STEP } from '../model/constants';
import { pendingCharacterAtom, stepAtom } from '../model/store';
import { useVisibleCharacters } from '../model/hooks';
import FriendCard from './FriendCard';
import GoogleLoginPrompt from './GoogleLoginPrompt';

export default function FriendList() {
	const router = useRouter();
	const { selectCharacter } = useGameActions();
	const setStep = useSetAtom(stepAtom);
	const setPending = useSetAtom(pendingCharacterAtom);
	const characterStates = useAtomValue(characterStatesAtom);
	const visibleCharacters = useVisibleCharacters();

	return (
		<div className="flex flex-col items-center justify-start flex-1 px-4 py-6 relative overflow-hidden">
			<div className="absolute inset-0 bg-linear-to-br from-pink-50/40 via-white to-blue-50/40" />

			<div className="relative flex flex-col items-center gap-4 w-full max-w-sm">
				<div className="text-center space-y-1">
					<h1 className="text-2xl sm:text-3xl font-black tracking-tight bg-linear-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
						PLCO GOTCHI
					</h1>
					<p className="text-xs text-gray-400">키우러 갈 친구를 골라주세요</p>
				</div>

				<div className="flex flex-col gap-2 w-full">
					{visibleCharacters.map((c) => {
						const state = characterStates[c.id];
						const handleClick = () => {
							if (state) {
								selectCharacter(c.id, c.name);
								router.push(`/play/${c.id}`);
								return;
							}
							setPending({ id: c.id, defaultNickname: c.name });
							setStep(CHARACTER_SELECT_STEP.NAME);
						};
						return (
							<FriendCard
								key={c.id}
								character={c}
								state={state}
								onClick={handleClick}
							/>
						);
					})}
				</div>

				<div className="text-[10px] text-center text-gray-400 leading-relaxed">
					해금된 친구만 보여요 · 카드를 눌러서 그 친구에게 가요
				</div>

				<GoogleLoginPrompt />
			</div>
		</div>
	);
}
