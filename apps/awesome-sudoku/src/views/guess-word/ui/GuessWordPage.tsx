'use client';

import { GuessWord } from '@views/guess-word/ui/guessWord';

export function GuessWordPage() {
  return (
    <GuessWord.Root>
      <main className="relative mx-auto flex w-full max-w-[560px] min-w-[360px] flex-col gap-4 px-4 py-6 sm:px-6 md:py-10">
        <GuessWord.Header />
        <GuessWord.Hints />
        <GuessWord.Form />
        <GuessWord.Latest />
        <GuessWord.List />
        <GuessWord.Yesterday />
        <GuessWord.About />
        <GuessWord.ResultSheet />
      </main>
    </GuessWord.Root>
  );
}
