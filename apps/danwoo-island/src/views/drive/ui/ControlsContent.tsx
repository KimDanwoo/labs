import { CONTROL_TABS, GAMEPAD_CONTROLS, KEYBOARD_CONTROLS, TOUCH_CONTROLS } from '../config/controls';
import { ControlTab } from './ControlTab';
import { ControlTabPanel } from './ControlTabPanel';
import { GamepadControlRow } from './GamepadControlRow';
import { KeyControlRow } from './KeyControlRow';

export function ControlsContent() {
  return (
    <div className="content-inner">
      <div className="js-tabs tabs">
        <div className="js-tabs-navigation tabs-navigation">
          {CONTROL_TABS.map(({ name, label }) => (
            <ControlTab key={name} name={name} label={label} />
          ))}
        </div>
        <div className="js-tabs-content text text-small tabs-content">
          <ControlTabPanel name="mouse-keyboard" isDefault>
            {KEYBOARD_CONTROLS.map((control) => (
              <KeyControlRow key={control.action} control={control} />
            ))}
          </ControlTabPanel>
          <ControlTabPanel name="touch">
            {TOUCH_CONTROLS.map((control) => (
              <KeyControlRow key={control.action} control={control} />
            ))}
          </ControlTabPanel>
          <ControlTabPanel name="gamepad">
            {GAMEPAD_CONTROLS.map((control) => (
              <GamepadControlRow key={control.action} control={control} />
            ))}
          </ControlTabPanel>
        </div>
      </div>
    </div>
  );
}
