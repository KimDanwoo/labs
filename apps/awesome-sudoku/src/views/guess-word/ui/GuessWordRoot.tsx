import { useGuessWordGame } from '@views/guess-word/model/hooks/useGuessWordGame';
import { GuessWordContext } from '@views/guess-word/model/store/guessWordContext';
import type { ReactNode } from 'react';

interface GuessWordRootProps {
  children: ReactNode;
}

export function GuessWordRoot({ children }: GuessWordRootProps) {
  const game = useGuessWordGame();
  return <GuessWordContext.Provider value={game}>{children}</GuessWordContext.Provider>;
}
