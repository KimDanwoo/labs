import { CONTROL_TABS, GAMEPAD_CONTROLS, KEYBOARD_CONTROLS, TOUCH_CONTROLS } from '../config/controls';
import { GamepadControlRow } from './GamepadControlRow';
import { KeyControlRow } from './KeyControlRow';

export function ControlsContent() {
  return (
    <div className="content-inner">
      <div className="js-tabs tabs">
        <div className="js-tabs-navigation tabs-navigation">
          {CONTROL_TABS.map(({ name, label }) => (
            <button key={name} className="js-tabs-navigation-item tab" data-tabs-name={name}>
              <div className="active-background" />
              <span className="icon-container">
                <span className={`icon icon-${name}`} />
              </span>
              <span className="label">{label}</span>
            </button>
          ))}
        </div>
        <div className="js-tabs-content text text-small tabs-content">
          <div
            className="js-tabs-content-item tabs-content-item mouse-keyboard"
            data-tabs-name="mouse-keyboard"
            data-tabs-default=""
          >
            <div className="js-tabs-content-inner list">
              <table>
                <tbody>
                  {KEYBOARD_CONTROLS.map((control) => (
                    <KeyControlRow key={control.action} control={control} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="js-tabs-content-item tabs-content-item touch" data-tabs-name="touch">
            <div className="js-tabs-content-inner list">
              <table>
                <tbody>
                  {TOUCH_CONTROLS.map((control) => (
                    <KeyControlRow key={control.action} control={control} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="js-tabs-content-item tabs-content-item gamepad" data-tabs-name="gamepad">
            <div className="js-tabs-content-inner list">
              <table>
                <tbody>
                  {GAMEPAD_CONTROLS.map((control) => (
                    <GamepadControlRow key={control.action} control={control} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
