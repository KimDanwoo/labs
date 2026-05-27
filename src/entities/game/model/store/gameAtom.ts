import { atom } from 'jotai';
import { atomWithReducer } from 'jotai/utils';
import { INITIAL_GAME_STATE } from '@shared/constants';
import { gameReducer } from '../reducer';

export const gameAtom = atomWithReducer(INITIAL_GAME_STATE, gameReducer);

export const isLoadedAtom = atom(false);
