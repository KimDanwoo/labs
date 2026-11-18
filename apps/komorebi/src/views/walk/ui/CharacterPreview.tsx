import type { JSX } from 'react';
import { characterLayers, type Appearance } from '../model/world/appearance';

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
