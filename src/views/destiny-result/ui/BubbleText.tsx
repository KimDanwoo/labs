import { cn } from '@shared/lib/cn';

type BubbleTextProps = {
  text: string;
  top?: string;
  left?: string;
  right?: string;
  width?: string;
  className?: string;
};

export function BubbleText({
  text,
  top,
  left,
  right,
  width,
  className,
}: BubbleTextProps) {
  const isPositioned =
    top !== undefined || left !== undefined || right !== undefined;
  return (
    <p
      className={cn(
        'text-[#1a1a2e] font-bold leading-snug whitespace-pre-line',
        'text-center',
        isPositioned && 'absolute flex items-center justify-center',
        className,
      )}
      style={{
        fontSize: '16px',
        ...(isPositioned ? { top, left, right, width } : undefined),
      }}
    >
      {text.replace(/\\n/g, '\n')}
    </p>
  );
}
