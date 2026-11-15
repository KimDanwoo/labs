import { fetchLatestPosts } from '@entities/blog';

const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600' };

export async function GET(): Promise<Response> {
  try {
    return Response.json({ posts: await fetchLatestPosts() }, { headers: CACHE_HEADERS });
  } catch {
    return Response.json({ posts: [] }, { status: 503 });
  }
}
