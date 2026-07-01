import { supabase } from '@shared/lib';

/** 게임 세션의 access token 을 실어 관리자 API 를 호출한다. */
export async function adminFetch(input: string, init?: RequestInit) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = new Headers(init?.headers);
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  }
  if (init?.body) headers.set('Content-Type', 'application/json');

  return fetch(input, { ...init, headers });
}
