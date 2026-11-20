import { mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { readText } from './worldText.mjs';

const LOCK_DIRECTORY = path.join(tmpdir(), 'danwoo-island-world.lock');

const LOCK_OWNER_FILE = path.join(LOCK_DIRECTORY, 'pid');

const LOCK_POLL_MS = 500;

const LOCK_OWNER_GRACE_MS = 5_000;

const LOCK_TIMEOUT_MS = 15 * 60 * 1000;

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
  const isValidOwnerPid = Number.isInteger(owner) && owner > 0;
  if (isValidOwnerPid) return !isProcessAlive(owner);
  const createdAt = statSync(LOCK_DIRECTORY, { throwIfNoEntry: false })?.mtimeMs ?? Date.now();
  return Date.now() - createdAt > LOCK_OWNER_GRACE_MS;
}

export function acquireLock() {
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

export function releaseLock() {
  if (readText(LOCK_OWNER_FILE) === String(process.pid)) rmSync(LOCK_DIRECTORY, { recursive: true, force: true });
}
