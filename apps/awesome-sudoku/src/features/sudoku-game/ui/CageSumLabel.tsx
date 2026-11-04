import { memo } from 'react';

interface CageSumLabelProps {
  sum: number;
  x: number;
  y: number;
  fontSize: string;
}
export const CageSumLabel = memo<CageSumLabelProps>(({ sum, x, y, fontSize }) => (
  <div
    className="absolute font-medium text-[rgb(var(--color-accent))] z-20"
    style={{
      top: `${y}px`,
      left: `${x}px`,
      fontSize,
      lineHeight: '1',
      backgroundColor: 'rgb(var(--color-surface-primary))',
    }}
  >
    {sum}
  </div>
));

CageSumLabel.displayName = 'CageSumLabel';
