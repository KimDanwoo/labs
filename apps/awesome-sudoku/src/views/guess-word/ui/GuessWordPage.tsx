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
          <div className="grid w-full gap-4">
            <GuessWord.Hints />
            <GuessWord.Form />
            <GuessWord.Latest />
            <GuessWord.List />
          </div>
        </GameLayout.Board>
        <GameLayout.Panel>
          <GuessWord.Yesterday />
          <GuessWord.About />
        </GameLayout.Panel>
      </GameLayout.Root>
      <GuessWord.ResultSheet />
    </GuessWord.Root>
  );
}
