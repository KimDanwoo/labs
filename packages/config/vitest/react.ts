import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['@danwoo/config/vitest/setup'],
    coverage: {
      provider: 'v8',
    },
  },
});
