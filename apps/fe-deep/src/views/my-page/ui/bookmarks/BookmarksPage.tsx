'use client';

import { Bookmarks } from './bookmarks';

export function BookmarksPage() {
  return (
    <Bookmarks.Root>
      <Bookmarks.Intro />
      <Bookmarks.List />
      <Bookmarks.Empty />
    </Bookmarks.Root>
  );
}
