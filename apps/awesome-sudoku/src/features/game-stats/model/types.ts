import type { Difficulty } from '@entities/game/model/types';

export interface GameStats {
  totalGames: number;
  completedGames: number;
  completionRate: number;
  totalPlayTime: number;
  averageTime: number;
  bestScore: number;
  totalScore: number;
  totalPoints: number;
}

export interface DifficultyStats {
  difficulty: Difficulty;
  gamesPlayed: number;
  completedGames: number;
  averageTime: number;
  bestTime: number;
  bestScore: number;
}
