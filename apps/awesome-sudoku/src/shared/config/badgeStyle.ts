export type BadgeTone = 'lemon' | 'ink';

export const BADGE_TONE: Record<BadgeTone, string> = {
  lemon: 'bg-lemon text-ink',
  ink: 'bg-ink text-lemon',
};
