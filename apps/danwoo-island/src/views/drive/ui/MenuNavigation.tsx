import { MENU_SECTIONS } from '@views/drive/config/menu';
import { MenuNavItem } from '@views/drive/ui/MenuNavItem';

export function MenuNavigation() {
  return (
    <div className="js-navigation navigation">
      {MENU_SECTIONS.map((section) => (
        <MenuNavItem key={section.name} section={section} />
      ))}
    </div>
  );
}
