'use client';

import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { CHARACTERS } from '@shared/constants';
import { characterStatesAtom } from '@entities/game/model/store';

const ALL_CHARACTER_LIST = Object.values(CHARACTERS);

export function useVisibleCharacters() {
	const characterStates = useAtomValue(characterStatesAtom);

	return useMemo(() => {
		const ids = new Set<string>(Object.keys(characterStates));
		for (const state of Object.values(characterStates)) {
			for (const id of state.unlockedCharacters ?? []) ids.add(id);
		}
		return ALL_CHARACTER_LIST.filter((c) => ids.has(c.id));
	}, [characterStates]);
}
