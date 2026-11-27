import { memo } from 'react';

interface KillerCageLineProps {
  path: string;
}

export const KillerCageLine = memo<KillerCageLineProps>(({ path }) => (
  <path
    d={path}
    fill="none"
    strokeWidth={1}
    strokeDasharray="4,4"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="stroke-text-tertiary opacity-90"
  />
));

KillerCageLine.displayName = 'KillerCageLine';
