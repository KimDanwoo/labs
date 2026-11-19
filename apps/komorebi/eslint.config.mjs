import nextConfig from '@repo/eslint-config/next.eslint.config.mjs';
import fsdConfig from '@repo/eslint-config/fsd.config.mjs';

const CSS_ANIMATED_SPRITE_IMAGES = [
  'src/views/walk/ui/AquariumView.tsx',
];

const eslintConfig = [
  { ignores: ['.next/**', 'out/**', 'build/**', 'next-env.d.ts'] },
  ...nextConfig,
  ...fsdConfig,
  { files: CSS_ANIMATED_SPRITE_IMAGES, rules: { '@next/next/no-img-element': 'off' } },
];

export default eslintConfig;
