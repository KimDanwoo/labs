/**
 * 카테고리별 질문 덤프.
 *   node scripts/dump-questions.mjs                        # 질문 목록(한 줄 요약)
 *   node scripts/dump-questions.mjs --full                 # 답변·태그까지
 *   node scripts/dump-questions.mjs --full react css       # 지정한 카테고리 slug만
 */
import { createReadClient } from './lib/seedClient.mjs';

const FULL_FLAG = '--full';
const RULE = '='.repeat(60);

const args = process.argv.slice(2);
const isFull = args.includes(FULL_FLAG);
const slugs = args.filter((arg) => arg !== FULL_FLAG);

const sb = createReadClient();

const summaryLine = (q) => `  ${q.id} | ${q.difficulty} | ${q.sub_category || '-'} | ${q.question}`;

const fullBlock = (q) =>
  [
    `\n--- ${q.id} | ${q.difficulty} | ${q.sub_category} ---`,
    `Q: ${q.question}`,
    `A:\n${q.answer}`,
    `tags: ${q.tags?.join(', ') || 'none'}`,
  ].join('\n');

let categoryQuery = sb.from('categories').select('id, slug, title').order('order_num');
if (slugs.length > 0) categoryQuery = categoryQuery.in('slug', slugs);
const { data: categories, error: categoryError } = await categoryQuery;
if (categoryError) throw categoryError;

for (const category of categories) {
  const { data: questions, error } = await sb
    .from('questions')
    .select('id, question, answer, difficulty, sub_category, order_num, tags')
    .eq('category_id', category.id)
    .order('order_num');
  if (error) throw error;

  console.log(`\n${RULE}\n${category.title} (${category.slug}) : ${questions.length}개\n${RULE}`);
  console.log(questions.map(isFull ? fullBlock : summaryLine).join('\n'));
}
