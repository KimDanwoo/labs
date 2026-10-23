import { spawn } from 'node:child_process';
import { closeSync, openSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Codespaces invokes this on every resume. Keep a single development server.
try {
  await fetch('http://127.0.0.1:3011', { signal: AbortSignal.timeout(2500) });
  console.log('Komorebi is already listening on port 3011.');
  process.exit(0);
} catch {}
const repo = fileURLToPath(new URL('../../../', import.meta.url));
const logPath = join(tmpdir(), 'komorebi-dev.log');
const log = openSync(logPath, 'a');
const child = spawn('npx', ['--yes', 'pnpm@9.12.1', '--filter', 'komorebi', 'dev', '--hostname', '0.0.0.0'], {
  cwd: repo,
  detached: true,
  stdio: ['ignore', log, log],
});
child.on('error', (error) => {
  console.error(error);
  process.exitCode = 1;
});
child.unref();
closeSync(log);
console.log(`Starting Komorebi on port 3011. Logs: ${logPath}`);
