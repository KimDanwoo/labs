'use client';

import { ScrollArea } from '@shared/ui/ScrollArea';
import { PLAYLIST_ID } from '@views/player/config/layout';
import { useScrollCurrentIntoView } from '@views/player/model/hooks/useScrollCurrentIntoView';
import { currentIndexAtom } from '@views/player/model/store/playback';
import { BrowseControls } from '@views/player/ui/library/BrowseControls';
import { ListeningHistory } from '@views/player/ui/library/ListeningHistory';
import { PlaylistCollections } from '@views/player/ui/playlist/PlaylistCollections';
import { PlaylistHeader } from '@views/player/ui/playlist/PlaylistHeader';
import { PlaylistSummary } from '@views/player/ui/playlist/PlaylistSummary';
import { PlaylistTracks } from '@views/player/ui/playlist/PlaylistTracks';
import { QueueStatus } from '@views/player/ui/playlist/QueueStatus';
import { useAtomValue } from 'jotai';

export function Playlist() {
  const index = useAtomValue(currentIndexAtom);
  const listRef = useScrollCurrentIntoView(index);
  return (
    <aside
      id={PLAYLIST_ID}
      aria-label="음악 라이브러리"
      className="absolute inset-x-0 top-0 bottom-0 z-20 order-2 row-start-2 row-end-3 flex min-h-0 flex-col border-hairline bg-void player:static player:order-1 player:row-auto player:border-r"
    >
      <PlaylistHeader />
      <ScrollArea ref={listRef} className="min-h-0 flex-1">
        <div className="space-y-md p-md">
          <PlaylistCollections />
          <BrowseControls />
          <QueueStatus />
          <PlaylistSummary />
        </div>
        <PlaylistTracks />
        <ListeningHistory />
      </ScrollArea>
    </aside>
  );
}
