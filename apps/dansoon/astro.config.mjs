import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, passthroughImageService } from 'astro/config';

export default defineConfig({
  site: 'https://danwoo-dev.netlify.app',
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '~': new URL('./src', import.meta.url).pathname,
      },
    },
  },
  image: {
    service: passthroughImageService(),
  },
  markdown: {
    shikiConfig: {
      theme: 'github-light',
    },
  },
});
