import type { Appearance, OUTFIT_DEFINITIONS } from '../../model/world/appearance';
import { CharacterPreview } from '../CharacterPreview';

interface OutfitOptionProps {
  outfit: (typeof OUTFIT_DEFINITIONS)[keyof typeof OUTFIT_DEFINITIONS];
  appearance: Appearance;
  onChoose: (next: Appearance) => Promise<void>;
}

export function OutfitOption({ outfit, appearance, onChoose }: OutfitOptionProps) {
  const dressed = { ...appearance, outfit: outfit.id };
  return (
    <button aria-pressed={appearance.outfit === outfit.id} onClick={() => void onChoose(dressed)}>
      <CharacterPreview appearance={dressed} />
      <strong>{outfit.name}</strong>
      <small>{outfit.detail}</small>
    </button>
  );
}
