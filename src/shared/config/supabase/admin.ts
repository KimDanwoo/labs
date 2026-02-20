import { createClient } from '@supabase/supabase-js';

/**
 * service_role 키를 사용하는 서버 전용 Supabase 클라이언트를 생성한다.
 * RLS를 우회하여 INSERT/UPDATE/DELETE가 가능하다.
 * 서버 컴포넌트와 Server Action에서만 사용해야 한다.
 */
export function createAdminSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Supabase URL 또는 service_role 키가 설정되지 않았습니다.');
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
