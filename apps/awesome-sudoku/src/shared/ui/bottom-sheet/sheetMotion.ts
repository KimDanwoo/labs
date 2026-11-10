export const PHASE = {
  idle: 'idle',
  mounted: 'mounted',
  opening: 'opening',
  open: 'open',
  closing: 'closing',
} as const;
export type Phase = keyof typeof PHASE;

export const ANIMATION_MS = 500;
const SPRING = 'cubic-bezier(0.32, 0.72, 0, 1)';

const transitionOf = (...properties: string[]): string =>
  properties.map((property) => `${property} ${ANIMATION_MS}ms ${SPRING}`).join(', ');

export const BACKDROP_TRANSITION = transitionOf('opacity');

type SheetMotion = {
  transition: string;
  willChange: string;
  shown: { transform: string; opacity?: string };
  hidden: { transform: string; opacity?: string };
};

/** 데스크톱: 화면 가운데에서 살짝 커지며 나타나는 모달. */
const DESKTOP_MOTION: SheetMotion = {
  transition: transitionOf('transform', 'opacity'),
  willChange: 'transform, opacity',
  shown: { transform: 'translate(-50%, -50%) scale(1)', opacity: '1' },
  hidden: { transform: 'translate(-50%, -50%) scale(0.95)', opacity: '0' },
};

/** 모바일: 아래에서 올라오는 시트. */
export const MOBILE_MOTION: SheetMotion = {
  transition: transitionOf('transform'),
  willChange: 'transform',
  shown: { transform: 'translateY(0)' },
  hidden: { transform: 'translateY(100%)' },
};

export const sheetMotion = (isDesktop: boolean): SheetMotion => (isDesktop ? DESKTOP_MOTION : MOBILE_MOTION);
