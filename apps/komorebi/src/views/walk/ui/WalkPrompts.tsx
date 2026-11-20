import type { JSX } from 'react';
import { useWalkContext } from '../model/hooks/useWalkContext';
import { PlacePrompts } from './PlacePrompts';
import { RoomPrompts } from './RoomPrompts';
import { SpotPrompts } from './SpotPrompts';

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
