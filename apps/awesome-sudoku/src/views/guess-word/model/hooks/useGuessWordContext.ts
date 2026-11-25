'use client';

import type { GuessWordGame } from '@views/guess-word/model/hooks/useGuessWordGame';
import { GuessWordContext } from '@views/guess-word/model/store/guessWordContext';
import { useContext } from 'react';

export function useGuessWordContext(): GuessWordGame {
  const game = useContext(GuessWordContext);
  if (!game) throw new Error('GuessWord.Root 안에서만 사용할 수 있어요');
  return game;
}
