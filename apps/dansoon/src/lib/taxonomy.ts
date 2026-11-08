/**
 * 카테고리·태그의 ID와 화면 이름. ID는 URL과 frontmatter에 쓰이므로 바꾸지 않는다.
 * 이름만 바꿀 때는 *_LABEL만 고친다.
 */
export const CATEGORY_IDS = ['dev', 'retro', 'reading'] as const;
export type CategoryId = (typeof CATEGORY_IDS)[number];

export const CATEGORY_LABEL = {
  dev: '개발',
  retro: '회고',
  reading: '독서',
} satisfies Record<CategoryId, string>;

export const TAG_IDS = [
  'ai',
  'architecture',
  'ci-cd',
  'css',
  'design-pattern',
  'fsd',
  'functional-programming',
  'javascript',
  'nextjs',
  'react',
  'seo',
  'side-project',
  'spa',
  'state-management',
  'testing',
  'vue',
  'writing',
] as const;
export type TagId = (typeof TAG_IDS)[number];

export const TAG_LABEL = {
  ai: 'AI',
  architecture: '아키텍처',
  'ci-cd': 'CI/CD',
  css: 'CSS',
  'design-pattern': '디자인 패턴',
  fsd: 'FSD',
  'functional-programming': '함수형 프로그래밍',
  javascript: 'JavaScript',
  nextjs: 'Next.js',
  react: 'React',
  seo: 'SEO',
  'side-project': '사이드 프로젝트',
  spa: 'SPA',
  'state-management': '상태 관리',
  testing: '테스트',
  vue: 'Vue',
  writing: '글쓰기',
} satisfies Record<TagId, string>;
