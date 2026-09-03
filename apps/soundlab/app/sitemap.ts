import { TRACKS } from '@entities/track/model/constants';
import type { MetadataRoute } from 'next';

const BASE_URL = 'https://sound.danwoo.dev';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE_URL, priority: 1.0 },
    ...TRACKS.map((track) => ({ url: `${BASE_URL}/t/${track.id}`, priority: 0.8 })),
  ];
}
