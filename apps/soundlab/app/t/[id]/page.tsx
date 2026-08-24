import { TRACKS } from '@entities/track/model/constants';
import { PlayerView } from '@views/player/PlayerView';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

type Params = { id: string };

// 곡 전부를 빌드 타임에 만든다. 런타임 렌더가 없어 공유 링크가 즉시 뜬다.
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
    // 이미지는 같은 폴더의 opengraph-image.tsx가 채운다.
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
