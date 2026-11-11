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
      // 날짜가 같은 글도 있어 연재 안 순서는 order로 따로 정한다
      series: z.object({ id: z.enum(SERIES_IDS), order: z.number().int().positive() }).optional(),
      // 제목을 얹은 썸네일(목록·링크 미리보기)과 제목 없는 배경(글 상단 커버). 썸네일은 scripts/make-thumbnails.ts가 커버로 만든다
      thumbnail: image().optional(),
      cover: image().optional(),
      legacyUrl: z.url().optional(),
      draft: z.boolean().default(false),
    }),
});

const REPORT_KINDS = ['bestseller', 'webnovel'] as const;

/** 주간 도서 리포트 — scripts/fetch_*.py가 매주 생성한다(contents/book/<날짜>-<종류>/index.md). */
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
    // 직접 쓰는 한 줄 메모. 생성기는 비워 두고, 쓰고 싶은 주에만 frontmatter에 적는다
    note: z.string().min(1).optional(),
  }),
});

export const collections = { posts, books };
