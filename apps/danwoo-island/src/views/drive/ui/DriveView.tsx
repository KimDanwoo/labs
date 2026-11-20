import { preload } from 'react-dom';

import { CRITICAL_WORLD_ASSETS, worldAsset } from '@views/drive/config/worldAsset';
import '@views/drive/styles/glass.css';
import '@views/drive/styles/world.css';
import { IslandIdentity } from '@views/drive/ui/IslandIdentity';
import { MapTrigger } from '@views/drive/ui/MapTrigger';
import { Menu } from '@views/drive/ui/Menu';
import { MenuTrigger } from '@views/drive/ui/MenuTrigger';
import { Modals } from '@views/drive/ui/Modals';
import { TouchButtons } from '@views/drive/ui/TouchButtons';
import { WorldBoot } from '@views/drive/ui/WorldBoot';

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
