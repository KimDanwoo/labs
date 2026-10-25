export const CHARACTER = { boy: 'boy', girl: 'girl' } as const;
export const OUTFIT = { summer: 'summer', overalls: 'overalls' } as const;
export type CharacterTemplate = (typeof CHARACTER)[keyof typeof CHARACTER];
export type Outfit = (typeof OUTFIT)[keyof typeof OUTFIT];
export type Appearance = { character: CharacterTemplate; outfit: Outfit };
export const DEFAULT_APPEARANCE: Appearance = { character: CHARACTER.boy, outfit: OUTFIT.summer };
export const characterAtlas = ({ character, outfit }: Appearance) => `/art/child-${character}-${outfit}.webp`;
export const sleepingPortrait = (character: CharacterTemplate) => `/art/child-${character}-sleep.webp`;

/** Opaque idle heights, front/right/back/left, measured in the 192 × 256 atlas cells. */
const DIRECTION_HEIGHTS = {
  boy: { summer: [218, 222, 244, 222], overalls: [218, 222, 244, 223] },
  girl: { summer: [217, 221, 219, 222], overalls: [217, 221, 219, 222] },
} as const;

export function characterDirectionScale(appearance: Appearance, facing: number) {
  const heights = DIRECTION_HEIGHTS[appearance.character][appearance.outfit];
  return heights[0] / (heights[facing] ?? heights[0]);
}

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
