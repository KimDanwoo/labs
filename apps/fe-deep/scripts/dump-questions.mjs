import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load .env.local
const envContent = readFileSync('.env.local', 'utf-8');
for (const line of envContent.split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i > 0) process.env[t.slice(0, i)] = t.slice(i + 1);
}

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const { data: cats } = await sb.from('categories').select('id, slug, title, order_num').order('order_num');
console.log('=== CATEGORIES ===');
cats.forEach(c => console.log(`${c.id} | ${c.slug} | ${c.title}`));

console.log('\n=== QUESTIONS BY CATEGORY ===');
for (const c of cats) {
  const { data: qs } = await sb.from('questions')
    .select('id, question, difficulty, sub_category, order_num')
    .eq('category_id', c.id)
    .order('order_num');
  console.log(`\n--- ${c.title} (${c.slug}) : ${qs.length}개 ---`);
  qs.forEach(q => console.log(`  ${q.id} | ${q.difficulty} | ${q.sub_category || '-'} | ${q.question}`));
}
