export const CHARACTER = { boy: 'boy', girl: 'girl' } as const;
export const OUTFIT = { summer: 'summer', overalls: 'overalls' } as const;
export type CharacterTemplate = (typeof CHARACTER)[keyof typeof CHARACTER];
export type Outfit = (typeof OUTFIT)[keyof typeof OUTFIT];
export type Appearance = { character: CharacterTemplate; outfit: Outfit };
export const DEFAULT_APPEARANCE: Appearance = { character: CHARACTER.boy, outfit: OUTFIT.summer };
export const characterAtlas = ({ character, outfit }: Appearance) => `/art/child-${character}-${outfit}.webp`;
export const sleepingPortrait = (character: CharacterTemplate) => `/art/child-${character}-sleep.webp`;

export function parseAppearance(raw: string | null): Appearance {
  try {
    const value = JSON.parse(raw ?? 'null');
    if (!value || !Object.values(CHARACTER).includes(value.character) || !Object.values(OUTFIT).includes(value.outfit))
      return DEFAULT_APPEARANCE;
    return { character: value.character, outfit: value.outfit };
  } catch {
    return DEFAULT_APPEARANCE;
  }
}
