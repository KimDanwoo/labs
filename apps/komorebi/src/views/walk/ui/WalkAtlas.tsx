import { ATLAS_COPY } from '@views/walk/config/map';
import { DIALOG } from '@views/walk/config/walk';
import { journeyLine } from '@views/walk/lib/journey';
import { useModal } from '@views/walk/model/hooks/useModal';
import { useWalkContext } from '@views/walk/model/hooks/useWalkContext';
import { AtlasGuides } from '@views/walk/ui/AtlasGuides';
import { DialogHeading } from '@views/walk/ui/DialogHeading';
import { DiscoveryList } from '@views/walk/ui/DiscoveryList';
import { Icon } from '@views/walk/ui/Icon';
import { useId } from 'react';

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
      <DialogHeading
        eyebrow={copy.eyebrow}
        title={copy.title}
        titleId={titleId}
        closeLabel={copy.closeLabel}
        onClose={onClose}
      />
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
