import type { MenuSectionName } from '../config/menu';
import { MENU_SECTION_CONTENTS } from './menuSectionContents';

interface MenuSectionContentProps {
  name: MenuSectionName;
}

export function MenuSectionContent({ name }: MenuSectionContentProps) {
  const Content = MENU_SECTION_CONTENTS[name];
  return (
    <div className={`js-content content ${name}-content`}>
      <Content />
    </div>
  );
}
