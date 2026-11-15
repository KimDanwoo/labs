import { worldAsset } from '../config/worldAsset';

export function IslandIdentity() {
  return (
    <header className="island-identity" aria-label="Danwoo Island">
      <img className="island-symbol" src={worldAsset('ui/islandMark.webp')} alt="" aria-hidden="true" />
      <span>
        DANWOO
        <br />
        ISLAND
        <span className="island-dot">.</span>
      </span>
    </header>
  );
}
