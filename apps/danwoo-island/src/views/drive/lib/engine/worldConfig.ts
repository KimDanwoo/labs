export type LoadingStyle = 'original' | 'tide';

interface WorldConfig {
  compressedAssets: boolean;
  music: boolean;
  playerSpawn: string;
  loadingStyle: LoadingStyle;
  dayCycleProgress: number | null;
  yearCycleProgress: number | null;
}

export const WORLD_CONFIG: Readonly<WorldConfig> = Object.freeze({
  compressedAssets: true,
  music: true,
  playerSpawn: 'landing',
  loadingStyle: 'tide',
  dayCycleProgress: null,
  yearCycleProgress: null,
});
