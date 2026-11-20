import { FIRST_PAGE, NEARBY_PAGES, PAGE_ELLIPSIS } from '@views/reference/config/pagination';

type PageItem = number | typeof PAGE_ELLIPSIS;

export function buildPageItems(totalPages: number, page: number): PageItem[] {
  const visible = Array.from({ length: totalPages }, (_, index) => index + FIRST_PAGE).filter(
    (candidate) => candidate === FIRST_PAGE || candidate === totalPages || Math.abs(candidate - page) <= NEARBY_PAGES,
  );
  return visible.flatMap((candidate, index): PageItem[] => {
    const previous = visible[index - 1];
    const hasSkippedPages = previous !== undefined && candidate - previous > 1;
    return hasSkippedPages ? [PAGE_ELLIPSIS, candidate] : [candidate];
  });
}
