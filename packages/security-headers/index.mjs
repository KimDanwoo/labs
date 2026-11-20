export const HSTS = 'max-age=63072000; includeSubDomains';

export const PERMISSIONS_POLICY = 'camera=(), microphone=(), geolocation=()';

const FRAME_OPTIONS_BY_ANCESTORS = { none: 'DENY', self: 'SAMEORIGIN' };

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

const DEV_REACT_DEBUG_AND_HMR_SOURCES = { 'script-src': ["'unsafe-eval'"], 'connect-src': ['ws:'] };

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
  const developmentSources = mode === 'development' ? DEV_REACT_DEBUG_AND_HMR_SOURCES : {};
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
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
  ];
}
