import { ICON_SHAPES, type IconName } from '@views/walk/config/icons';
import { IconShape } from '@views/walk/ui/IconShape';

interface IconProps {
  name: IconName;
}

export function Icon({ name }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICON_SHAPES[name].map((shape, index) => (
        <IconShape key={`${name}-${index}`} shape={shape} />
      ))}
    </svg>
  );
}
