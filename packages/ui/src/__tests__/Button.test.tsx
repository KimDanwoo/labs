import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from '../Button';

describe('Button', () => {
  it('children을 렌더링한다', () => {
    render(<Button>저장</Button>);
    expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument();
  });

  it('기본 variant는 primary다', () => {
    render(<Button>버튼</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-primary');
  });

  it.each(['primary', 'secondary', 'outline', 'ghost'] as const)('%s variant가 렌더링된다', (variant) => {
    render(<Button variant={variant}>버튼</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('disabled이면 클릭 핸들러가 호출되지 않는다', async () => {
    const handler = vi.fn();
    render(
      <Button disabled onClick={handler}>
        저장
      </Button>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(handler).not.toHaveBeenCalled();
  });

  it('className prop이 병합된다', () => {
    render(<Button className="extra-class">버튼</Button>);
    expect(screen.getByRole('button').className).toContain('extra-class');
  });
});
