import { useId } from 'react';
import { ATLAS_COPY } from '../config/map';
import { DIALOG } from '../config/walk';
import { journeyLine } from '../lib/journey';
import { useModal } from '../model/hooks/useModal';
import { useWalkContext } from '../model/hooks/useWalkContext';
import { AtlasGuides } from './AtlasGuides';
import { DiscoveryList } from './DiscoveryList';
import { Icon } from './Icon';

export function WalkAtlas() {
  const { dialog, status, collection, closeAtlas: onClose, returnHome } = useWalkContext();
  const isJournal = dialog === DIALOG.journal;
  const copy = ATLAS_COPY[isJournal ? DIALOG.journal : DIALOG.map];
  const ref = useModal(dialog === DIALOG.map || isJournal);
  const titleId = useId();
  return (
    <dialog
      className="map-dialog"
      ref={ref}
      aria-labelledby={titleId}
      onCancel={onClose}
      onClose={(event) => {
        // A late close event from an earlier dismissal must not shut a dialog that was opened again.
        if (!event.currentTarget.open) onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="dialog-heading">
        <div>
          <span className="eyebrow">{copy.eyebrow}</span>
          <h2 id={titleId}>{copy.title}</h2>
        </div>
        <button className="tool" aria-label={copy.closeLabel} onClick={onClose}>
          <Icon name="close" />
        </button>
      </div>
      <p className="dialog-intro">{copy.intro}</p>
      {!isJournal && <AtlasGuides />}
      <DiscoveryList />
      <div className="map-footer">
        <span>{journeyLine(collection.visited.length, collection.pageCount, status.steps)}</span>
        {!isJournal && (
          <button onClick={returnHome}>
            <Icon name="home" /> 마을 입구로
          </button>
        )}
      </div>
    </dialog>
  );
}
