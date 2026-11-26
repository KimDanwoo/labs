import type { Metadata } from 'next';

import { GAMES, SITE_NAME, type GameId } from '@entities/game-catalog';

export function gameMetadata(id: GameId): Metadata {
  const { href, name, title, description } = GAMES[id];
  const image = { url: `${href}/opengraph-image.png`, width: 1200, height: 630, alt: `${name} 플레이 화면` };

  return {
    title,
    description,
    alternates: { canonical: href },
    openGraph: {
      title,
      description,
      url: href,
      siteName: SITE_NAME,
      locale: 'ko_KR',
      type: 'website',
      images: [image],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  };
}
