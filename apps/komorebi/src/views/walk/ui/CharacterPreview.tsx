import type { JSX } from 'react';
import { characterLayers, type Appearance } from '../model/world/appearance';

export function CharacterPreview({ appearance }: { appearance: Appearance }): JSX.Element {
  const layers = characterLayers(appearance);
  return (
    <span
      className="character-preview"
      aria-hidden="true"
      style={{ backgroundImage: `url(${layers.body}), url(${layers.outfit})` }}
    />
  );
}
