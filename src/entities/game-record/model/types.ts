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
  score: number;
  isSuccess: boolean;
  createdAt: Timestamp;
}

export interface ScoreBreakdown {
  baseScore: number;
  timeBonus: number;
  timePenalty: number;
  hintPenalty: number;
  killerBonus: number;
  totalScore: number;
}

export interface ScoreInput {
  difficulty: Difficulty;
  gameMode: GameMode;
  completionTime: number;
  hintsUsed: number;
}
