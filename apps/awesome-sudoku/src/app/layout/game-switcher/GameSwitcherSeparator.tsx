import { GAME_SWITCHER_TEXT } from '@app/config/gameSwitcher';

export function GameSwitcherSeparator() {
  return (
    <span aria-hidden="true" className="shrink-0 select-none text-lg font-medium text-border-medium">
      {GAME_SWITCHER_TEXT.separator}
    </span>
  );
}
