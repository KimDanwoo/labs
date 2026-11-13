import { satteri } from '@astrojs/markdown-satteri';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import expressiveCode from 'astro-expressive-code';
import { defineConfig } from 'astro/config';
import { readdirSync, readFileSync } from 'node:fs';
import { articleHastPlugin } from './src/lib/articleHastPlugin.mjs';

// 설정 파일에서는 content collection을 쓸 수 없어 frontmatter의 날짜만 직접 읽는다(updatedAt이 있으면 그 값)
const POSTS_DIR = new URL('./contents/posts/', import.meta.url);
const readFrontmatterDate = (source, key) => source.match(new RegExp(`^${key}:\\s*["']?([^"'\\n]+)`, 'm'))?.[1]?.trim();
const POST_LASTMOD = new Map(
  readdirSync(POSTS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => {
      const source = readFileSync(new URL(`${entry.name}/index.md`, POSTS_DIR), 'utf8');
      const date = readFrontmatterDate(source, 'updatedAt') ?? readFrontmatterDate(source, 'publishedAt');
      return date ? [[entry.name, new Date(date).toISOString()]] : [];
    }),
);

const CODE_FONT_FAMILY = "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace";

export default defineConfig({
  site: 'https://danwoo.dev',
  trailingSlash: 'always',
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  integrations: [
    expressiveCode({
      // 라이트는 깔끔한 GitHub, 다크는 대비가 뚜렷한 One Dark Pro
      themes: ['github-light', 'one-dark-pro'],
      // 사이트 테마는 <html class="dark"> 하나로 결정한다(OS 설정은 첫 방문 기본값으로만 쓴다)
      themeCssSelector: (theme) => (theme.type === 'dark' ? '.dark' : ':root:not(.dark)'),
      useDarkModeMediaQuery: false,
      styleOverrides: {
        codeFontFamily: CODE_FONT_FAMILY,
        codeFontSize: '0.875rem',
        codeLineHeight: '1.7',
        uiFontFamily: 'var(--font-maruburi)',
        borderRadius: 'var(--radius-lg)',
        borderColor: 'var(--color-border)',
        frames: { frameBoxShadowCssValue: 'none' },
      },
    }),
    // 자동 생성 리포트(/book/<날짜>-<종류>/)는 애드센스 심사 동안 색인하지 않는다. book/[slug].astro의 noindex와 함께 걷어 낸다
    sitemap({
      filter: (page) => !/\/book\/[^/]+\/$/.test(new URL(page).pathname),
      serialize: (item) => {
        const slug = new URL(item.url).pathname.match(/^\/posts\/([^/]+)\/$/)?.[1];
        const lastmod = slug && POST_LASTMOD.get(slug);
        return lastmod ? { ...item, lastmod } : item;
      },
    }),
  ],
  markdown: {
    processor: satteri({
      hastPlugins: [articleHastPlugin],
      // 원문의 따옴표·'--'·'...'를 그대로 둔다(기술 글에서 기호가 바뀌면 의미가 달라진다)
      features: { smartPunctuation: false },
    }),
  },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '~': new URL('./src', import.meta.url).pathname,
      },
    },
  },
});
