import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { CHECKOUT_DIRECTORY, SPARSE_PATHS } from './worldPaths.mjs';
import { WORLD_COMMIT, WORLD_REPOSITORY } from './worldSource.mjs';

function git(args) {
  const result = spawnSync('git', args, {
    cwd: CHECKOUT_DIRECTORY,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`git ${args.join(' ')} 실패\n${result.stderr}`);
  return result.stdout.trim();
}

function hasCommit() {
  return spawnSync('git', ['cat-file', '-e', `${WORLD_COMMIT}^{commit}`], { cwd: CHECKOUT_DIRECTORY }).status === 0;
}

export function checkoutWorldStatic() {
  mkdirSync(CHECKOUT_DIRECTORY, { recursive: true });
  if (!existsSync(path.join(CHECKOUT_DIRECTORY, '.git'))) git(['init', '--quiet']);
  const remotes = git(['remote']).split('\n');
  git(
    remotes.includes('origin')
      ? ['remote', 'set-url', 'origin', WORLD_REPOSITORY]
      : ['remote', 'add', 'origin', WORLD_REPOSITORY],
  );
  git(['sparse-checkout', 'set', '--no-cone', ...SPARSE_PATHS]);
  if (!hasCommit()) git(['fetch', '--quiet', '--depth', '1', '--filter=blob:none', 'origin', WORLD_COMMIT]);
  git(['checkout', '--quiet', '--force', '--detach', WORLD_COMMIT]);
  return path.join(CHECKOUT_DIRECTORY, 'static');
}
