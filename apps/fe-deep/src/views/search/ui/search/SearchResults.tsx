import { Accordion } from '@shared/ui/Accordion';

import { useSearchContext } from '../../model/hooks/useSearchContext';
import { SearchResultItem } from '../SearchResultItem';

export function SearchResults() {
  const { hasResults, displayResults } = useSearchContext();
  if (!hasResults) return null;

  return (
    <Accordion type="multiple" className="space-y-2.5">
      {displayResults.map((result) => (
        <SearchResultItem key={result.question.id} result={result} />
      ))}
    </Accordion>
  );
}
