import type { MetadataRoute } from 'next';

import { GAME_LIST, SITE_URL } from '@entities/game-catalog';

export default function sitemap(): MetadataRoute.Sitemap {
  return ['/', ...GAME_LIST.map(([, game]) => game.href)].map((path) => ({ url: new URL(path, SITE_URL).href }));
}
