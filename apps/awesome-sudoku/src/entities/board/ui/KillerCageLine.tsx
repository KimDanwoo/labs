import { memo } from "react";

interface KillerCageLineProps {
  path: string;
  color?: string;
}

export const KillerCageLine = memo<KillerCageLineProps>(({ path, color = "#436def" }) => (
  <path
    d={path}
    fill="none"
    stroke={color}
    strokeWidth={1}
    strokeDasharray="4,4"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="opacity-90"
  />
));

KillerCageLine.displayName = "KillerCageLine";
