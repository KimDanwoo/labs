export const CHARACTER = { child: 'straw-hat', boy: 'boy', girl: 'girl' } as const;
export const OUTFIT = { summer: 'summer', overalls: 'overalls', pe: 'pe' } as const;
export type CharacterTemplate = (typeof CHARACTER)[keyof typeof CHARACTER];
export type Outfit = (typeof OUTFIT)[keyof typeof OUTFIT];
export type Appearance = { character: typeof CHARACTER.child; outfit: Outfit };
export const DEFAULT_APPEARANCE: Appearance = { character: CHARACTER.child, outfit: OUTFIT.summer };
export const CHARACTER_RIG = { width: 1536, height: 1024, columns: 8, rows: 4, footInset: 6 } as const;
export type BodyPoseOffsets = Readonly<Partial<Record<number, number>>>;
// Per-pose sole offsets keep the authored fragments on the common outfit rig.
const BODY_POSE_OFFSETS: Record<CharacterTemplate, BodyPoseOffsets> = {
  [CHARACTER.child]: Object.fromEntries(
    [3, 3, 3, 3, 3, 3, 4, 3, 4, 4, 4, 5, 4, 3, 5, 8, 4, 3, 3, 3, 4, 4, 4, 4, 4, 6, 4, 6, 5, 6, 6, 7].map(
      (offset, pose) => [pose, offset],
    ),
  ),
  [CHARACTER.boy]: Object.fromEntries(
    [2, 1, 2, 1, 2, 2, 2, 2, 3, 3, 3, 3, 2, 3, 3, 13, 28, 28, 28, 25, 28, 28, 25, 38, 6, 7, 6, 6, 6, 6, 6, 11].map(
      (offset, pose) => [pose, offset],
    ),
  ),
  [CHARACTER.girl]: Object.fromEntries(
    [3, 2, 2, 2, 2, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 7, 3, 3, 3, 3, 3, 3, 4, 4, 6, 5, 6, 5, 6, 6, 5, 5].map(
      (offset, pose) => [pose, offset],
    ),
  ),
};
const BODY_ATLASES = {
  [CHARACTER.child]: '/art/child-base-straw-hat-v2.webp',
  [CHARACTER.boy]: '/art/child-base-boy-v2.webp',
  [CHARACTER.girl]: '/art/child-base-girl-v2.webp',
} satisfies Record<CharacterTemplate, string>;
export const OUTFIT_DEFINITIONS = {
  [OUTFIT.summer]: {
    id: OUTFIT.summer,
    name: '레몬빛 여름옷',
    detail: '노란 티셔츠와 산호색 반바지',
    atlas: '/art/outfit-summer.webp',
  },
  [OUTFIT.overalls]: {
    id: OUTFIT.overalls,
    name: '풀잎 멜빵옷',
    detail: '작은 꽃이 달린 초록 멜빵',
    atlas: '/art/outfit-overalls.webp',
  },
  [OUTFIT.pe]: {
    id: OUTFIT.pe,
    name: '바람빛 체육복',
    detail: '아이보리 티셔츠와 남색 운동 반바지',
    atlas: '/art/outfit-pe.webp',
  },
} satisfies Record<Outfit, { id: Outfit; name: string; detail: string; atlas: string }>;

export function characterLayers({ character, outfit }: { character: CharacterTemplate; outfit: Outfit }): {
  body: string;
  outfit: string;
  bodyPoseOffsets: BodyPoseOffsets;
} {
  return {
    body: BODY_ATLASES[character],
    outfit: OUTFIT_DEFINITIONS[outfit].atlas,
    bodyPoseOffsets: BODY_POSE_OFFSETS[character],
  };
}
// The same child takes their hat off to sleep.
export const sleepingPortrait = (character: CharacterTemplate) =>
  ({
    [CHARACTER.child]: '/art/child-boy-sleep.webp',
    [CHARACTER.boy]: '/art/child-boy-sleep.webp',
    [CHARACTER.girl]: '/art/child-girl-sleep.webp',
  })[character];

export function parseAppearance(raw: string | null): Appearance {
  try {
    const value: unknown = JSON.parse(raw ?? 'null');
    if (
      typeof value !== 'object' ||
      value === null ||
      !('character' in value) ||
      !Object.values(CHARACTER).some((character) => character === value.character) ||
      !('outfit' in value)
    )
      return DEFAULT_APPEARANCE;
    const outfit = Object.values(OUTFIT).find((outfit) => outfit === value.outfit);
    return outfit ? { character: CHARACTER.child, outfit } : DEFAULT_APPEARANCE;
  } catch {
    return DEFAULT_APPEARANCE;
  }
}
