/** 플레이어가 보여줄 화면. 진실은 주소창이고(→ services의 playerPath) 원자는 그걸 읽는 창구다. */
export const PLAYER_SCREEN = { nowPlaying: 'now-playing', queue: 'queue' } as const;

export type PlayerScreen = (typeof PLAYER_SCREEN)[keyof typeof PLAYER_SCREEN];
