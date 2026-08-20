import { PLAYER_SCREEN } from '@entities/track/model/constants/playerScreen';
import { TRACKS } from '@entities/track/model/constants/tracks';
import { PlayerView } from '@views/player/PlayerView';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

type Params = { id: string };

// 곡 화면과 같은 25개를 빌드 타임에 만든다. 앱 안에서는 pushState로 오지만,
// 공유 링크·새로고침·직접 진입은 이 라우트로 들어온다.
export function generateStaticParams(): Params[] {
  return TRACKS.map((track) => ({ id: String(track.id) }));
}

const findTrack = (id: string) => TRACKS.find((track) => String(track.id) === id);

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const track = findTrack(id);
  if (!track) return {};

  const title = `${track.title} — DANWOO`;
  const description = `${track.genre} · soundlab 재생목록`;
  // 부모 세그먼트의 opengraph-image.tsx를 명시적으로 가리킨다 — 파일 규약은 이 하위 라우트까지 안 내려온다.
  const images = [`/t/${track.id}/opengraph-image`];
  return {
    title,
    description,
    openGraph: { type: 'music.song', locale: 'ko_KR', siteName: 'soundlab', title, description, images },
    twitter: { card: 'summary_large_image', title, description, images },
  };
}

export default async function QueuePage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const track = findTrack(id);
  if (!track) notFound();

  return <PlayerView initialTrackId={track.id} initialScreen={PLAYER_SCREEN.queue} />;
}
