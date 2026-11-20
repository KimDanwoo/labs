import type { LANDMARKS } from '@views/ride/model/exploration/world';

interface JournalPlaceProps {
  place: (typeof LANDMARKS)[number];
  isDiscovered: boolean;
}

export function JournalPlace({ place, isDiscovered }: JournalPlaceProps) {
  if (!isDiscovered) return <span className="opacity-60">아직 발견하지 않은 장소</span>;
  return (
    <>
      <span>{place.name}</span>
      <p className="mt-1 text-xs opacity-70">{place.description}</p>
    </>
  );
}
