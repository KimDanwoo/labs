interface WorldConfig {
  compressedAssets: boolean;
  music: boolean;
  playerSpawn: string;
  dayCycleProgress: number | null;
  yearCycleProgress: number | null;
}

export const WORLD_CONFIG: Readonly<WorldConfig> = Object.freeze({
  compressedAssets: true,
  music: true,
  playerSpawn: 'beachStart',
  dayCycleProgress: null,
  yearCycleProgress: null,
});
