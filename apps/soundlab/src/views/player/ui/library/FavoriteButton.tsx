import { libraryAtom, toggleFavoriteAtom } from '@entities/track';
import { Button } from '@ui/react';
import { useAtomValue, useSetAtom } from 'jotai';
import type { JSX } from 'react';
import { HeartIcon } from './HeartIcon';

type Props = { trackId: number; title: string };
export function FavoriteButton({ trackId, title }: Props): JSX.Element {
  const library = useAtomValue(libraryAtom);
  const toggle = useSetAtom(toggleFavoriteAtom);
  const isFavorite = library.favorites.includes(trackId);
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="text-dim aria-pressed:text-brass aria-pressed:[&_svg]:fill-brass/20"
      aria-pressed={isFavorite}
      aria-label={`${title} 즐겨찾기 ${isFavorite ? '해제' : '추가'}`}
      onClick={() => toggle(trackId)}
    >
      <HeartIcon />
    </Button>
  );
}
