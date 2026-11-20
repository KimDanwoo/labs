import { DIFFICULTY_VALUES } from '@entities/question/model/constants/constants';
import type { Category, Difficulty, FollowUp, Question } from '@entities/question/model/types/types';
import { parse } from 'yaml';

type UnknownRecord = Record<string, unknown>;
export type CategoryEntry = Omit<Category, 'order_num' | 'question_count'>;

interface QuestionFileMeta {
  source: string;
  categoryId: string;
  orderNum: number;
}

const FRONTMATTER = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;

function fail(source: string, message: string): never {
  throw new Error(`${source}: ${message}`);
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(record: UnknownRecord, key: string, source: string): string {
  const value = record[key];
  if (typeof value !== 'string' || !value.trim()) fail(source, `${key}는 비어 있지 않은 문자열이어야 한다.`);
  return value;
}

function readBoolean(record: UnknownRecord, key: string, source: string): boolean {
  const value = record[key];
  if (typeof value !== 'boolean') fail(source, `${key}는 true 또는 false여야 한다.`);
  return value;
}

function readStringList(record: UnknownRecord, key: string, source: string): string[] {
  const value = record[key];
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
    fail(source, `${key}는 문자열 목록이어야 한다.`);
  }
  return value;
}

function readDifficulty(record: UnknownRecord, source: string): Difficulty {
  const value = record.difficulty;
  const difficulty = DIFFICULTY_VALUES.find((candidate) => candidate === value);
  if (!difficulty) fail(source, `difficulty는 ${DIFFICULTY_VALUES.join(', ')} 중 하나여야 한다.`);
  return difficulty;
}

function readFollowUps(record: UnknownRecord, source: string): FollowUp[] {
  const value = record.follow_ups;
  if (value === undefined) return [];
  if (!Array.isArray(value)) fail(source, 'follow_ups는 목록이어야 한다.');
  return value.map((item, index) => {
    const itemSource = `${source} follow_ups[${index}]`;
    if (!isRecord(item)) fail(itemSource, '항목은 question·keywords·answer를 가진 객체여야 한다.');
    return {
      question: readString(item, 'question', itemSource),
      keywords: readStringList(item, 'keywords', itemSource),
      answer: readString(item, 'answer', itemSource),
    };
  });
}

export function parseCategories(raw: string, source: string): CategoryEntry[] {
  const value: unknown = parse(raw);
  if (!Array.isArray(value)) fail(source, '카테고리 목록이어야 한다.');
  return value.map((item, index) => {
    const itemSource = `${source}[${index}]`;
    if (!isRecord(item)) fail(itemSource, '카테고리는 객체여야 한다.');
    return {
      id: readString(item, 'id', itemSource),
      slug: readString(item, 'slug', itemSource),
      title: readString(item, 'title', itemSource),
      icon: readString(item, 'icon', itemSource),
      description: readString(item, 'description', itemSource),
    };
  });
}

export function parseQuestionFile(raw: string, { source, categoryId, orderNum }: QuestionFileMeta): Question {
  const match = FRONTMATTER.exec(raw);
  if (!match) fail(source, '--- 로 감싼 frontmatter와 본문이 필요하다.');
  const [, frontmatter = '', body = ''] = match;
  const data: unknown = parse(frontmatter);
  if (!isRecord(data)) fail(source, 'frontmatter는 객체여야 한다.');

  const answer = body.trim();
  if (!answer) fail(source, '본문(답변)이 비어 있다.');

  return {
    id: readString(data, 'id', source),
    category_id: categoryId,
    question: readString(data, 'question', source),
    answer,
    sub_category: readString(data, 'sub_category', source),
    difficulty: readDifficulty(data, source),
    order_num: orderNum,
    tags: readStringList(data, 'tags', source),
    show_in_daily: readBoolean(data, 'show_in_daily', source),
    show_in_flashcard: readBoolean(data, 'show_in_flashcard', source),
    follow_ups: readFollowUps(data, source),
  };
}
