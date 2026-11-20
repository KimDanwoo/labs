export type WingedKind = 'bird' | 'butterfly' | 'dragonfly';

export const WINGED_MAX_COUNT = 22;
export const WINGED_COUNT = { desktop: 22, mobile: 10 } as const;
export const WINGED_WING_COUNT: Record<WingedKind, number> = { bird: 2, butterfly: 4, dragonfly: 4 };
export const WINGED_OPACITY: Record<WingedKind, number> = { bird: 1, butterfly: 1, dragonfly: 0.65 };
export const WINGED_ALERT_RADIUS: Record<WingedKind, number> = { bird: 16, butterfly: 9, dragonfly: 9 };
export const WINGED_SCALE: Record<WingedKind, number> = { bird: 0.65, butterfly: 0.24, dragonfly: 0.24 };
export const WINGED_BODY_COLOR: Record<WingedKind, string> = {
  bird: '#635c50',
  butterfly: '#635c50',
  dragonfly: '#558f94',
};
export const WINGED_BODY_GEOMETRY = [1, 6, 4] as const;
export const WINGED_WING_DISC = { args: [0.5, 12], flatten: { dragonfly: 0.22, other: 0.85 }, offsetX: 0.45 } as const;
export const WINGED_DRAGONFLY_OFFSHORE = 80;
export const WINGED_POSITION_ITEM_SIZE = 3;
