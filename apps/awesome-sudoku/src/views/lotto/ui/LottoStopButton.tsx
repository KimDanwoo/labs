import { LOTTO_COPY } from '@views/lotto/config/copy';
import { useLottoContext } from '@views/lotto/model/hooks/useLottoContext';
import { LottoButton } from '@views/lotto/ui/LottoButton';

export function LottoStopButton() {
  const { cancelSimulation } = useLottoContext();
  const handleStop = () => cancelSimulation();
  return (
    <LottoButton variant="stop" size="sm" onClick={handleStop} className="w-full">
      {LOTTO_COPY.stop}
    </LottoButton>
  );
}
