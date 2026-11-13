import { CloseButton } from './CloseButton';

export function Modals() {
  return (
    <div className="js-modals modals">
      <div className="js-modal modal circuit-end" data-name="circuit-end">
        <div className="content">
          <div className="title">완주했어요</div>
          <p className="text">이번 주행 시간</p>
          <div className="js-time time" />
          <div className="horizontal-group">
            <button className="js-button-restart button">다시 달리기</button>
            <button className="js-close button">돌아가기</button>
          </div>
        </div>
      </div>
      <div className="js-modal modal map" data-name="map">
        <CloseButton />
        <div className="js-map-container map-container">
          <img className="js-texture texture" alt="" loading="lazy" />
          <div className="js-player player" />
        </div>
      </div>
    </div>
  );
}
