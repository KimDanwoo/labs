const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
const MOTION_DURATION_S = 0.25;
const CARD_SLIDE_PX = 40;
const ANSWER_RISE_PX = 8;

export const CARD_SLIDE_MOTION = {
  initial: { opacity: 0, x: CARD_SLIDE_PX },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -CARD_SLIDE_PX },
  transition: { duration: MOTION_DURATION_S, ease: EASE_OUT_EXPO },
} as const;

export const ANSWER_REVEAL_MOTION = {
  initial: { opacity: 0, y: ANSWER_RISE_PX },
  animate: { opacity: 1, y: 0 },
  transition: { duration: MOTION_DURATION_S, ease: EASE_OUT_EXPO },
} as const;
