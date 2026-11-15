import { worldAsset } from '../config/worldAsset';
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
        <div className="map-card">
          <header className="map-header">
            <img className="map-logo" src={worldAsset('ui/islandMark.png')} alt="" aria-hidden="true" />
            <h2 className="map-title">Danwoo Island</h2>
            <span className="map-badge">MAP</span>
            <CloseButton />
          </header>
          <div className="map-body">
            <div className="js-map-container map-container">
              <img className="js-texture texture" alt="" loading="lazy" />
              <img className="map-compass" src={worldAsset('ui/map/icons/compass.webp')} alt="" aria-hidden="true" />
              <div className="js-player player" />
            </div>
            <nav className="map-places" aria-label="장소 목록">
              <h3 className="map-places-title">어디로 갈까요?</h3>
              <ul className="js-map-places map-places-list" />
            </nav>
          </div>
          <p className="map-hint">장소를 누르면 그곳으로 이동해요 · M 키로 열고 닫기</p>
        </div>
      </div>
    </div>
  );
}
