const base = require('@repo/prettier-config');

module.exports = {
  ...base,
  plugins: [...base.plugins, 'prettier-plugin-astro'],
  overrides: [{ files: '*.astro', options: { parser: 'astro' } }],
};
