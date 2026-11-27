import { LOTTO_COPY } from '@views/lotto/config/copy';
import { LOTTO_NUMBERS } from '@views/lotto/config/display';
import { LottoNumberToggle } from '@views/lotto/ui/LottoNumberToggle';

export function LottoNumberGrid() {
  return (
    <div role="group" aria-label={LOTTO_COPY.boardLabel} className="grid grid-cols-7 sm:grid-cols-9 sm:px-1">
      {LOTTO_NUMBERS.map((number) => (
        <LottoNumberToggle key={number} number={number} />
      ))}
    </div>
  );
}
