export { Badge } from './Badge';
export type { BadgeTone } from './Badge';
export { Button } from './Button';
export type { ButtonVariant } from './Button';
export { ThemeToggle } from './ThemeToggle';

/**
 * Compound Card 를 dot-access(`<Card.Root>`)로도 쓸 수 있게 root 에서 namespace로 노출한다.
 * tree-shaking을 신경 쓴다면 `import * as Card from '@ui/react/card'` 서브패스를 권장.
 */
export * as Card from './card/compound';
