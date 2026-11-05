import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { defineCollection } from 'astro:content';
import { CATEGORY_IDS, SERIES_IDS, TAG_IDS } from '~/lib/taxonomy';

const DESCRIPTION_MAX_LENGTH = 200;

const posts = defineCollection({
  // contents/posts/<slug>/index.md — 폴더 이름이 곧 URL slug다
  loader: glob({
    pattern: '*/index.md',
    base: './contents/posts',
    generateId: ({ entry }) => entry.split('/')[0] ?? entry,
  }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string().min(1),
        description: z.string().min(1).max(DESCRIPTION_MAX_LENGTH),
        publishedAt: z.coerce.date(),
        updatedAt: z.coerce.date().optional(),
        category: z.enum(CATEGORY_IDS),
        tags: z.array(z.enum(TAG_IDS)).default([]),
        series: z.enum(SERIES_IDS).optional(),
        seriesOrder: z.number().int().positive().optional(),
        thumbnail: image().optional(),
        legacyUrl: z.url().optional(),
        draft: z.boolean().default(false),
      })
      .refine((data) => (data.series === undefined) === (data.seriesOrder === undefined), {
        message: 'series와 seriesOrder는 함께 지정해야 한다',
      }),
});

export const collections = { posts };
