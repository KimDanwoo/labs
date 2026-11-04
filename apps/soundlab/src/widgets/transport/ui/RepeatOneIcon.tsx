import { OUTLINE, REPEAT_LOOP } from '@widgets/transport/model/constants';

export function RepeatOneIcon() {
  return (
    <svg {...OUTLINE} className="size-[19px]">
      <path d={REPEAT_LOOP} />
      <path d="M11.1 10.9l1.3-.7v3.6" />
    </svg>
  );
}
