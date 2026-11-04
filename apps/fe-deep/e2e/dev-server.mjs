import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { CATEGORY, QUESTION } from './fixtures.mjs';

// SSR과 브라우저가 모두 같은 읽기 전용 테스트 데이터에 접근한다. 실제 DB·계정은 사용하지 않는다.
const backend = createServer((request, response) => {
  if (request.method === 'OPTIONS') {
    response
      .writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      })
      .end();
    return;
  }
  if (request.method !== 'GET') {
    response.writeHead(405).end();
    return;
  }
  const url = new URL(request.url, 'http://127.0.0.1:3210');
  const data = url.pathname.endsWith('/categories')
    ? [CATEGORY]
    : url.pathname.endsWith('/questions')
      ? [QUESTION]
      : [];
  response
    .writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Content-Range': `0-0/${data.length}`,
    })
    .end(JSON.stringify(data));
});

backend.listen(3210, '127.0.0.1', () => {
  const require = createRequire(import.meta.url);
  const app = spawn(
    process.execPath,
    [require.resolve('next/dist/bin/next'), 'dev', '--hostname', '127.0.0.1', '--port', '3109'],
    {
      stdio: 'inherit',
      env: {
        ...process.env,
        NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:3210',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
        SUPABASE_SERVICE_ROLE_KEY: '',
        ADMIN_EMAILS: 'admin@example.invalid',
      },
    },
  );
  const stop = () => {
    app.kill('SIGTERM');
    backend.close();
  };
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);
  app.on('exit', (code) => {
    backend.close();
    process.exitCode = code ?? 0;
  });
});
