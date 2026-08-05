import type { APIContext } from 'astro';

// sitemap 주소를 하드코딩하면 배포 도메인이 바뀔 때 어긋난다 — astro.config의 site에서 파생시킨다
export function GET({ site }: APIContext) {
  const body = `User-agent: *
Allow: /

Sitemap: ${new URL('sitemap-index.xml', site!).href}
`;

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
