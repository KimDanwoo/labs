import { OUTLINE } from '@widgets/transport/model/constants';

export function LinkIcon() {
  return (
    <svg {...OUTLINE} className="size-[18px]">
      <path d="M10 13.5a3.5 3.5 0 005 0l3.5-3.5a3.5 3.5 0 00-5-5L11.8 6.7" />
      <path d="M14 10.5a3.5 3.5 0 00-5 0L5.5 14a3.5 3.5 0 005 5l1.7-1.7" />
    </svg>
  );
}
