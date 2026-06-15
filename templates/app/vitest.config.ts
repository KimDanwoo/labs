import reactBase from '@danwoo/config/vitest/react';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, mergeConfig } from 'vitest/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default mergeConfig(
  reactBase,
  defineConfig({
    resolve: {
      alias: {
        '@app': resolve(__dirname, 'src/app'),
        '@views': resolve(__dirname, 'src/views'),
        '@widgets': resolve(__dirname, 'src/widgets'),
        '@features': resolve(__dirname, 'src/features'),
        '@entities': resolve(__dirname, 'src/entities'),
        '@shared': resolve(__dirname, 'src/shared'),
      },
    },
    test: {
      coverage: {
        include: ['src/**'],
        exclude: ['src/app/**'],
      },
    },
  }),
);
