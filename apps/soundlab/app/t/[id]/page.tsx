import { TRACKS } from '@entities/track';
import { PlayerView } from '@views/player';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

type Params = { id: string };

export function generateStaticParams(): Params[] {
  return TRACKS.map((track) => ({ id: String(track.id) }));
}

const findTrack = (id: string) => TRACKS.find((track) => String(track.id) === id);

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const track = findTrack(id);
  if (!track) return {};

  const title = `${track.title} — DANWOO`;
  const description = `${track.genre} · soundlab에서 듣기`;
  return {
    title,
    description,
    openGraph: { type: 'music.song', locale: 'ko_KR', siteName: 'soundlab', title, description },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function TrackPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const track = findTrack(id);
  if (!track) notFound();

  return <PlayerView initialTrackId={track.id} />;
}
