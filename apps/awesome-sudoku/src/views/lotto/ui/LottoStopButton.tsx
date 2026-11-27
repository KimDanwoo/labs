import { LuSquare } from 'react-icons/lu';

import { cn } from '@shared/lib/cn';
import { LOTTO_COPY } from '@views/lotto/config/copy';
import { GLASS_BUTTON_CLASS, GLASS_CLASS } from '@views/lotto/config/style';
import { useLottoContext } from '@views/lotto/model/hooks/useLottoContext';

export function LottoStopButton() {
  const { cancelSimulation } = useLottoContext();
  const handleStop = () => cancelSimulation();

  return (
    <button
      type="button"
      onClick={handleStop}
      className={cn(
        'relative flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold text-error-text before:absolute before:-inset-2 before:content-[""]',
        GLASS_CLASS,
        GLASS_BUTTON_CLASS,
      )}
    >
      <LuSquare aria-hidden="true" className="size-3 fill-current" />
      {LOTTO_COPY.stop}
    </button>
  );
}
