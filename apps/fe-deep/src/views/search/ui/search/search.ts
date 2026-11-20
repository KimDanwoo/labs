import { SearchField } from '@views/search/ui/search/SearchField';
import { SearchNoResults } from '@views/search/ui/search/SearchNoResults';
import { SearchPrompt } from '@views/search/ui/search/SearchPrompt';
import { SearchResults } from '@views/search/ui/search/SearchResults';
import { SearchRoot } from '@views/search/ui/search/SearchRoot';
import { SearchSummary } from '@views/search/ui/search/SearchSummary';

export const Search = {
  Root: SearchRoot,
  Field: SearchField,
  Summary: SearchSummary,
  Results: SearchResults,
  NoResults: SearchNoResults,
  Prompt: SearchPrompt,
};
