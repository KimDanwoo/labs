import { CloseButton } from '@views/drive/ui/CloseButton';
import { MenuContents } from '@views/drive/ui/MenuContents';
import { MenuNavigation } from '@views/drive/ui/MenuNavigation';

export function Menu() {
  return (
    <div className="js-menu menu">
      <div className="inner">
        <CloseButton />
        <MenuNavigation />
        <MenuContents />
      </div>
    </div>
  );
}
