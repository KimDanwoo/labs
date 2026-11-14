import type { ComponentType } from 'react';

import { MENU_SECTIONS, type MenuSectionName } from '../config/menu';
import { worldAsset } from '../config/worldAsset';
import { CircuitContent } from './CircuitContent';
import { CloseButton } from './CloseButton';
import { ControlsContent } from './ControlsContent';
import { HomeContent } from './HomeContent';
import { OptionsContent } from './OptionsContent';

const CONTENT_BY_SECTION = {
  home: HomeContent,
  options: OptionsContent,
  controls: ControlsContent,
  circuit: CircuitContent,
} satisfies Record<MenuSectionName, ComponentType>;

export function Menu() {
  return (
    <div className="js-menu menu">
      <div className="inner">
        <CloseButton />
        <div className="js-navigation navigation">
          {MENU_SECTIONS.map(({ name, icon }) => (
            <button key={name} className="js-navigation-item item" data-name={name}>
              <div className="button-inner">
                <div className="icon-container">
                  <img src={worldAsset(icon)} alt="" loading="lazy" />
                </div>
              </div>
            </button>
          ))}
        </div>
        <div className="container">
          <div className="previews js-previews">
            {MENU_SECTIONS.map(({ name, preview }) => (
              <div key={name} className={`js-preview preview ${name}-preview`}>
                <img className="background" src={worldAsset(preview)} alt="" loading="lazy" draggable={false} />
              </div>
            ))}
          </div>
          <div className="contents js-contents">
            {MENU_SECTIONS.map(({ name }) => {
              const Content = CONTENT_BY_SECTION[name];
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
