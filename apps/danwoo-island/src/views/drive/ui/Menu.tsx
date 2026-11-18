import { MENU_SECTIONS } from '../config/menu';
import { worldAsset } from '../config/worldAsset';
import { CloseButton } from './CloseButton';
import { MENU_SECTION_CONTENTS } from './menuSectionContents';

export function Menu() {
  return (
    <div className="js-menu menu">
      <div className="inner">
        <CloseButton />
        <div className="js-navigation navigation">
          {MENU_SECTIONS.map(({ name, label, icon }) => (
            <button key={name} className="js-navigation-item item" data-name={name} aria-label={label} title={label}>
              <div className="button-inner">
                <div className="icon-container">
                  <img src={worldAsset(icon)} alt="" loading="lazy" />
                </div>
              </div>
            </button>
          ))}
        </div>
        <div className="container">
          <div className="contents js-contents">
            {MENU_SECTIONS.map(({ name }) => {
              const Content = MENU_SECTION_CONTENTS[name];
              return (
                <div key={name} className={`js-content content ${name}-content`}>
                  <Content />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
