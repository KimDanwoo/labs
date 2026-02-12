import { Difficulty, GameMode } from "@entities/game/model/types";
import { Timestamp } from "firebase/firestore";

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
}
