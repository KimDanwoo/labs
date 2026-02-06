import { Difficulty, GameMode } from "@entities/game/model/types";

export interface GameStats {
  totalGames: number;
  completedGames: number;
  completionRate: number;
  totalPlayTime: number;
  averageTime: number;
  bestScore: number;
  totalScore: number;
}

export interface DifficultyStats {
  difficulty: Difficulty;
  gamesPlayed: number;
  completedGames: number;
  averageTime: number;
  bestTime: number;
  bestScore: number;
}

export interface StatsByMode {
  gameMode: GameMode;
  gamesPlayed: number;
  completedGames: number;
  averageTime: number;
  bestScore: number;
}
