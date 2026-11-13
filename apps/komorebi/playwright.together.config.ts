import { defineConfig } from '@playwright/test';
import base from './playwright.config';

export default defineConfig({
  ...base,
  testIgnore: [],
  testMatch: 'together.spec.ts',
  webServer: [
    { command: 'pnpm --filter @komorebi/realtime dev', url: 'http://127.0.0.1:8787/health', reuseExistingServer: true },
    { command: 'node e2e/serve.mjs out 3111', url: 'http://127.0.0.1:3111', reuseExistingServer: false },
  ],
});
