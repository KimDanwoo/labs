import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

const ENV_FILE = new URL('../../.env.local', import.meta.url);

function createCliClient(keyName, purpose) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env[keyName];
  if (!url || !key) throw new Error(`${purpose}에 필요한 Supabase URL 또는 ${keyName}가 없습니다.`);
  return createClient(url, key, { auth: { persistSession: false } });
}

/** .env.local이 셸에 export된 값을 덮어쓴다 — 셸에 남은 다른 프로젝트의 값으로 엉뚱한 DB에 닿지 않게. */
function preferLocalEnv() {
  if (existsSync(ENV_FILE)) Object.assign(process.env, parseEnv(readFileSync(ENV_FILE, 'utf8')));
}

/**
 * 시드용 쓰기(service_role) 클라이언트. CLI 실행 시에만 로컬 환경을 읽는다 — 데이터 모듈을 import하는 테스트에서는
 * 호출하지 않는다. 셸에 export된 값이 있으면 그 값이 .env.local보다 우선한다.
 */
export function createSeedClient() {
  if (existsSync(ENV_FILE)) process.loadEnvFile(ENV_FILE);
  return createCliClient('SUPABASE_SERVICE_ROLE_KEY', '시드 실행');
}

export function createLocalAdminClient() {
  preferLocalEnv();
  return createCliClient('SUPABASE_SERVICE_ROLE_KEY', '정리 실행');
}

export function createReadClient() {
  preferLocalEnv();
  return createCliClient('NEXT_PUBLIC_SUPABASE_ANON_KEY', '조회');
}
