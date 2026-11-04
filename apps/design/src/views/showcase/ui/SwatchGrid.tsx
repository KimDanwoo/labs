import { colors } from '@tokens/css';
import type { ColorToken } from '@views/showcase/model/types';
import { Swatch } from './Swatch';

export function SwatchGrid({ names }: { names: ColorToken[] }) {
  return (
    <div className="grid grid-cols-2 gap-md sm:grid-cols-4">
      {names.map((name) => (
        <Swatch key={name} color={`var(--color-${name})`} label={name} sub={colors[name].light} />
      ))}
    </div>
  );
}
