import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env.local', 'utf-8');
for (const line of envContent.split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i > 0) process.env[t.slice(0, i)] = t.slice(i + 1);
}

const sbAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const isDryRun = process.argv.includes('--dry-run');

// q-77 → 77. 숫자가 아닌 id(UUID)는 뒤로 밀되 id 문자열 순으로 안정 정렬한다.
function idRank(id) {
  const n = Number(id.replace(/^q-/, ''));
  return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER;
}

// 현재 화면 순서(order_num → id)를 그대로 유지한 채 1..N으로 다시 매긴다.
function compare(a, b) {
  if (a.order_num !== b.order_num) return a.order_num - b.order_num;
  const ra = idRank(a.id);
  const rb = idRank(b.id);
  if (ra !== rb) return ra - rb;
  return a.id.localeCompare(b.id);
}

async function main() {
  console.log(`🔢 order_num 정규화${isDryRun ? ' (dry-run)' : ''}...\n`);

  const { data: questions, error } = await sbAdmin.from('questions').select('id, category_id, order_num, question');
  if (error) {
    console.error('❌ 조회 실패:', error.message);
    process.exit(1);
  }

  const byCategory = new Map();
  for (const q of questions) {
    if (!byCategory.has(q.category_id)) byCategory.set(q.category_id, []);
    byCategory.get(q.category_id).push(q);
  }

  const updates = [];
  for (const [categoryId, items] of [...byCategory].sort(([a], [b]) => a.localeCompare(b))) {
    items.sort(compare);

    const before = items.map((q) => q.order_num);
    const duplicates = before.length - new Set(before).size;
    const changed = items.filter((q, i) => q.order_num !== i + 1);

    console.log(
      `${categoryId.padEnd(16)} ${String(items.length).padStart(3)}개  중복 ${String(duplicates).padStart(2)}  변경 ${String(changed.length).padStart(3)}`,
    );

    items.forEach((q, i) => {
      if (q.order_num !== i + 1) updates.push({ id: q.id, order_num: i + 1 });
    });
  }

  if (updates.length === 0) {
    console.log('\n✅ 이미 정규화되어 있습니다. 변경 없음');
    return;
  }

  if (isDryRun) {
    console.log(`\n📋 ${updates.length}건이 변경될 예정입니다 (dry-run이므로 쓰지 않음)`);
    return;
  }

  // upsert는 NOT NULL 컬럼을 요구하므로 개별 update로 처리한다.
  let done = 0;
  for (const { id, order_num } of updates) {
    const { error: upErr } = await sbAdmin.from('questions').update({ order_num }).eq('id', id);
    if (upErr) {
      console.error(`❌ ${id} 실패:`, upErr.message);
      process.exit(1);
    }
    done++;
  }

  console.log(`\n✅ ${done}건 갱신 완료`);
}

main().catch(console.error);
