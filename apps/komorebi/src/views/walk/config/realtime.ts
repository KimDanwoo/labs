function parseRealtimeUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  const url = new URL(raw);
  const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  if (
    (url.protocol !== 'wss:' && !(isLocal && url.protocol === 'ws:')) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== '/'
  )
    throw new Error('NEXT_PUBLIC_REALTIME_URL must be a secure WebSocket origin');
  return url.origin;
}

export const REALTIME_URL = parseRealtimeUrl(process.env.NEXT_PUBLIC_REALTIME_URL);
