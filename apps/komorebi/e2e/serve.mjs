// Static server for the exported site; python's http.server resets connections under parallel chunk loads.
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const [root = 'out', port = '3111'] = process.argv.slice(2);
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
};

async function resolveFile(urlPath) {
  const safe = normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, '');
  const candidate = join(root, safe);
  const info = await stat(candidate).catch(() => null);
  if (info?.isDirectory()) return join(candidate, 'index.html');
  if (info) return candidate;
  return `${candidate}.html`;
}

createServer(async (request, response) => {
  const file = await resolveFile(new URL(request.url ?? '/', 'http://localhost').pathname);
  const info = await stat(file).catch(() => null);
  if (!info) {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(response);
}).listen(Number(port), '127.0.0.1');
