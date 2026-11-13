import { clearHistoryAtom, libraryAtom, storageNoticeAtom } from '@entities/track';
import { Button } from '@ui/react';
import { useAtomValue, useSetAtom } from 'jotai';
import type { JSX } from 'react';

export function ListeningHistory(): JSX.Element {
  const library = useAtomValue(libraryAtom);
  const notice = useAtomValue(storageNoticeAtom);
  const clear = useSetAtom(clearHistoryAtom);
  return (
    <details className="border-t border-hairline px-md py-sm text-xs leading-relaxed text-dim">
      <summary className="cursor-pointer py-sm">감상 기록</summary>
      <p>
        이 기기에서 {Math.floor(library.listenedMs / 60_000)}분 감상 · 세트 {Math.floor(library.collectionMs / 60_000)}
        분
      </p>
      <div className="flex items-center justify-between gap-sm">
        <span>이 브라우저에 저장됩니다.</span>
        <Button type="button" variant="ghost" size="sm" onClick={() => clear()} disabled={!library.recent.length}>
          기록 지우기
        </Button>
      </div>
      {notice ? <p role="status">{notice}</p> : null}
    </details>
  );
}
