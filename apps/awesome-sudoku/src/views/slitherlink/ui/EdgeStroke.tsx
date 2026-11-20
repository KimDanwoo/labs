import type { EdgeSegment } from '@views/slitherlink/lib/boardGeometry';

interface EdgeStrokeProps {
  segment: EdgeSegment;
  width: number;
  className?: string;
}

export function EdgeStroke({ segment, width, className }: EdgeStrokeProps) {
  return (
    <line
      x1={segment.x1}
      y1={segment.y1}
      x2={segment.x2}
      y2={segment.y2}
      strokeWidth={width}
      pathLength={1}
      className={className}
    />
  );
}
