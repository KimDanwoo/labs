import { OUTLINE } from '../../model/constants/icons';

export function QueueIcon() {
  return (
    <svg {...OUTLINE} className="size-[20px]">
      <path d="M4 6.5h11M4 12h11M4 17.5h7" />
      <path d="M17.5 13.5l4 2.5-4 2.5z" />
    </svg>
  );
}
