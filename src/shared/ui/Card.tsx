import { cn } from '@shared/lib/cn';

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={cn(
        'bg-card-bg border border-card-border rounded-2xl shadow-xl shadow-black/40',
        className,
      )}
    >
      {children}
    </div>
  );
}
