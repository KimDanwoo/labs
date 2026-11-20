import type { MetadataRoute } from 'next';

const BASE_URL = 'https://sudoku.danwoo.dev';
const PATHS = ['', '/killer', '/slitherlink'];

export default function sitemap(): MetadataRoute.Sitemap {
  return PATHS.map((path) => ({ url: `${BASE_URL}${path}`, lastModified: new Date(), priority: path ? 0.8 : 1.0 }));
}
