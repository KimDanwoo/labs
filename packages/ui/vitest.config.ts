import reactBase from '@danwoo/config/vitest/react';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
  reactBase,
  defineConfig({
    test: {
      coverage: {
        include: ['src/**'],
      },
    },
  }),
);
