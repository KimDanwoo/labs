import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildCsp, createSecurityHeaders, HSTS } from '../index.mjs';

const directiveOf = (csp, name) =>
  csp
    .split('; ')
    .find((directive) => directive === name || directive.startsWith(`${name} `))
    ?.split(' ')
    .slice(1);

const headerValue = (headers, key) => headers.find((header) => header.key === key)?.value;

describe('buildCsp', () => {
  it('막아야 할 기본 지시어를 항상 넣는다', () => {
    const csp = buildCsp({ mode: 'production' });
    assert.deepEqual(directiveOf(csp, 'object-src'), ["'none'"]);
    assert.deepEqual(directiveOf(csp, 'base-uri'), ["'self'"]);
    assert.deepEqual(directiveOf(csp, 'form-action'), ["'self'"]);
    assert.deepEqual(directiveOf(csp, 'script-src-attr'), ["'none'"]);
    assert.deepEqual(directiveOf(csp, 'frame-ancestors'), ["'none'"]);
    assert.deepEqual(directiveOf(csp, 'upgrade-insecure-requests'), []);
  });

  it('앱 출처를 더하면 none을 지우고 중복 없이 합친다', () => {
    const csp = buildCsp({
      mode: 'production',
      sources: { 'frame-src': ['https://w.soundcloud.com'], 'img-src': ['data:', 'https://i1.sndcdn.com'] },
    });
    assert.deepEqual(directiveOf(csp, 'frame-src'), ['https://w.soundcloud.com']);
    assert.deepEqual(directiveOf(csp, 'img-src'), ["'self'", 'data:', 'blob:', 'https://i1.sndcdn.com']);
  });

  it('개발 모드는 eval·HMR 웹소켓을 열고 https 승격은 하지 않는다', () => {
    const csp = buildCsp({ mode: 'development' });
    assert.ok(directiveOf(csp, 'script-src').includes("'unsafe-eval'"));
    assert.ok(directiveOf(csp, 'connect-src').includes('ws:'));
    assert.equal(directiveOf(csp, 'upgrade-insecure-requests'), undefined);
  });

  it('프로덕션은 eval을 열지 않는다', () => {
    assert.ok(!buildCsp({ mode: 'production' }).includes("'unsafe-eval'"));
  });
});

describe('createSecurityHeaders', () => {
  it('X-Frame-Options를 frame-ancestors와 맞춘다', () => {
    assert.equal(headerValue(createSecurityHeaders({ mode: 'production' }), 'X-Frame-Options'), 'DENY');
    assert.equal(
      headerValue(createSecurityHeaders({ mode: 'production', frameAncestors: 'self' }), 'X-Frame-Options'),
      'SAMEORIGIN',
    );
  });

  it('HSTS에 preload를 넣지 않는다', () => {
    assert.ok(!HSTS.includes('preload'));
    assert.equal(headerValue(createSecurityHeaders(), 'Strict-Transport-Security'), HSTS);
  });
});
