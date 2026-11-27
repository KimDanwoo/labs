'use client';

import { GameHeading } from '@entities/game-catalog';
import { GameLayout } from '@shared/ui/game-layout';
import { GuessWord } from '@views/guess-word/ui/guessWord';

export function GuessWordPage() {
  return (
    <GuessWord.Root>
      <GameLayout.Root>
        <GameHeading game="guess" />
        <GameLayout.Status>
          <GuessWord.Status />
        </GameLayout.Status>
        <GameLayout.Board>
          <GuessWord.Board>
            <GuessWord.Form />
            <GuessWord.Latest />
            <GuessWord.List />
          </GuessWord.Board>
        </GameLayout.Board>
        <GameLayout.Panel>
          <GuessWord.Hints />
          <GuessWord.Actions />
          <GuessWord.Rule />
        </GameLayout.Panel>
      </GameLayout.Root>
      <GuessWord.ResultSheet />
    </GuessWord.Root>
  );
}
