'use client';

import { useDebounce } from '@shared/lib/useDebounce';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { FILTER_ALL, SEARCH_DEBOUNCE_MS } from '../../config/questionList';

const PARAM = { search: 'q', category: 'category', difficulty: 'difficulty', page: 'page' } as const;
const FIRST_PAGE = 1;

/** 기본값은 URL에 남기지 않는다 — 필터 없는 목록의 주소가 하나로 유지된다. */
const isDefault = (key: string, value: string | null): value is null | '' =>
  value === null || value === '' || value === FILTER_ALL || (key === PARAM.page && value === String(FIRST_PAGE));

/** 목록의 검색어·필터·페이지를 URL에 둔다 — 편집 화면에서 돌아와도 보던 목록이 복원된다. */
export function useQuestionListParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams.get(PARAM.search) ?? '';
  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebounce(searchInput, SEARCH_DEBOUNCE_MS);

  const update = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams);
      for (const [key, value] of Object.entries(updates)) {
        if (isDefault(key, value)) params.delete(key);
        else params.set(key, value);
      }
      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    },
    [searchParams, pathname, router],
  );

  useEffect(() => {
    if (debouncedSearch === search) return;
    update({ [PARAM.search]: debouncedSearch, [PARAM.page]: null });
  }, [debouncedSearch, search, update]);

  return {
    searchInput,
    setSearchInput,
    search: debouncedSearch,
    category: searchParams.get(PARAM.category) ?? FILTER_ALL,
    difficulty: searchParams.get(PARAM.difficulty) ?? FILTER_ALL,
    page: Math.max(FIRST_PAGE, Number(searchParams.get(PARAM.page)) || FIRST_PAGE),
    setCategory: (category: string) => update({ [PARAM.category]: category, [PARAM.page]: null }),
    setDifficulty: (difficulty: string) => update({ [PARAM.difficulty]: difficulty, [PARAM.page]: null }),
    setPage: (page: number) => update({ [PARAM.page]: String(page) }),
  };
}
