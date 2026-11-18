import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { createSecurityHeaders } from '../index.mjs';

/** 정적 앱은 next.config 헤더가 적용되지 않아 vercel.json에 같은 값을 적어 둔다 — 공유 값과 어긋나지 않는지 확인한다 */
const STATIC_APPS = [{ name: 'komorebi', frameAncestors: 'none' }];

const HARDENING_DIRECTIVES = ["object-src 'none'", "base-uri 'self'", "form-action 'self'", "script-src-attr 'none'"];

const SHARED_KEYS = [
  'Strict-Transport-Security',
  'X-Content-Type-Options',
  'X-Frame-Options',
  'Referrer-Policy',
  'Permissions-Policy',
  'Cross-Origin-Opener-Policy',
];

function readHeaders(app) {
  const config = JSON.parse(readFileSync(new URL(`../../../apps/${app}/vercel.json`, import.meta.url), 'utf8'));
  const route = config.headers?.find((entry) => entry.source === '/(.*)');
  return new Map((route?.headers ?? []).map((header) => [header.key, header.value]));
}

describe('정적 앱 vercel.json 보안 헤더', () => {
  for (const { name, frameAncestors } of STATIC_APPS) {
    const headers = readHeaders(name);
    const expected = new Map(
      createSecurityHeaders({ mode: 'production', frameAncestors }).map((h) => [h.key, h.value]),
    );

    it(`${name}: 공통 헤더 값이 공유 패키지와 같다`, () => {
      for (const key of SHARED_KEYS) assert.equal(headers.get(key), expected.get(key), key);
    });

    it(`${name}: 강제 CSP에 기본 차단 지시어와 frame-ancestors가 있다`, () => {
      const csp = headers.get('Content-Security-Policy') ?? '';
      for (const directive of HARDENING_DIRECTIVES) assert.ok(csp.includes(directive), directive);
      assert.ok(csp.includes(`frame-ancestors '${frameAncestors}'`));
    });
  }
});
