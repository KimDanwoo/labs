import { OUTLINE, REPEAT_LOOP } from '@views/player/model/constants/icons';

export function RepeatIcon() {
  return (
    <svg {...OUTLINE} className="size-[19px]">
      <path d={REPEAT_LOOP} />
    </svg>
  );
}
