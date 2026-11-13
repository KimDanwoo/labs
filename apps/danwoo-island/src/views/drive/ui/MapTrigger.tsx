import { worldAsset } from '../config/worldAsset';

export function MapTrigger() {
  return (
    <button className="js-map-trigger map-trigger" aria-label="지도 열기">
      <div className="button-inner">
        <div className="icon-container">
          <img className="map-icon" src={worldAsset('ui/map.svg')} alt="" loading="lazy" />
        </div>
      </div>
    </button>
  );
}
