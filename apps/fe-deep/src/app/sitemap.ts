import { getAllCategories } from '@entities/question/api';
import { SITE_URL } from '@shared/config/site';
import { createClient } from '@supabase/supabase-js';
import type { MetadataRoute } from 'next';

export const revalidate = 86400;

const STATIC_PATHS = ['', '/learn', '/reference', '/search', '/privacy', '/terms'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const categories = await getAllCategories(supabase);

  return [
    ...STATIC_PATHS.map((path) => ({ url: `${SITE_URL}${path}`, priority: path === '' ? 1.0 : 0.7 })),
    ...categories.map((category) => ({ url: `${SITE_URL}/reference/${category.slug}`, priority: 0.8 })),
  ];
}
