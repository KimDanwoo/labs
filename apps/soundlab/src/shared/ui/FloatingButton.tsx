import type { ComponentProps } from 'react';

import { cn } from '@shared/lib/cn';

/**
 * 화면 위에 떠 있는 원형 아이콘 버튼(우측 상단 오버레이)의 공통 골격.
 * 색·배경은 각 버튼이 className으로 준다 — 같은 속성을 두 곳에서 주면 Tailwind 클래스 충돌로 순서에 좌우된다.
 */
export function FloatingButton({ className, type = 'button', ...props }: ComponentProps<'button'>) {
  return (
    <button
      type={type}
      className={cn(
        'grid size-11 place-items-center rounded-full outline-none backdrop-blur-md transition-[color,background-color,box-shadow,transform] duration-150 active:scale-90',
        className,
      )}
      {...props}
    />
  );
}
