type ToastVariant = 'amber' | 'rose';

type ToastMessageProps = {
  message: string;
  icon: string;
  variant: ToastVariant;
};

const VARIANT_STYLE: Record<
  ToastVariant,
  { text: string; background: string; shadow: string; border: string }
> = {
  amber: {
    text: 'text-amber-700',
    background: 'linear-gradient(135deg, #FFF7E6 0%, #FFE8B0 100%)',
    shadow:
      '0 8px 24px rgba(255, 183, 0, 0.2), 0 2px 4px rgba(0,0,0,0.04)',
    border: '1px solid rgba(255, 183, 0, 0.3)',
  },
  rose: {
    text: 'text-rose-600',
    background: 'linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)',
    shadow:
      '0 8px 24px rgba(244, 63, 94, 0.18), 0 2px 4px rgba(0,0,0,0.04)',
    border: '1px solid rgba(244, 63, 94, 0.3)',
  },
};

export default function ToastMessage({
  message,
  icon,
  variant,
}: ToastMessageProps) {
  const style = VARIANT_STYLE[variant];
  return (
    <div
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl font-bold text-sm ${style.text} animate-fade-in-up`}
      style={{
        background: style.background,
        boxShadow: style.shadow,
        border: style.border,
      }}
    >
      {icon} {message}
    </div>
  );
}
