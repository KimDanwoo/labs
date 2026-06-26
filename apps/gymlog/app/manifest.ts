import type { MetadataRoute } from 'next';

// 홈 화면 추가 시 standalone 앱으로 실행되도록 하는 PWA manifest.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'gymlog — 운동 동행',
    short_name: 'gymlog',
    description: '헬스장에서 폰 하나로 루틴을 따라가고 기록하는 운동 동행 앱',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0a0a0f',
    theme_color: '#0a0a0f',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
