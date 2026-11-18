import { ArrowRight, BookOpen, GraduationCap } from 'lucide-react';
import Link from 'next/link';

import { loadQuestionContent } from '@entities/question/index.server';
import { Button } from '@shared/ui/Button';

import { styles } from './HomeView.styles';

export async function HomeView() {
  const { categories } = await loadQuestionContent();

  return (
    <div className={styles.root}>
      <section className={styles.hero}>
        <div className={styles.heroGradient} />
        <div className={styles.heroNoise} />
        <div className={styles.heroInner}>
          <div className={styles.heroContent}>
            <div className={styles.eyebrow}>
              <span className={styles.pulse}>
                <span className={styles.pulseRing} />
                <span className={styles.pulseDot} />
              </span>
              프론트엔드 학습 플랫폼
            </div>
            <h1 className={styles.title}>
              프<span className={styles.titleAccent}>딥</span>
            </h1>
            <p className={styles.tagline}>
              프론트엔드를 <span className={styles.taglineEmphasis}>딥하게</span> 알자
            </p>
            <div className={styles.actions}>
              <Button size="lg" className={styles.primaryAction} asChild>
                <Link href="/reference">
                  <BookOpen className={styles.actionIcon} />
                  레퍼런스
                  <ArrowRight className={styles.actionIcon} />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className={styles.secondaryAction} asChild>
                <Link href="/learn">
                  <GraduationCap className={styles.actionIcon} />
                  학습 시작
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.categories}>
        <div className={styles.categoriesHeader}>
          <h2 className={styles.categoriesTitle}>학습 카테고리</h2>
          <p className={styles.categoriesDescription}>관심 있는 주제를 선택해 학습을 시작하세요</p>
        </div>
        <div className={styles.categoryList}>
          {categories.map((category) => (
            <Link key={category.id} href={`/reference/${category.slug}`}>
              <span className={styles.categoryChip}>
                <span className={styles.categoryIcon}>{category.icon}</span>
                {category.title}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
