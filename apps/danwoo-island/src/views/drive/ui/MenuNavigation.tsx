import { MENU_SECTIONS } from '../config/menu';
import { MenuNavItem } from './MenuNavItem';

export function MenuNavigation() {
  return (
    <div className="js-navigation navigation">
      {MENU_SECTIONS.map((section) => (
        <MenuNavItem key={section.name} section={section} />
      ))}
    </div>
  );
}
