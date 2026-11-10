export const CHARACTER = { child: 'straw-hat' } as const;
export const OUTFIT = { summer: 'summer', overalls: 'overalls' } as const;
export type CharacterTemplate = (typeof CHARACTER)[keyof typeof CHARACTER];
export type Outfit = (typeof OUTFIT)[keyof typeof OUTFIT];
export type Appearance = { character: CharacterTemplate; outfit: Outfit };
export const DEFAULT_APPEARANCE: Appearance = { character: CHARACTER.child, outfit: OUTFIT.summer };
export const characterAtlas = ({ character, outfit }: Appearance) => `/art/child-${character}-${outfit}.webp`;
// The same child takes their hat off to sleep.
export const sleepingPortrait = (character: CharacterTemplate) =>
  ({ [CHARACTER.child]: '/art/child-boy-sleep.webp' })[character];

export function parseAppearance(raw: string | null): Appearance {
  try {
    const value = JSON.parse(raw ?? 'null');
    if (
      !value ||
      ![CHARACTER.child, 'boy', 'girl'].includes(value.character) ||
      !Object.values(OUTFIT).includes(value.outfit)
    )
      return DEFAULT_APPEARANCE;
    return { character: CHARACTER.child, outfit: value.outfit };
  } catch {
    return DEFAULT_APPEARANCE;
  }
}
