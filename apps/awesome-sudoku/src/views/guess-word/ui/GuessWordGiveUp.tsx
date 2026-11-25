import { GUESS_WORD_COPY } from '@views/guess-word/config/copy';
import { useGuessWordContext } from '@views/guess-word/model/hooks/useGuessWordContext';
import { GuessButton } from '@views/guess-word/ui/GuessButton';
import { useState } from 'react';

export function GuessWordGiveUp() {
  const { isPlaying, isGivingUp, handleGiveUp } = useGuessWordContext();
  const [isConfirming, setIsConfirming] = useState(false);
  if (!isPlaying) return null;
  const handleAsk = () => setIsConfirming(true);
  if (!isConfirming) {
    return (
      <button
        type="button"
        onClick={handleAsk}
        className="self-center text-sm text-text-tertiary underline underline-offset-4 hover:text-text-secondary"
      >
        {GUESS_WORD_COPY.giveUp}
      </button>
    );
  }
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl bg-bg-tertiary/80 p-3">
      <p className="text-sm text-text-secondary break-keep">{GUESS_WORD_COPY.giveUpConfirm}</p>
      <GuessButton variant="secondary" disabled={isGivingUp} onClick={handleGiveUp}>
        {GUESS_WORD_COPY.giveUp}
      </GuessButton>
    </div>
  );
}
