'use client';

import { Bookmarks } from '@views/my-page/ui/bookmarks/bookmarks';

export function BookmarksPage() {
  return (
    <Bookmarks.Root>
      <Bookmarks.Intro />
      <Bookmarks.List />
      <Bookmarks.Empty />
    </Bookmarks.Root>
  );
}
