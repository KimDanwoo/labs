import fsdConfig from '@repo/eslint-config/fsd.config.mjs';
import nextConfig from '@repo/eslint-config/next.eslint.config.mjs';

const eslintConfig = [
  { ignores: ['.next/**', 'out/**', 'build/**', 'coverage/**', 'next-env.d.ts'] },
  ...nextConfig,
  ...fsdConfig,
];

export default eslintConfig;
