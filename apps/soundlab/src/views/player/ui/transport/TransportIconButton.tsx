import type { ComponentProps } from 'react';

// 켜짐 표시를 hover/focus가 덮지 않게 변형을 겹쳐 특정도를 올린다.
// (hover:text-paper 와 aria-[pressed=true]:text-brass 는 특정도가 같아 순서에 좌우된다 —
//  클릭 직후엔 커서가 버튼 위에 있으므로 그때 정확히 꺼진 것처럼 보였다.)
export function TransportIconButton({ type = 'button', ...props }: ComponentProps<'button'>) {
  return (
    <button
      type={type}
      className="grid size-11 place-items-center rounded-full outline-none transition-[color,background-color,transform] duration-150 active:scale-90 text-dim hover:text-paper hover:bg-hairline-soft focus-visible:text-paper focus-visible:bg-hairline-soft aria-[pressed=true]:text-brass aria-[pressed=true]:bg-brass/15 aria-[pressed=true]:hover:text-brass aria-[pressed=true]:hover:bg-brass/25 aria-[pressed=true]:focus-visible:text-brass aria-[pressed=true]:focus-visible:bg-brass/25"
      {...props}
    />
  );
}
