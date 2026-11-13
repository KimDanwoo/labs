import { PAINT_OPTIONS } from '../config/menu';
import { worldAsset } from '../config/worldAsset';

export function OptionsContent() {
  return (
    <div className="content-inner">
      <div className="title">설정</div>
      <table className="options">
        <tbody>
          <tr>
            <td>소리</td>
            <td>
              <button className="js-audio-toggle audio-toggle button is-small has-tooltip">
                <div className="tooltip">소리를 켜고 꺼요</div>
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
            <td>그래픽</td>
            <td>
              <button className="js-quality-toggle quality-toggle button is-small has-tooltip">
                <div className="tooltip">일부 효과를 켜고 꺼요</div>
                <span>낮음</span>
              </button>
            </td>
          </tr>
          <tr>
            <td>차가 끼었어요</td>
            <td>
              <button className="js-respawn button is-small has-tooltip">
                <div className="tooltip">가까운 출발 지점으로 옮겨요</div>
                복귀
              </button>
            </td>
          </tr>
          <tr>
            <td>초기화</td>
            <td>
              <button className="js-reset button is-small has-tooltip">
                <div className="tooltip">모든 물건을 제자리로 돌려요</div>
                초기화
              </button>
            </td>
          </tr>
          <tr>
            <td>렌더러</td>
            <td>
              <button className="js-renderer button is-small is-disabled is-success has-tooltip">
                <div className="js-tooltip tooltip">성능이 가장 좋아요</div>
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
