import { defineConfig } from '@playwright/test';

const PORT = 3111;

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  workers: 1,
  maxFailures: 1,
  use: { baseURL: `http://127.0.0.1:${PORT}`, channel: 'chrome', viewport: { width: 1280, height: 800 } },
  webServer: {
    command: `node e2e/serve.mjs out ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: false,
    stdout: 'ignore',
    stderr: 'ignore',
  },
});
