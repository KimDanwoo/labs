import type { Difficulty } from './game';

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
