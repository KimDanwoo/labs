import { satteri } from '@astrojs/markdown-satteri';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import expressiveCode from 'astro-expressive-code';
import { defineConfig } from 'astro/config';
import { articleHastPlugin } from './src/lib/articleHastPlugin.mjs';

const CODE_FONT_FAMILY = "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace";

export default defineConfig({
  site: 'https://log.danwoo.dev',
  trailingSlash: 'always',
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  integrations: [
    expressiveCode({
      themes: ['github-light', 'github-dark'],
      // 사이트 테마는 <html class="dark"> 하나로 결정한다(OS 설정은 첫 방문 기본값으로만 쓴다)
      themeCssSelector: (theme) => (theme.type === 'dark' ? '.dark' : ':root:not(.dark)'),
      useDarkModeMediaQuery: false,
      styleOverrides: {
        codeFontFamily: CODE_FONT_FAMILY,
        codeFontSize: '0.875rem',
        codeLineHeight: '1.7',
        uiFontFamily: 'var(--font-maruburi)',
        borderRadius: 'var(--radius-md)',
      },
    }),
    sitemap(),
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
