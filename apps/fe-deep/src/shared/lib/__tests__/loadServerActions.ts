import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

type ServerAction = (...args: unknown[]) => Promise<unknown>;
type ModuleMocks = Record<string, Record<string, unknown>>;

/** Next 요청 컨텍스트 대신 의존성을 주입해 실제 Server Action의 권한 검사 순서를 검증한다. */
export function loadServerActions(file: URL, overrides: ModuleMocks = {}) {
  const source = readFileSync(file, 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exported: Record<string, ServerAction> = {};
  let privilegedClients = 0;
  const mocks: ModuleMocks = {
    '@shared/lib/requireAdmin': {
      requireAdmin: async () => {
        throw new Error('관리자 권한이 필요합니다.');
      },
    },
    '@shared/api/supabaseAdmin': {
      createAdminSupabaseClient: () => {
        privilegedClients++;
        assert.fail('권한 검사 전에 관리자 DB에 접근했습니다.');
      },
    },
    '@shared/api/supabaseServer': {
      createServerSupabaseClient: async () => ({
        auth: { getUser: async () => ({ data: { user: { id: 'ordinary-user' } } }) },
      }),
    },
  };
  const require = createRequire(import.meta.url);
  runInNewContext(compiled, {
    exports: exported,
    require: (name: string): unknown => overrides[name] ?? mocks[name] ?? require(name),
  });
  return { exported, clientCount: () => privilegedClients };
}
