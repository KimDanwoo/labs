import { cn } from '@shared/lib/cn';

type ButtonGroupProps = {
  children: React.ReactNode;
  className?: string;
};

export function ButtonGroup({ children, className }: ButtonGroupProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 py-8 bg-white px-6',
        className,
      )}
    >
      {children}
    </div>
  );
}
