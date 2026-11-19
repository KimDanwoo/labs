import { preload } from 'react-dom';

import { CRITICAL_WORLD_ASSETS, worldAsset } from '../config/worldAsset';
import '../styles/glass.css';
import '../styles/world.css';
import { IslandIdentity } from './IslandIdentity';
import { MapTrigger } from './MapTrigger';
import { Menu } from './Menu';
import { MenuTrigger } from './MenuTrigger';
import { Modals } from './Modals';
import { TouchButtons } from './TouchButtons';
import { WorldBoot } from './WorldBoot';

export function DriveView() {
  for (const asset of CRITICAL_WORLD_ASSETS) preload(worldAsset(asset), { as: 'fetch', crossOrigin: 'anonymous' });

  return (
    <>
      <h1 className="visually-hidden">Danwoo Island — 3D 포트폴리오</h1>
      <IslandIdentity />
      <div className="game">
        <canvas
          className="js-canvas"
          role="img"
          aria-label="Danwoo Island 3D 섬. 방향키나 WASD로 차를 몰아 섬의 구역을 둘러볼 수 있어요."
        />
        <TouchButtons />
        <MenuTrigger />
        <MapTrigger />
        <Menu />
        <Modals />
        <div className="js-notifications notifications">
          <div className="js-items items" />
        </div>
      </div>
      <WorldBoot />
    </>
  );
}
