import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge } from '../Badge';

describe('Badge', () => {
  it('children을 렌더링한다', () => {
    render(<Badge>신규</Badge>);
    expect(screen.getByText('신규')).toBeInTheDocument();
  });

  it('기본 tone은 primary다', () => {
    render(<Badge>뱃지</Badge>);
    expect(screen.getByText('뱃지').className).toContain('bg-primary-subtle');
  });

  it.each(['primary', 'secondary', 'success', 'error', 'warning', 'info'] as const)('%s tone이 렌더링된다', (tone) => {
    render(<Badge tone={tone}>{tone}</Badge>);
    expect(screen.getByText(tone)).toBeInTheDocument();
  });
});
