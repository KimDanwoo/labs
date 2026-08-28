/**
 * 카테고리별 꼬리질문 시드.
 *   node scripts/seed-follow-ups.mjs javascript          # dry-run: 매칭 결과만 출력
 *   node scripts/seed-follow-ups.mjs javascript --apply  # 실제 반영
 *
 * supabase/seed/follow-ups/<category>.json 의 키(질문 원문)로 questions 행을 찾아 follow_ups를 채운다.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const [category, ...flags] = process.argv.slice(2);
const isApply = flags.includes('--apply');

if (!category) {
  console.error('사용법: node scripts/seed-follow-ups.mjs <category-slug> [--apply]');
  process.exit(1);
}

const env = Object.fromEntries(
  readFileSync(join(appRoot, '.env.local'), 'utf8')
    .split('\n')
    .filter((line) => line.includes('=') && !line.trim().startsWith('#'))
    .map((line) => {
      const index = line.indexOf('=');
      return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
    }),
);

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('.env.local에 NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY가 필요합니다.');
  process.exit(1);
}

async function rest(path, init = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
  if (!response.ok) throw new Error(`${response.status} ${await response.text()}`);
  return response.status === 204 ? null : response.json();
}

const seed = JSON.parse(readFileSync(join(appRoot, 'supabase/seed/follow-ups', `${category}.json`), 'utf8'));

const [categoryRow] = await rest(`categories?select=id,title&slug=eq.${category}`);
if (!categoryRow) {
  console.error(`카테고리를 찾을 수 없습니다: ${category}`);
  process.exit(1);
}

const questions = await rest(`questions?select=id,question&category_id=eq.${categoryRow.id}&order=order_num`);
const byQuestion = new Map(questions.map((row) => [row.question, row]));

const matched = [];
const missing = [];
for (const [question, followUps] of Object.entries(seed)) {
  const row = byQuestion.get(question);
  if (row) matched.push({ row, followUps });
  else missing.push(question);
}

console.log(`카테고리: ${categoryRow.title} (DB ${questions.length}문항 / 시드 ${Object.keys(seed).length}개)`);
console.log(`매칭: ${matched.length} · 미매칭: ${missing.length}`);
if (missing.length > 0) {
  console.log('\n[시드에 있으나 DB에 없는 질문]');
  missing.forEach((q) => console.log(`  - ${q}`));
}

const noSeed = questions.filter((row) => !(row.question in seed));
if (noSeed.length > 0) {
  console.log('\n[DB에 있으나 시드가 없는 질문]');
  noSeed.forEach((row) => console.log(`  - ${row.question}`));
}

if (!isApply) {
  console.log('\ndry-run입니다. 실제 반영하려면 --apply 를 붙이세요.');
  process.exit(0);
}

let updated = 0;
for (const { row, followUps } of matched) {
  await rest(`questions?id=eq.${row.id}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ follow_ups: followUps }),
  });
  updated += 1;
}
console.log(`\n${updated}개 문항에 꼬리질문을 반영했습니다.`);
