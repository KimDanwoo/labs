import { createClient } from '@supabase/supabase-js';

/**
 * RLS 를 우회하는 service_role 클라이언트. 절대 클라이언트 번들에 import 하지 말 것.
 * (서버 라우트/서버 컴포넌트 전용)
 */
export function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 필요합니다.',
    );
  }
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

/** profiles.is_admin 확인 (service_role 로 RLS 우회). */
export async function isAdminUser(userId: string): Promise<boolean> {
  const { data, error } = await getAdminSupabase()
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single();
  if (error) return false;
  return data?.is_admin === true;
}

/**
 * 관리자 쓰기 API 가드. Authorization: Bearer <access_token> 를 검증하고
 * is_admin 인 유저만 통과시킨다. 실패 시 null.
 */
export async function requireAdmin(
  req: Request,
): Promise<{ userId: string } | null> {
  const header = req.headers.get('authorization') ?? '';
  const token = header.toLowerCase().startsWith('bearer ')
    ? header.slice(7).trim()
    : null;
  if (!token) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  const anon = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await anon.auth.getUser(token);
  if (error || !data.user) return null;
  if (!(await isAdminUser(data.user.id))) return null;

  return { userId: data.user.id };
}
