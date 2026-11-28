import type { Speed } from '@views/gostop/model/types/playback';

export interface GameRecord {
  played: number;
  wins: number;
  losses: number;
  draws: number;
  streak: number;
  bestPoints: number;
  lastGameId: string | null;
}

export interface GostopSettings {
  speed: Speed;
  isMuted: boolean;
}
