import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env.local', 'utf-8');
for (const line of envContent.split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i > 0) process.env[t.slice(0, i)] = t.slice(i + 1);
}

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const { data: cats } = await sb.from('categories').select('id, title, slug').order('order_num');
for (const cat of cats) {
  const { data: qs } = await sb.from('questions')
    .select('id, question, answer, difficulty, sub_category, order_num, tags')
    .eq('category_id', cat.id)
    .order('order_num');

  let out = `\n${'='.repeat(60)}\n${cat.title} (${qs.length}개)\n${'='.repeat(60)}\n`;
  for (const q of qs) {
    out += `\n--- ${q.id} | ${q.difficulty} | ${q.sub_category} ---\n`;
    out += `Q: ${q.question}\n`;
    out += `A:\n${q.answer}\n`;
    out += `tags: ${q.tags?.join(', ') || 'none'}\n`;
  }
  console.log(out);
}
