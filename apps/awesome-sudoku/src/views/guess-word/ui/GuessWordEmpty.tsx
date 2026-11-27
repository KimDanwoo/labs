import { LuSearch } from 'react-icons/lu';

import { GUESS_WORD_COPY } from '@views/guess-word/config/copy';

export function GuessWordEmpty() {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-1 px-4 text-center break-keep">
      <span
        aria-hidden="true"
        className="mb-2 flex size-11 items-center justify-center rounded-full bg-surface-primary text-xl text-text-tertiary dark:bg-border-medium"
      >
        <LuSearch />
      </span>
      <p className="text-[15px] font-semibold text-text-secondary">{GUESS_WORD_COPY.empty}</p>
      <p className="text-[13px] text-text-tertiary">{GUESS_WORD_COPY.emptyGuide}</p>
    </div>
  );
}
