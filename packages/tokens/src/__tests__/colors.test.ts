import { describe, expect, it } from 'vitest';
import { colors } from '../colors';

const SEMANTIC_ROLES = ['primary', 'secondary', 'success', 'error', 'warning', 'info'] as const;
const CSS_COLOR_RE = /^(#[0-9a-fA-F]{3,8}|rgba?\(|hsl)/;

describe('colors (semantic)', () => {
  it('모든 토큰에 light·dark 값이 있다', () => {
    for (const [key, value] of Object.entries(colors)) {
      expect(value, `${key}.light 없음`).toHaveProperty('light');
      expect(value, `${key}.dark 없음`).toHaveProperty('dark');
      expect(typeof value.light, `${key}.light는 string이어야 함`).toBe('string');
      expect(typeof value.dark, `${key}.dark는 string이어야 함`).toBe('string');
    }
  });

  it('light·dark 값은 유효한 CSS 색상 포맷이다', () => {
    for (const [key, value] of Object.entries(colors)) {
      expect(value.light, `${key}.light 포맷 오류`).toMatch(CSS_COLOR_RE);
      expect(value.dark, `${key}.dark 포맷 오류`).toMatch(CSS_COLOR_RE);
    }
  });

  it.each(SEMANTIC_ROLES)('%s 역할의 base·foreground·subtle이 존재한다', (role) => {
    expect(colors).toHaveProperty(role);
    expect(colors).toHaveProperty(`${role}-foreground`);
    expect(colors).toHaveProperty(`${role}-subtle`);
  });
});
