import { worldAsset } from '../config/worldAsset';

export function CloseButton() {
  return (
    <button className="js-close close" aria-label="닫기">
      <div className="button-inner">
        <div className="icon-container">
          <img className="icon is-default" src={worldAsset('ui/line/close.png')} alt="" loading="lazy" />{' '}
          <span className="icon is-xbox">A</span>
        </div>
      </div>
    </button>
  );
}
