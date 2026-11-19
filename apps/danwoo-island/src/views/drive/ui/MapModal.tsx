import { ISLAND_MARK_ASSET } from '../config/menu';
import { worldAsset } from '../config/worldAsset';
import { CloseButton } from './CloseButton';
import { MapCard } from './MapCard';
import { MapPlaces } from './MapPlaces';

export function MapModal() {
  return (
    <div className="js-modal modal map" data-name="map">
      <div className="map-hud">
        <header className="map-chip">
          <img className="map-chip-logo" src={worldAsset(ISLAND_MARK_ASSET)} alt="" aria-hidden="true" />
          <h2 className="map-chip-title">MAP</h2>
        </header>
        <div className="js-map-pins map-pins" />
        <div className="js-map-car map-car" aria-hidden="true" />
        <MapCard />
        <MapPlaces />
        <p className="map-hint">
          끌어서 둘러보고 핀을 눌러 이동<span className="map-hint-keys"> · M 닫기</span>
        </p>
        <CloseButton />
      </div>
    </div>
  );
}
