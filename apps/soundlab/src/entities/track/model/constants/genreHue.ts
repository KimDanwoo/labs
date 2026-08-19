const GENRE_HUE = {
  'R&B & Soul': 18,
  'Hip-hop & Rap': 276,
  Indie: 172,
  Pop: 328,
  pop: 328,
  'Jazz & Blues': 214,
  Electronic: 190,
} as const;

const FALLBACK_HUE = 34;

export function hueOf(genre: string): number {
  return GENRE_HUE[genre as keyof typeof GENRE_HUE] ?? FALLBACK_HUE;
}
