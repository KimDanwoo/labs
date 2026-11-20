import { characterLayers, type Appearance } from '@views/walk/model/world/appearance';
import type { JSX } from 'react';

interface CharacterPreviewProps {
  appearance: Appearance;
}

export function CharacterPreview({ appearance }: CharacterPreviewProps): JSX.Element {
  const layers = characterLayers(appearance);
  return (
    <span
      className="character-preview"
      aria-hidden="true"
      style={{ backgroundImage: `url(${layers.body}), url(${layers.outfit})` }}
    />
  );
}
