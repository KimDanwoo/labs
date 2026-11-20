import { BlogModal } from '@views/drive/ui/BlogModal';
import { CircuitEndModal } from '@views/drive/ui/CircuitEndModal';
import { JukeboxModal } from '@views/drive/ui/JukeboxModal';
import { MapModal } from '@views/drive/ui/MapModal';

export function Modals() {
  return (
    <div className="js-modals modals">
      <CircuitEndModal />
      <JukeboxModal />
      <BlogModal />
      <MapModal />
    </div>
  );
}
