import { SOLID } from '@widgets/transport/model/constants';

export function PauseIcon() {
  return (
    <svg {...SOLID} className="size-[21px]">
      <path d="M8 5.5h3v13H8zM13 5.5h3v13h-3z" />
    </svg>
  );
}
