export type Track = {
  id: number;
  title: string;
  permalinkUrl: string;
  artworkBase: string;
  /** 원본 확장자. SoundCloud가 곡마다 .jpg/.png를 섞어 주므로 고정하면 404가 난다(지금 목록은 전부 .jpg). */
  artworkExt: '.jpg' | '.png';
  waveformUrl: string;
  durationMs: number;
  genre: string;
  description?: string;
  /** 목록에서 사라진 곡도 URL을 보존한다. 과거 생성물은 공개 곡으로 취급한다. */
  isAvailable?: boolean;
};

export type ArtworkSize = 't200x200' | 't300x300' | 't500x500';
