import nextConfig from '@repo/eslint-config/next.eslint.config.mjs';
import fsdConfig from '@repo/eslint-config/fsd.config.mjs';

const EXTERNAL_ARTWORK_IMAGES = [
  'src/views/player/ui/archive/ArchiveRecord.tsx',
  'src/views/player/ui/stage/Stage.tsx',
];

const eslintConfig = [
  { ignores: ['.next/**', 'out/**', 'build/**', 'next-env.d.ts'] },
  ...nextConfig,
  ...fsdConfig,
  { files: EXTERNAL_ARTWORK_IMAGES, rules: { '@next/next/no-img-element': 'off' } },
];

export default eslintConfig;
