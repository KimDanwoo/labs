import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  // Supabase의 일시 장애 재시도까지 기다린 뒤 최종 오류 화면을 검증한다.
  expect: { timeout: 15_000 },
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:3109',
    channel: process.env.CI ? undefined : 'chrome',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node e2e/dev-server.mjs',
    url: 'http://127.0.0.1:3109/search',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
