import fsdConfig from '@repo/eslint-config/fsd.config.mjs';
import nextConfig from '@repo/eslint-config/next.eslint.config.mjs';

const eslintConfig = [
  { ignores: ['.next/**', 'out/**', 'build/**', 'public/**', 'src/views/drive/lib/engine/**/*.js', 'src/views/drive/lib/engine/data/danwoo.ts', 'next-env.d.ts'] },
  ...nextConfig,
  ...fsdConfig,
  // 월드 UI 아이콘은 원본 CSS·엔진이 <img> 클래스와 src를 직접 다룬다. next/image로 감싸면 그 DOM 계약이 깨진다.
  { files: ['src/views/drive/ui/**'], rules: { '@next/next/no-img-element': 'off' } },
];

export default eslintConfig;
