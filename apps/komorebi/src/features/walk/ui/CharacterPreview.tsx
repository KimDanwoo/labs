import { characterAtlas, type Appearance } from '@shared/world/appearance';

export function CharacterPreview({ appearance }: { appearance: Appearance }) {
  return (
    <span
      className="character-preview"
      aria-hidden="true"
      style={{ backgroundImage: `url(${characterAtlas(appearance)})` }}
    />
  );
}
