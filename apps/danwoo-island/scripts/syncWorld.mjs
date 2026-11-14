import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { preparePortfolioContent } from './portfolioContent.mjs';

const SYNC_FORMAT_VERSION = '4';
const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WORLD_COMMIT = '70764a94756cc4de564e493c8ba46c4b5fe03ed1';
const WORLD_REPOSITORY = 'https://github.com/brunosimon/folio-2025.git';
const SPARSE_PATHS = ['/static/', '/license.md'];
const CHECKOUT_DIRECTORY = path.join(tmpdir(), `danwoo-island-world-${WORLD_COMMIT.slice(0, 7)}`);
const PUBLIC_DIRECTORY = path.join(APP_ROOT, 'public');
const WORLD_DIRECTORY = path.join(PUBLIC_DIRECTORY, 'world');
const STAGING_DIRECTORY = path.join(PUBLIC_DIRECTORY, '.world-staging');
const PREVIOUS_DIRECTORY = path.join(PUBLIC_DIRECTORY, '.world-previous');
const STAMP_FILE = '.stamp';
const OVERRIDES_DIRECTORY = path.join(APP_ROOT, 'world-overrides');
const CONTENT_MODULE = path.join(APP_ROOT, 'src/views/drive/lib/engine/data/danwoo.ts');
const LOCK_DIRECTORY = path.join(tmpdir(), 'danwoo-island-world.lock');
const LOCK_OWNER_FILE = path.join(LOCK_DIRECTORY, 'pid');
const LOCK_POLL_MS = 500;
const LOCK_OWNER_GRACE_MS = 5_000;
const LOCK_TIMEOUT_MS = 15 * 60 * 1000;
const REQUIRED_STATIC_FILES = [
  'respawns/respawnsReferences-compressed.glb',
  'palette.ktx',
  'basis/basis_transcoder.js',
  'draco/draco_decoder.js',
  'favicons/favicon.svg',
];

const UNUSED_STATIC_DIRECTORIES = ['projects', 'lab'];
const UNCOMPRESSED_FILES_IN_USE = new Set(['vehicle/default.glb', 'vehicle/oldSchool.glb']);
const COMPRESSED_COUNTERPART = [
  [/\.glb$/, '-compressed.glb'],
  [/\.png$/, '.ktx'],
];

function isUnusedStatic(source, staticDirectory) {
  const relative = path.relative(staticDirectory, source).split(path.sep).join('/');
  if (UNUSED_STATIC_DIRECTORIES.includes(relative)) return true;
  if (relative.endsWith('.wav')) return true;
  if (relative.endsWith('-compressed.glb') || UNCOMPRESSED_FILES_IN_USE.has(relative)) return false;
  return COMPRESSED_COUNTERPART.some(
    ([extension, counterpart]) => extension.test(relative) && existsSync(source.replace(extension, counterpart)),
  );
}

function sleep(milliseconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

function isProcessAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === 'EPERM';
  }
}

function isLockAbandoned() {
  const owner = Number(readText(LOCK_OWNER_FILE));
  if (Number.isInteger(owner) && owner > 0) return !isProcessAlive(owner);
  const createdAt = statSync(LOCK_DIRECTORY, { throwIfNoEntry: false })?.mtimeMs ?? Date.now();
  return Date.now() - createdAt > LOCK_OWNER_GRACE_MS;
}

function acquireLock() {
  const deadline = Date.now() + LOCK_TIMEOUT_MS;
  let hasAnnouncedWait = false;
  while (true) {
    try {
      mkdirSync(LOCK_DIRECTORY);
      writeFileSync(LOCK_OWNER_FILE, String(process.pid));
      return;
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }
    if (isLockAbandoned()) {
      rmSync(LOCK_DIRECTORY, { recursive: true, force: true });
      continue;
    }
    if (Date.now() > deadline) throw new Error(`다른 월드 동기화가 끝나지 않았어요: ${LOCK_DIRECTORY}`);
    if (!hasAnnouncedWait) process.stdout.write('다른 월드 동기화가 끝나기를 기다리고 있어요.\n');
    hasAnnouncedWait = true;
    sleep(LOCK_POLL_MS);
  }
}

function releaseLock() {
  if (readText(LOCK_OWNER_FILE) === String(process.pid)) rmSync(LOCK_DIRECTORY, { recursive: true, force: true });
}

function cleanUp() {
  rmSync(STAGING_DIRECTORY, { recursive: true, force: true });
  releaseLock();
}

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

function checkoutWorldStatic() {
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

function findMissingFiles(directory) {
  return REQUIRED_STATIC_FILES.filter((file) => !existsSync(path.join(directory, file)));
}

function readText(file) {
  return existsSync(file) ? readFileSync(file, 'utf8') : null;
}

function collectOverrides() {
  return readdirSync(OVERRIDES_DIRECTORY, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => {
      const source = path.join(entry.parentPath, entry.name);
      return { source, destination: path.relative(OVERRIDES_DIRECTORY, source) };
    });
}

function hashAssets(assets) {
  const hash = createHash('sha256');
  for (const asset of assets) hash.update(asset.destination).update(readFileSync(asset.source));
  return hash.digest('hex');
}

function isUpToDate(stamp, content) {
  return (
    readText(path.join(WORLD_DIRECTORY, STAMP_FILE)) === stamp &&
    findMissingFiles(WORLD_DIRECTORY).length === 0 &&
    content.assets.every((asset) => existsSync(path.join(WORLD_DIRECTORY, asset.destination))) &&
    readText(CONTENT_MODULE) === content.source
  );
}

function buildStaging(content, stamp) {
  const staticDirectory = checkoutWorldStatic();
  const missing = findMissingFiles(staticDirectory);
  if (missing.length) throw new Error(`받은 월드 에셋에 필수 파일이 없어요:\n${missing.join('\n')}`);
  rmSync(STAGING_DIRECTORY, { recursive: true, force: true });
  cpSync(staticDirectory, STAGING_DIRECTORY, {
    recursive: true,
    filter: (source) => !isUnusedStatic(source, staticDirectory),
  });
  cpSync(path.join(CHECKOUT_DIRECTORY, 'license.md'), path.join(STAGING_DIRECTORY, 'LICENSE.txt'));
  for (const asset of content.assets) {
    const destination = path.join(STAGING_DIRECTORY, asset.destination);
    mkdirSync(path.dirname(destination), { recursive: true });
    cpSync(asset.source, destination);
  }
  writeFileSync(path.join(STAGING_DIRECTORY, STAMP_FILE), stamp);
}

function publishStaging() {
  rmSync(PREVIOUS_DIRECTORY, { recursive: true, force: true });
  if (existsSync(WORLD_DIRECTORY)) renameSync(WORLD_DIRECTORY, PREVIOUS_DIRECTORY);
  try {
    renameSync(STAGING_DIRECTORY, WORLD_DIRECTORY);
  } catch (error) {
    if (existsSync(PREVIOUS_DIRECTORY)) renameSync(PREVIOUS_DIRECTORY, WORLD_DIRECTORY);
    throw error;
  }
  rmSync(PREVIOUS_DIRECTORY, { recursive: true, force: true });
}

function writeContentModule(source) {
  const temporary = `${CONTENT_MODULE}.tmp`;
  mkdirSync(path.dirname(CONTENT_MODULE), { recursive: true });
  writeFileSync(temporary, source);
  renameSync(temporary, CONTENT_MODULE);
}

const portfolio = preparePortfolioContent();
const overrides = collectOverrides();
const content = { source: portfolio.source, assets: [...portfolio.assets, ...overrides] };
const stamp = createHash('sha256')
  .update(SYNC_FORMAT_VERSION)
  .update(WORLD_COMMIT)
  .update(portfolio.hash)
  .update(hashAssets(overrides))
  .digest('hex');

const EXIT_CODE_BY_SIGNAL = { SIGINT: 130, SIGTERM: 143 };
for (const [signal, exitCode] of Object.entries(EXIT_CODE_BY_SIGNAL))
  process.on(signal, () => {
    cleanUp();
    process.exit(exitCode);
  });

acquireLock();
try {
  if (isUpToDate(stamp, content)) {
    process.stdout.write('월드 에셋이 최신이에요.\n');
  } else {
    buildStaging(content, stamp);
    publishStaging();
    writeContentModule(content.source);
    process.stdout.write(`월드 에셋을 준비했어요: ${path.relative(APP_ROOT, WORLD_DIRECTORY)}\n`);
  }
} finally {
  cleanUp();
}
