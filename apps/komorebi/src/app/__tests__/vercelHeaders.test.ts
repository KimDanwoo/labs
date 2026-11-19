import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { createSecurityHeaders } from '@repo/security-headers';

// output: 'export'라 next.config의 headers()가 적용되지 않아 vercel.json에 같은 값을 적어 둔다.
// 이 검사가 komorebi 테스트에 있어야 komorebi나 공유 헤더 어느 쪽이 바뀐 PR에서도 돈다.
const FRAME_ANCESTORS = 'none';
const HARDENING_DIRECTIVES = ["object-src 'none'", "base-uri 'self'", "form-action 'self'", "script-src-attr 'none'"];
const SHARED_KEYS = [
  'Strict-Transport-Security',
  'X-Content-Type-Options',
  'X-Frame-Options',
  'Referrer-Policy',
  'Permissions-Policy',
  'Cross-Origin-Opener-Policy',
];

interface VercelConfig {
  headers?: { source: string; headers: { key: string; value: string }[] }[];
}

function readHeaders(): Map<string, string> {
  const config = JSON.parse(readFileSync(new URL('../../../vercel.json', import.meta.url), 'utf8')) as VercelConfig;
  const route = config.headers?.find((entry) => entry.source === '/(.*)');
  return new Map((route?.headers ?? []).map((header) => [header.key, header.value]));
}

describe('vercel.json 보안 헤더', () => {
  const headers = readHeaders();
  const expected = new Map(
    createSecurityHeaders({ mode: 'production', frameAncestors: FRAME_ANCESTORS }).map((h) => [h.key, h.value]),
  );

  it('공통 헤더 값이 공유 패키지와 같다', () => {
    for (const key of SHARED_KEYS) assert.equal(headers.get(key), expected.get(key), key);
  });

  it('강제 CSP에 기본 차단 지시어와 frame-ancestors가 있다', () => {
    const csp = headers.get('Content-Security-Policy') ?? '';
    for (const directive of HARDENING_DIRECTIVES) assert.ok(csp.includes(directive), directive);
    assert.ok(csp.includes(`frame-ancestors '${FRAME_ANCESTORS}'`));
  });
});
