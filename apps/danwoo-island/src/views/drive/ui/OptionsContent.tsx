import { PAINT_OPTIONS } from '../config/menu';
import { worldAsset } from '../config/worldAsset';

export function OptionsContent() {
  return (
    <div className="content-inner">
      <div className="title">Options</div>
      <table className="options">
        <tbody>
          <tr>
            <td>Audio</td>
            <td>
              <button className="js-audio-toggle audio-toggle button is-small has-tooltip">
                <div className="tooltip">Toggles sound</div>
                <img
                  className="icon icon-audio audio-on"
                  src={worldAsset('ui/audio/audioOn.svg')}
                  alt=""
                  loading="lazy"
                />{' '}
                <img
                  className="icon icon-audio audio-off"
                  src={worldAsset('ui/audio/audioOff.svg')}
                  alt=""
                  loading="lazy"
                />
              </button>
            </td>
          </tr>
          <tr>
            <td>Quality</td>
            <td>
              <button className="js-quality-toggle quality-toggle button is-small has-tooltip">
                <div className="tooltip">Toggles some effects</div>
                <span>Low</span>
              </button>
            </td>
          </tr>
          <tr>
            <td>I&apos;m stuck!</td>
            <td>
              <button className="js-respawn button is-small has-tooltip">
                <div className="tooltip">Teleports you to the closest respawn</div>
                Respawn
              </button>
            </td>
          </tr>
          <tr>
            <td>Reset</td>
            <td>
              <button className="js-reset button is-small has-tooltip">
                <div className="tooltip">Resets every object</div>
                Reset
              </button>
            </td>
          </tr>
          <tr>
            <td>Renderer</td>
            <td>
              <button className="js-renderer button is-small is-disabled is-success has-tooltip">
                <div className="js-tooltip tooltip">Best for performance</div>
                <span>WebGPU</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div className="paint-options">
        <label htmlFor="vehicle-paint">차량 도색</label>
        <select id="vehicle-paint" className="js-paint-select button">
          {PAINT_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
