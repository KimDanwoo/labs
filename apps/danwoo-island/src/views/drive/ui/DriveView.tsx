import { preload } from 'react-dom';

import { CRITICAL_WORLD_ASSETS, worldAsset } from '../config/worldAsset';
import { FontsLoader } from './FontsLoader';
import { IslandIdentity } from './IslandIdentity';
import { MapTrigger } from './MapTrigger';
import { Menu } from './Menu';
import { MenuTrigger } from './MenuTrigger';
import { Modals } from './Modals';
import { TouchButtons } from './TouchButtons';
import { WorldBoot } from './WorldBoot';
import './world.css';

export function DriveView() {
  for (const asset of CRITICAL_WORLD_ASSETS) preload(worldAsset(asset), { as: 'fetch', crossOrigin: 'anonymous' });

  return (
    <>
      <IslandIdentity />
      <FontsLoader />
      <div className="game">
        <canvas className="js-canvas" />
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
