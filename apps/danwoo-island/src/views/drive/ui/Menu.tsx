import { CloseButton } from './CloseButton';
import { MenuContents } from './MenuContents';
import { MenuNavigation } from './MenuNavigation';

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
