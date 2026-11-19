import { ISLAND_MARK_ASSET } from '../config/menu';
import { worldAsset } from '../config/worldAsset';
import { CloseButton } from './CloseButton';

interface PanelHeaderProps {
  title: string;
  badge: string;
}

export function PanelHeader({ title, badge }: PanelHeaderProps) {
  return (
    <header className="panel-header">
      <img className="panel-logo" src={worldAsset(ISLAND_MARK_ASSET)} alt="" aria-hidden="true" />
      <h2 className="panel-title">{title}</h2>
      <span className="panel-badge">{badge}</span>
      <CloseButton />
    </header>
  );
}
