import { MENU_SECTIONS } from '../config/menu';
import { MenuSectionContent } from './MenuSectionContent';

export function MenuContents() {
  return (
    <div className="container">
      <div className="contents js-contents">
        {MENU_SECTIONS.map(({ name }) => (
          <MenuSectionContent key={name} name={name} />
        ))}
      </div>
    </div>
  );
}
