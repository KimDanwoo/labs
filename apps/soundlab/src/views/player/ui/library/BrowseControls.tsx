import { Button, Input } from '@ui/react';
import { useAtom, useSetAtom } from 'jotai';
import type { JSX } from 'react';
import { FILTER_LABELS, LIBRARY_FILTER, collectionFilterAtom, libraryFilterAtom, searchAtom } from '../../model/browse';

export function BrowseControls(): JSX.Element {
  const [query, setQuery] = useAtom(searchAtom);
  const [filter, setFilter] = useAtom(libraryFilterAtom);
  const setCollection = useSetAtom(collectionFilterAtom);
  return (
    <div className="flex flex-col gap-sm">
      <Input
        type="search"
        aria-label="곡 제목 또는 장르 검색"
        placeholder="제목 또는 장르 검색"
        maxLength={120}
        value={query}
        onChange={(event) => setQuery(event.currentTarget.value)}
        className="rounded-none border-0 border-b border-hairline bg-transparent px-0 text-paper shadow-none"
      />
      <div className="flex flex-wrap gap-xs" aria-label="라이브러리 필터">
        {Object.values(LIBRARY_FILTER).map((value) => (
          <Button
            key={value}
            type="button"
            variant="ghost"
            size="sm"
            aria-pressed={filter === value}
            className="rounded-none text-mute aria-pressed:text-paper aria-pressed:underline aria-pressed:underline-offset-8"
            onClick={() => {
              setFilter(value);
              setCollection(null);
            }}
          >
            {FILTER_LABELS[value]}
          </Button>
        ))}
      </div>
    </div>
  );
}
