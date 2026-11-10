import { characterAtlas, type Appearance } from '../model/world/appearance';

export function CharacterPreview({ appearance }: { appearance: Appearance }) {
  return (
    <span
      className="character-preview"
      aria-hidden="true"
      style={{ backgroundImage: `url(${characterAtlas(appearance)})` }}
    />
  );
}
