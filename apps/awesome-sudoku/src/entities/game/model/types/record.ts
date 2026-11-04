import type { Timestamp } from 'firebase/firestore';
import type { Difficulty, GameMode } from './game';

export interface GameRecord {
  id?: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL: string | null;
  gameMode: GameMode;
  difficulty: Difficulty;
  completionTime: number;
  hintsUsed: number;
  mistakesCount: number;
  score: number;
  point: number;
  isSuccess: boolean;
  createdAt: Timestamp;
}

export interface PointResult {
  basePoint: number;
  killerDeduction: number;
  totalPoint: number;
}

export interface PointInput {
  difficulty: Difficulty;
  gameMode: GameMode;
  completionTime: number;
}
