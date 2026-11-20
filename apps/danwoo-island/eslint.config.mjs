import fsdConfig from '@repo/eslint-config/fsd.config.mjs';
import nextConfig from '@repo/eslint-config/next.eslint.config.mjs';

const WORLD_UI_OWNS_RAW_IMG_DOM = { files: ['src/views/drive/ui/**'], rules: { '@next/next/no-img-element': 'off' } };

const eslintConfig = [
  {
    ignores: [
      '.next/**',
      'out/**',
      'build/**',
      'public/**',
      'src/views/drive/lib/engine/data/danwoo.ts',
      'next-env.d.ts',
    ],
  },
  ...nextConfig,
  ...fsdConfig,
  WORLD_UI_OWNS_RAW_IMG_DOM,
];

export default eslintConfig;
