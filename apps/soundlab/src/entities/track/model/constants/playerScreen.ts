export const PLAYER_SCREEN = { archive: 'archive', nowPlaying: 'now-playing', queue: 'queue' } as const;

export type PlayerScreen = (typeof PLAYER_SCREEN)[keyof typeof PLAYER_SCREEN];
