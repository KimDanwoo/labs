import Link from 'next/link';

import { loadQuestionContent } from '@entities/question/index.server';
import { Card } from '@shared/ui/Card';

import { CATEGORY_CARD_STAGGER_MS } from '../config/motion';
import { categoryHref } from '../lib/categoryHref';
import { styles } from './ReferenceView.styles';

export async function ReferenceView() {
  const { categories } = await loadQuestionContent();

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>레퍼런스</h1>
        <p className={styles.description}>카테고리별 프론트엔드 핵심 개념을 탐색하세요.</p>
      </div>

      <div className={styles.grid}>
        {categories.map((category, index) => (
          <Link
            key={category.id}
            href={categoryHref(category.slug)}
            className={styles.cardLink}
            style={{ animationDelay: `${index * CATEGORY_CARD_STAGGER_MS}ms` }}
          >
            <Card className={styles.card}>
              <Card.Header>
                <div className={styles.iconRow}>
                  <span className={styles.icon}>{category.icon}</span>
                </div>
                <Card.Title className={styles.cardTitle}>{category.title}</Card.Title>
                <Card.Description className={styles.cardDescription}>{category.description}</Card.Description>
              </Card.Header>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
