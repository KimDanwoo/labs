import { defineConfig } from '@playwright/test';

const PORT = 3111;

/** Runs against the static export; build first with `pnpm build`. */
export default defineConfig({
  testDir: 'e2e',
  // Several tests walk the child across a whole painting before they assert anything.
  timeout: 60_000,
  // Parallel WebGL pages starve each other in headless Chrome and never finish loading.
  workers: 1,
  use: { baseURL: `http://127.0.0.1:${PORT}`, channel: 'chrome', viewport: { width: 1280, height: 800 } },
  webServer: {
    command: `node e2e/serve.mjs out ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: false,
    stdout: 'ignore',
    stderr: 'ignore',
  },
});
