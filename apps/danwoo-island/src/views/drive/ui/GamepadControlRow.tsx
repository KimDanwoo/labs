import type { GamepadControl } from '../config/controls';
import { PlaystationKey } from './PlaystationKey';

interface GamepadControlRowProps {
  control: GamepadControl;
}

export function GamepadControlRow({ control }: GamepadControlRowProps) {
  if (control.kind === 'shared')
    return (
      <tr>
        <td>
          <span className="key">{control.key}</span>
        </td>
        <td>{control.action}</td>
      </tr>
    );

  return (
    <tr>
      <td>
        <span className="is-gamepad-button is-xbox key">{control.xbox}</span>{' '}
        <PlaystationKey button={control.playstation} />
      </td>
      <td>{control.action}</td>
    </tr>
  );
}
