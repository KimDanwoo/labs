/**
 * .dev 최상위 도메인은 이미 브라우저 HSTS preload 목록에 있어 preload 토큰은 넣지 않는다(https://hstspreload.org/?domain=danwoo.dev).
 */
export const HSTS = 'max-age=63072000; includeSubDomains';

export const PERMISSIONS_POLICY = 'camera=(), microphone=(), geolocation=()';

const FRAME_OPTIONS_BY_ANCESTORS = { none: 'DENY', self: 'SAMEORIGIN' };

/**
 * 모든 앱이 강제하는 기본 정책. Next는 nonce 없이 인라인 부트스트랩 스크립트를 넣으므로 'unsafe-inline'이 필요하다
 * (nonce는 모든 페이지를 동적 렌더링으로 바꾼다 — https://nextjs.org/docs/app/guides/content-security-policy).
 * 그래서 이 정책은 XSS 자체보다 허용하지 않은 외부 스크립트·통신·iframe을 막는 보조 방어다.
 */
const BASE_DIRECTIVES = {
  'default-src': ["'self'"],
  'base-uri': ["'self'"],
  'object-src': ["'none'"],
  'form-action': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'"],
  'script-src-attr': ["'none'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'blob:'],
  'font-src': ["'self'", 'data:'],
  'connect-src': ["'self'"],
  'media-src': ["'self'"],
  'worker-src': ["'self'"],
  'frame-src': ["'none'"],
  'manifest-src': ["'self'"],
};

/** 개발 서버의 React 디버깅(eval)과 HMR 웹소켓 */
const DEVELOPMENT_SOURCES = { 'script-src': ["'unsafe-eval'"], 'connect-src': ['ws:'] };

const NONE = "'none'";

function mergeSources(base, extra) {
  const merged = { ...base };
  for (const [directive, sources] of Object.entries(extra)) {
    const current = (merged[directive] ?? []).filter((source) => source !== NONE);
    merged[directive] = [...new Set([...current, ...sources])];
  }
  return merged;
}

const currentMode = () => (process.env.NODE_ENV === 'development' ? 'development' : 'production');

export function buildCsp({ sources = {}, frameAncestors = 'none', mode = currentMode() } = {}) {
  const developmentSources = mode === 'development' ? DEVELOPMENT_SOURCES : {};
  const directives = mergeSources(mergeSources(BASE_DIRECTIVES, sources), developmentSources);
  const policy = Object.entries(directives).map(([directive, values]) => `${directive} ${values.join(' ')}`);
  policy.push(`frame-ancestors '${frameAncestors}'`);
  if (mode === 'production') policy.push('upgrade-insecure-requests');
  return policy.join('; ');
}

export function createSecurityHeaders(options = {}) {
  const frameAncestors = options.frameAncestors ?? 'none';
  return [
    { key: 'Content-Security-Policy', value: buildCsp({ ...options, frameAncestors }) },
    { key: 'Strict-Transport-Security', value: HSTS },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: FRAME_OPTIONS_BY_ANCESTORS[frameAncestors] },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: PERMISSIONS_POLICY },
    // Google 로그인 팝업(signInWithPopup)이 opener로 결과를 돌려주므로 팝업은 허용한다
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
  ];
}
