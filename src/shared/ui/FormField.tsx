import { cn } from '@shared/lib/cn';

type FormFieldProps = {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
};

export function FormField({
  label,
  hint,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('mb-4', className)}>
      <label className="block text-xs text-muted mb-1.5 ml-1">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-muted/60 mt-1 ml-1">{hint}</p>}
    </div>
  );
}
