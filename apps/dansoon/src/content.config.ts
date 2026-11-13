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
    z.object({
      title: z.string().min(1),
      description: z.string().min(1).max(DESCRIPTION_MAX_LENGTH),
      publishedAt: z.coerce.date(),
      updatedAt: z.coerce.date().optional(),
      category: z.enum(CATEGORY_IDS),
      tags: z.array(z.enum(TAG_IDS)).default([]),
      series: z.object({ id: z.enum(SERIES_IDS), order: z.number().int().positive() }).optional(),
      thumbnail: image().optional(),
      cover: image().optional(),
      legacyUrl: z.url().optional(),
      draft: z.boolean().default(false),
    }),
});

const REPORT_KINDS = ['bestseller', 'webnovel'] as const;

const books = defineCollection({
  loader: glob({
    pattern: '*/index.md',
    base: './contents/book',
    generateId: ({ entry }) => entry.split('/')[0] ?? entry,
  }),
  schema: z.object({
    title: z.string().min(1),
    date: z.coerce.date(),
    description: z.string().min(1),
    category: z.enum(REPORT_KINDS),
    // 예전 블로그 목록에서 숨기던 표시. 지금은 쓰지 않지만 생성기가 계속 쓰므로 받아 둔다
    isHidden: z.boolean().optional(),
    note: z.string().min(1).optional(),
  }),
});

export const collections = { posts, books };
