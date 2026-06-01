import type { HTMLAttributes } from 'react';

/**
 * Card primitive 레이어 — 디자인 시스템의 단일 source of truth.
 * 표면 스타일(글래스/보더/그림자)과 구조 슬롯을 여기서만 정의하고,
 * Flat(@ui/react/flat)과 Compound(@ui/react/card)는 이 primitive들을 재사용해 만든다.
 */

type DivProps = HTMLAttributes<HTMLDivElement>;

/** 프로스티드 글래스 표면 컨테이너. 모든 카드의 시각적 기준점. */
export function CardRoot({ className = '', ...props }: DivProps) {
  return (
    <div
      className={`flex flex-col gap-sm rounded-lg border border-card-border bg-glass p-lg shadow-md backdrop-blur-md transition-[box-shadow,border-color] duration-200 ${className}`}
      {...props}
    />
  );
}

/** 제목 영역 — 좌측 타이틀, 우측 액션/장식을 양끝 정렬한다. */
export function CardHeader({ className = '', ...props }: DivProps) {
  return <div className={`flex items-start justify-between gap-md ${className}`} {...props} />;
}

type HeadingProps = HTMLAttributes<HTMLHeadingElement>;

export function CardTitle({ className = '', ...props }: HeadingProps) {
  return <h3 className={`text-lg font-semibold text-foreground ${className}`} {...props} />;
}

type ParagraphProps = HTMLAttributes<HTMLParagraphElement>;

export function CardDescription({ className = '', ...props }: ParagraphProps) {
  return <p className={`text-sm text-muted ${className}`} {...props} />;
}

export function CardBody({ className = '', ...props }: DivProps) {
  return <div className={`flex flex-col gap-sm ${className}`} {...props} />;
}

export function CardFooter({ className = '', ...props }: DivProps) {
  return <div className={`flex items-center gap-sm pt-sm text-xs text-muted ${className}`} {...props} />;
}
