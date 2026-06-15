import base from '@danwoo/config/vitest/base';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
  base,
  defineConfig({
    test: {
      environment: 'node',
      coverage: {
        include: ['src/**'],
        exclude: ['src/index.ts'],
      },
    },
  }),
);
