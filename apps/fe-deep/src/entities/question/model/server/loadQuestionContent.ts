import {
  parseCategories,
  parseQuestionFile,
  type CategoryEntry,
} from '@entities/question/model/server/parseQuestionContent';
import type { Question, QuestionContent } from '@entities/question/model/types/types';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { cache } from 'react';

const QUESTIONS_DIR = path.join(process.cwd(), 'content', 'questions');
const CATEGORIES_FILE = 'categories.yml';
const QUESTION_FILE = /^(\d+)\.md$/;
const MARKDOWN_EXTENSION = '.md';

function assertUnique(values: string[], label: string): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) throw new Error(`content/questions: ${label} '${value}'가 중복된다.`);
    seen.add(value);
  }
}

async function assertNoUnknownDirectories(categories: CategoryEntry[]): Promise<void> {
  const slugs = new Set(categories.map((category) => category.slug));
  const entries = await readdir(QUESTIONS_DIR, { withFileTypes: true });
  const unknown = entries.filter((entry) => entry.isDirectory() && !slugs.has(entry.name));
  if (unknown.length > 0) {
    throw new Error(`content/questions: ${CATEGORIES_FILE}에 없는 폴더 ${unknown.map((e) => e.name).join(', ')}`);
  }
}

async function readCategoryQuestions(category: CategoryEntry): Promise<Question[]> {
  const files = (await readdir(path.join(QUESTIONS_DIR, category.slug))).filter((file) =>
    file.endsWith(MARKDOWN_EXTENSION),
  );
  const ordered = files
    .map((file) => {
      const order = QUESTION_FILE.exec(file)?.[1];
      if (!order) throw new Error(`${category.slug}/${file}: 파일 이름은 순서 번호여야 한다(예: 001.md).`);
      return { file, orderNum: Number(order) };
    })
    .sort((a, b) => a.orderNum - b.orderNum);

  return Promise.all(
    ordered.map(async ({ file, orderNum }) =>
      parseQuestionFile(await readFile(path.join(QUESTIONS_DIR, category.slug, file), 'utf8'), {
        source: `${category.slug}/${file}`,
        categoryId: category.id,
        orderNum,
      }),
    ),
  );
}

export const loadQuestionContent = cache(async (): Promise<QuestionContent> => {
  const entries = parseCategories(await readFile(path.join(QUESTIONS_DIR, CATEGORIES_FILE), 'utf8'), CATEGORIES_FILE);
  assertUnique(
    entries.map((entry) => entry.id),
    '카테고리 id',
  );
  assertUnique(
    entries.map((entry) => entry.slug),
    '카테고리 slug',
  );
  await assertNoUnknownDirectories(entries);

  const questionsByCategory = await Promise.all(entries.map(readCategoryQuestions));
  const questions = questionsByCategory.flat();
  assertUnique(
    questions.map((question) => question.id),
    '질문 id',
  );

  const categories = entries.map((entry, index) => ({
    ...entry,
    order_num: index + 1,
    question_count: questionsByCategory[index]?.length ?? 0,
  }));
  return { categories, questions };
});
