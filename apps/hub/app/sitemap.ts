import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: 'https://lab.danwoo.dev', lastModified: new Date(), priority: 1.0 }];
}
