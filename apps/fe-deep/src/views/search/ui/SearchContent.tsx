'use client';

import { Search } from './search/search';

export function SearchContent() {
  return (
    <Search.Root>
      <Search.Field />
      <Search.Summary />
      <Search.Results />
      <Search.NoResults />
      <Search.Prompt />
    </Search.Root>
  );
}
