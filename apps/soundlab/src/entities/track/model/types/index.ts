export type Track = {
  id: number;
  title: string;
  permalinkUrl: string;
  /** 접미사를 제외한 아트워크 경로. 해상도는 사용처에서 붙인다. */
  artworkBase: string;
  /** 원본 확장자. SoundCloud가 곡마다 .jpg/.png를 섞어 주므로 고정하면 404가 난다(지금 목록은 전부 .jpg). */
  artworkExt: '.jpg' | '.png';
  waveformUrl: string;
  durationMs: number;
  genre: string;
};

export type ArtworkSize = 't200x200' | 't300x300' | 't500x500';
