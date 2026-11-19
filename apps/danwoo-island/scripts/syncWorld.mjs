import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { preparePortfolioContent } from './portfolioContent.mjs';
import { checkoutWorldStatic } from './worldCheckout.mjs';
import {
  APP_ROOT,
  CHECKOUT_DIRECTORY,
  CONTENT_MODULE,
  LEGACY_CONTENT_MODULE,
  OVERRIDES_DIRECTORY,
  PREVIOUS_DIRECTORY,
  STAGING_DIRECTORY,
  STAMP_FILE,
  SYNC_FORMAT_VERSION,
  WORLD_DIRECTORY,
} from './worldPaths.mjs';
import { WORLD_COMMIT } from './worldSource.mjs';
import { REQUIRED_STATIC_FILES, isUnusedStatic } from './worldStaticFiles.mjs';
import { acquireLock, releaseLock } from './worldSyncLock.mjs';
import { readText } from './worldText.mjs';

function cleanUp() {
  rmSync(STAGING_DIRECTORY, { recursive: true, force: true });
  releaseLock();
}

function findMissingFiles(directory) {
  return REQUIRED_STATIC_FILES.filter((file) => !existsSync(path.join(directory, file)));
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
  rmSync(LEGACY_CONTENT_MODULE, { force: true });
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
