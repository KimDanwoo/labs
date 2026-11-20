'use client';

import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@shared/ui/DropdownMenu';
import { DropdownMenuItem } from '@shared/ui/DropdownMenuItems';
import { FloatingButton } from '@shared/ui/FloatingButton';

import { SHARE_KIND } from '@views/player/config/share';
import { useShareTrack } from '@views/player/model/hooks/useShareTrack';
import { LinkIcon } from '@views/player/ui/transport/LinkIcon';
import { ShareNotice } from '@views/player/ui/transport/ShareNotice';

export function ShareButton() {
  const { notice, fallbackUrl, share, clearFallback } = useShareTrack();

  const hasNotice = notice || fallbackUrl;
  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <FloatingButton aria-label="곡 공유" title="곡 공유" className="bg-void/80 text-dim hover:text-paper">
            <LinkIcon />
          </FloatingButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="border-hairline bg-void text-paper">
          <DropdownMenuItem onSelect={() => void share(SHARE_KIND.song)}>곡 링크 복사</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => void share(SHARE_KIND.moment)}>현재 위치 링크 복사</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => void share(SHARE_KIND.native)}>다른 앱으로 공유</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {hasNotice ? <ShareNotice notice={notice} fallbackUrl={fallbackUrl} onClose={clearFallback} /> : null}
    </div>
  );
}
