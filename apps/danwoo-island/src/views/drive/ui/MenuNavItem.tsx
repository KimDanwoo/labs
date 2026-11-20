import type { MenuSection } from '@views/drive/config/menu';
import { worldAsset } from '@views/drive/config/worldAsset';

interface MenuNavItemProps {
  section: MenuSection;
}

export function MenuNavItem({ section: { name, label, icon } }: MenuNavItemProps) {
  return (
    <button className="js-navigation-item item" data-name={name} aria-label={label} title={label}>
      <div className="button-inner">
        <div className="icon-container">
          <img src={worldAsset(icon)} alt="" loading="lazy" />
        </div>
      </div>
    </button>
  );
}
