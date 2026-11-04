import { GROUPS, NEW_CATEGORIES, buildBookQuestionRows } from './lib/bookQuestions.mjs';
import { createSeedClient } from './lib/seedClient.mjs';

async function main() {
  const rows = buildBookQuestionRows();
  if (process.argv.includes('--dry-run')) {
    console.log(
      JSON.stringify(
        {
          categories: NEW_CATEGORIES.map((category) => category.slug),
          questions: rows.length,
          groups: GROUPS.map((group) => ({ categoryId: group.categoryId, questions: group.items.length })),
        },
        null,
        2,
      ),
    );
    return;
  }
  const sbAdmin = createSeedClient();
  console.log('🚀 책 목차 기반 신규 질문 시드 시작...\n');

  const { error: catErr } = await sbAdmin.from('categories').upsert(NEW_CATEGORIES, { onConflict: 'id' });
  if (catErr) {
    console.error('❌ 카테고리 생성 실패:', catErr.message);
    process.exit(1);
  }
  console.log(`✅ 신규 카테고리 ${NEW_CATEGORIES.length}개 반영: ${NEW_CATEGORIES.map((c) => c.title).join(', ')}\n`);

  const ids = rows.map((row) => row.id);

  const { error: qErr } = await sbAdmin.from('questions').upsert(rows, { onConflict: 'id' });
  if (qErr) {
    console.error('❌ 질문 삽입 실패:', qErr.message);
    process.exit(1);
  }

  for (const { categoryId, items } of GROUPS) {
    console.log(`  ${categoryId.padEnd(8)} +${items.length}개`);
  }
  console.log(`\n✅ 총 ${rows.length}개 질문 upsert 완료 (${ids[0]} ~ ${ids[ids.length - 1]})`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
