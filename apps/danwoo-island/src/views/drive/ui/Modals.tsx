import { BlogModal } from './BlogModal';
import { CircuitEndModal } from './CircuitEndModal';
import { JukeboxModal } from './JukeboxModal';
import { MapModal } from './MapModal';

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
