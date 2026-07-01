const base = require('@repo/prettier-config');

// dansoon은 Astro 앱 — 공유 포맷 규칙(@repo/prettier-config)은 그대로 쓰되,
// .astro 파일 파싱을 위해 prettier-plugin-astro만 로컬로 추가한다.
module.exports = {
  ...base,
  plugins: [...base.plugins, 'prettier-plugin-astro'],
  overrides: [{ files: '*.astro', options: { parser: 'astro' } }],
};
