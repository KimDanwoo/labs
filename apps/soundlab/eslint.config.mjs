import nextConfig from '@repo/eslint-config/next.eslint.config.mjs';
import fsdConfig from '@repo/eslint-config/fsd.config.mjs';

const eslintConfig = [
  { ignores: ['.next/**', 'out/**', 'build/**', 'next-env.d.ts'] },
  ...nextConfig,
  ...fsdConfig,
];

export default eslintConfig;
