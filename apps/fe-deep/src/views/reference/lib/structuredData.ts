import type { Category, Question } from '@entities/question';

import { FAQ_ANSWER_LENGTH, SCHEMA_CONTEXT } from '../config/structuredData';
import { categoryHref } from './categoryHref';

export function toJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export function buildFaqSchema(questions: Question[]) {
  if (questions.length === 0) return null;
  return {
    '@context': SCHEMA_CONTEXT,
    '@type': 'FAQPage',
    mainEntity: questions.map((question) => ({
      '@type': 'Question',
      name: question.question,
      acceptedAnswer: { '@type': 'Answer', text: question.answer.slice(0, FAQ_ANSWER_LENGTH) },
    })),
  };
}

export function buildBreadcrumbSchema(siteUrl: string, category: Category) {
  const crumbs = [
    { name: '홈', item: siteUrl },
    { name: '레퍼런스', item: `${siteUrl}/reference` },
    { name: category.title, item: `${siteUrl}${categoryHref(category.slug)}` },
  ];
  return {
    '@context': SCHEMA_CONTEXT,
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({ '@type': 'ListItem', position: index + 1, ...crumb })),
  };
}
