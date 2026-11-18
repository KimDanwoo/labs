import { loadQuestionContent } from '@entities/question/index.server';
import { SITE_URL } from '@shared/config/site';
import type { MetadataRoute } from 'next';

const STATIC_PATHS = ['', '/learn', '/reference', '/search', '/privacy', '/terms'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { categories } = await loadQuestionContent();

  return [
    ...STATIC_PATHS.map((path) => ({ url: `${SITE_URL}${path}`, priority: path === '' ? 1.0 : 0.7 })),
    ...categories.map((category) => ({ url: `${SITE_URL}/reference/${category.slug}`, priority: 0.8 })),
  ];
}
