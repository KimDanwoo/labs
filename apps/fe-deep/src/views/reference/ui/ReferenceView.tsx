import { PageContainer } from '@shared/ui/PageContainer';
import { PageTitle } from '@shared/ui/PageTitle';
import Link from 'next/link';

import { loadQuestionContent } from '@entities/question/index.server';
import { Card } from '@shared/ui/Card';

import { CATEGORY_CARD_STAGGER_MS } from '../config/motion';
import { categoryHref } from '../lib/categoryHref';

export async function ReferenceView() {
  const { categories } = await loadQuestionContent();

  return (
    <PageContainer width="wide">
      <div className="mb-10 animate-fade-in">
        <PageTitle className="mb-3">레퍼런스</PageTitle>
        <p className="text-muted-foreground">카테고리별 프론트엔드 핵심 개념을 탐색하세요.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {categories.map((category, index) => (
          <Link
            key={category.id}
            href={categoryHref(category.slug)}
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * CATEGORY_CARD_STAGGER_MS}ms` }}
          >
            <Card className="card-hover hover:border-primary/30 cursor-pointer h-full group">
              <Card.Header>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl group-hover:scale-110 transition-transform duration-300">
                    {category.icon}
                  </span>
                </div>
                <Card.Title className="group-hover:text-primary transition-colors duration-200">
                  {category.title}
                </Card.Title>
                <Card.Description className="text-sm leading-relaxed">{category.description}</Card.Description>
              </Card.Header>
            </Card>
          </Link>
        ))}
      </div>
    </PageContainer>
  );
}
