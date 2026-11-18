import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { configDefaults, defineConfig } from 'vitest/config';

export const FIRESTORE_RULES_TEST = '__tests__/firestore.rules.test.ts';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    exclude: [...configDefaults.exclude, FIRESTORE_RULES_TEST],
  },
  resolve: {
    alias: {
      '@app': resolve(__dirname, './src/app'),
      '@views': resolve(__dirname, './src/views'),
      '@entities': resolve(__dirname, './src/entities'),
      '@features': resolve(__dirname, './src/features'),
      '@shared': resolve(__dirname, './src/shared'),
      '@test': resolve(__dirname, './src/test'),
    },
  },
});
