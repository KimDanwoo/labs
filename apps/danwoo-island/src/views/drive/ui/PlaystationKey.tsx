import type { PlaystationButton } from '../config/controls';

interface PlaystationKeyProps {
  button: PlaystationButton;
}

export function PlaystationKey({ button }: PlaystationKeyProps) {
  if (button.kind === 'icon') return <span className={`is-gamepad-button is-playstation is-icon ${button.icon}`} />;
  return <span className="is-gamepad-button is-playstation key">{button.label}</span>;
}
