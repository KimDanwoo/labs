import { LuCornerDownLeft } from 'react-icons/lu';

import { Button } from '@shared/ui/button';
import { GUESS_WORD_COPY } from '@views/guess-word/config/copy';
import { GUESS_FORM_ID } from '@views/guess-word/config/game';
import { useGuessWordContext } from '@views/guess-word/model/hooks/useGuessWordContext';

export function GuessWordActions() {
  const { isGuessing } = useGuessWordContext();

  return (
    <Button type="submit" form={GUESS_FORM_ID} size="xl" isFull disabled={isGuessing}>
      <LuCornerDownLeft aria-hidden="true" />
      {GUESS_WORD_COPY.submit}
    </Button>
  );
}
