import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:3109',
    channel: process.env.CI ? undefined : 'chrome',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'next dev --hostname 127.0.0.1 --port 3109',
    url: 'http://127.0.0.1:3109/search',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
