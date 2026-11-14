import { worldAsset } from '../config/worldAsset';

export function MenuTrigger() {
  return (
    <button className="js-menu-trigger menu-trigger" aria-label="메뉴 열기">
      <div className="button-inner">
        <div className="icon-container">
          <img className="menu-icon" src={worldAsset('ui/ink/menu.png')} alt="" loading="lazy" />
        </div>
      </div>
    </button>
  );
}
