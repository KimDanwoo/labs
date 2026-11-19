import { existsSync, readFileSync } from 'node:fs';

export function readText(file) {
  return existsSync(file) ? readFileSync(file, 'utf8') : null;
}
