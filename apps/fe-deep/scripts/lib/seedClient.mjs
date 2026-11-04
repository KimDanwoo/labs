import { createClient } from '@supabase/supabase-js';
import { existsSync } from 'node:fs';

/** CLI 실행 시에만 로컬 환경을 읽는다. 데이터 모듈을 import하는 테스트에서는 호출하지 않는다. */
export function createSeedClient() {
  const env = new URL('../../.env.local', import.meta.url);
  if (existsSync(env)) process.loadEnvFile(env);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('시드 실행에 필요한 Supabase URL 또는 service_role 키가 없습니다.');
  return createClient(url, key, { auth: { persistSession: false } });
}
