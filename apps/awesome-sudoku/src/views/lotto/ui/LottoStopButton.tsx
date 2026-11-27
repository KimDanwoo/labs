import { LuSquare } from 'react-icons/lu';

import { Button } from '@shared/ui/button';
import { LOTTO_COPY } from '@views/lotto/config/copy';
import { useLottoContext } from '@views/lotto/model/hooks/useLottoContext';

export function LottoStopButton() {
  const { cancelSimulation } = useLottoContext();
  const handleStop = () => cancelSimulation();

  return (
    <Button variant="weak" size="l" onClick={handleStop} className="h-11 rounded-full text-error-text [&_svg]:size-3">
      <LuSquare aria-hidden="true" className="fill-current" />
      {LOTTO_COPY.stop}
    </Button>
  );
}
