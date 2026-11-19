import type { IconShape as Shape } from '../config/icons';

interface IconShapeProps {
  shape: Shape;
}

export function IconShape({ shape }: IconShapeProps) {
  if (shape.kind === 'circle') return <circle cx={shape.cx} cy={shape.cy} r={shape.r} />;
  return <path d={shape.d} />;
}
