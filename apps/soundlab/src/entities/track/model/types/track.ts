export type Track = {
  id: number;
  title: string;
  permalinkUrl: string;
  artworkBase: string;
  artworkExt: '.jpg' | '.png';
  waveformUrl: string;
  durationMs: number;
  genre: string;
  description?: string;
  isAvailable?: boolean;
};

export type ArtworkSize = 't200x200' | 't300x300' | 't500x500';
