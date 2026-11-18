'use client';

import { Search } from 'lucide-react';

import { Accordion } from '@shared/ui/Accordion';
import { Card } from '@shared/ui/Card';
import { Input } from '@shared/ui/Input';

import { useSearch } from '../model/hooks/useSearch';
import { EmptySearchPrompt } from './EmptySearchPrompt';
import { styles } from './SearchContent.styles';
import { SearchResultItem } from './SearchResultItem';

export function SearchContent() {
  const { query, setQuery, debouncedQuery, displayResults, isSearching } = useSearch();

  const hasResults = displayResults.length > 0;
  const showNoResults = !!debouncedQuery && !isSearching && !hasResults;

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>검색</h1>
        <div className={styles.field}>
          <Search className={styles.fieldIcon} />
          <Input
            type="search"
            placeholder="키워드로 질문, 답변, 태그를 검색하세요..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className={styles.input}
            autoFocus
          />
        </div>
      </div>

      {debouncedQuery && (
        <p className={styles.summary}>
          &quot;{debouncedQuery}&quot;에 대한 검색 결과 {isSearching ? '...' : `${displayResults.length}건`}
        </p>
      )}

      {hasResults && (
        <Accordion type="multiple" className={styles.results}>
          {displayResults.map((result) => (
            <SearchResultItem key={result.question.id} result={result} />
          ))}
        </Accordion>
      )}

      {showNoResults && (
        <Card className={styles.emptyCard}>
          <p className={styles.emptyText}>검색 결과가 없습니다. 다른 키워드로 검색해보세요.</p>
        </Card>
      )}

      {!debouncedQuery && <EmptySearchPrompt />}
    </div>
  );
}
