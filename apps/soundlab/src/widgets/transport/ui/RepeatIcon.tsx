import { OUTLINE, REPEAT_LOOP } from '@widgets/transport/model/constants';

export function RepeatIcon() {
  return (
    <svg {...OUTLINE} className="size-[19px]">
      <path d={REPEAT_LOOP} />
    </svg>
  );
}
