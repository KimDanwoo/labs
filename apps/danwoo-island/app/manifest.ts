import type { MetadataRoute } from 'next';

const ICON_SIZES = [192, 512] as const;

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Danwoo Island',
    short_name: 'Danwoo Island',
    icons: ICON_SIZES.map((size) => ({
      src: `/world/favicons/web-app-manifest-${size}x${size}.png`,
      sizes: `${size}x${size}`,
      type: 'image/png',
      purpose: 'maskable',
    })),
    theme_color: '#ffffff',
    background_color: '#ffffff',
    display: 'standalone',
  };
}
