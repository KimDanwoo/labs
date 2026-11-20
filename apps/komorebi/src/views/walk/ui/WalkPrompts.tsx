import { useWalkContext } from '@views/walk/model/hooks/useWalkContext';
import { PlacePrompts } from '@views/walk/ui/PlacePrompts';
import { RoomPrompts } from '@views/walk/ui/RoomPrompts';
import { SpotPrompts } from '@views/walk/ui/SpotPrompts';
import type { JSX } from 'react';

export function WalkPrompts(): JSX.Element | null {
  const { isPaused } = useWalkContext();
  if (isPaused) return null;
  return (
    <>
      <RoomPrompts />
      <PlacePrompts />
      <SpotPrompts />
    </>
  );
}
