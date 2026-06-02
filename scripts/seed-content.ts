/**
 * 콘텐츠 시드: 코드 상수를 단일 소스로 DB에 upsert.
 *
 * 실행:
 *   pnpm seed:content
 *   (env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
 *
 * .env.local 이 있으면 자동으로 읽는다. service_role 키는 절대 클라이언트
 * 번들에 들어가지 않도록 이 스크립트(서버/로컬)에서만 사용한다.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { ALL_CHARACTER_IDS, CHARACTERS } from '../src/shared/constants/game';
import { SCENES_BY_CHARACTER } from '../src/features/meeting/model/constants/scenes';

function loadEnvLocal(): void {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // .env.local 없으면 process.env 그대로 사용
  }
}

async function main() {
  loadEnvLocal();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL 와 SUPABASE_SERVICE_ROLE_KEY 가 필요합니다.',
    );
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  const characterRows = ALL_CHARACTER_IDS.map((id, index) => {
    const c = CHARACTERS[id];
    return {
      id: c.id,
      name: c.name,
      color: c.color,
      bg_color: c.bgColor,
      border_color: c.borderColor,
      emoji: c.emoji,
      sort_order: index,
      is_active: true,
    };
  });

  const sceneRows = ALL_CHARACTER_IDS.flatMap((characterId) =>
    (SCENES_BY_CHARACTER[characterId] ?? []).map((scene, index) => ({
      id: scene.id,
      character_id: characterId,
      category: scene.category,
      prompt: scene.prompt,
      options: scene.options,
      sort_order: index,
      is_active: true,
    })),
  );

  const { error: charErr } = await supabase
    .from('characters')
    .upsert(characterRows, { onConflict: 'id' });
  if (charErr) throw charErr;
  console.log(`✓ characters upsert: ${characterRows.length}`);

  const { error: sceneErr } = await supabase
    .from('meeting_scenes')
    .upsert(sceneRows, { onConflict: 'id' });
  if (sceneErr) throw sceneErr;
  console.log(`✓ meeting_scenes upsert: ${sceneRows.length}`);

  console.log('완료.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
