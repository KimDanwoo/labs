import { GUESS_STORAGE_KEY } from '@views/guess-word/config/game';
import { atomWithStorage, createJSONStorage } from 'jotai/utils';

const storage = createJSONStorage<unknown>(() => localStorage);

export const guessRecordAtom = atomWithStorage<unknown>(GUESS_STORAGE_KEY, null, storage);
