import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://sudoku.danwoo.dev';

  return [
    { url: baseUrl, lastModified: new Date(), priority: 1.0 },
    { url: `${baseUrl}/leaderboard`, lastModified: new Date(), priority: 0.8 },
    { url: `${baseUrl}/profile`, lastModified: new Date(), priority: 0.6 },
  ];
}
