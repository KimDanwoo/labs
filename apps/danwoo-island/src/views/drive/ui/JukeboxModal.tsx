import { PanelHeader } from '@views/drive/ui/PanelHeader';

export function JukeboxModal() {
  return (
    <div className="js-modal modal jukebox" data-name="jukebox">
      <div className="panel-card">
        <PanelHeader title="쥬크박스" badge="MUSIC" />
        <section className="js-jukebox-now jukebox-now" aria-live="polite" />
        <ul className="js-jukebox-tracks jukebox-tracks" />
      </div>
    </div>
  );
}
