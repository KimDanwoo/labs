import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { STUDY_SEARCH_PARAM } from '../../config/filters';
import {
  STUDY_FILTER,
  parseStudyFilter,
  parseStudyTiers,
  serializeStudyTiers,
  type StudyFilter,
  type StudyTier,
} from '../services/studyFilter';

export function useStudyFilterParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filter = parseStudyFilter(searchParams.get(STUDY_SEARCH_PARAM.filter));
  const tiers = parseStudyTiers(searchParams.get(STUDY_SEARCH_PARAM.tier));

  const replaceParams = (next: URLSearchParams) => {
    const queryString = next.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  };

  const handleToggleTier = (tier: StudyTier) => {
    const next = new Set(tiers);
    if (next.has(tier)) next.delete(tier);
    else next.add(tier);

    const params = new URLSearchParams(searchParams);
    const serialized = serializeStudyTiers(next);
    if (serialized) params.set(STUDY_SEARCH_PARAM.tier, serialized);
    else params.delete(STUDY_SEARCH_PARAM.tier);
    replaceParams(params);
  };

  const handleChangeFilter = (next: StudyFilter) => {
    const params = new URLSearchParams(searchParams);
    if (next === STUDY_FILTER.all) params.delete(STUDY_SEARCH_PARAM.filter);
    else params.set(STUDY_SEARCH_PARAM.filter, next);
    replaceParams(params);
  };

  return { filter, tiers, tierKey: serializeStudyTiers(tiers), handleToggleTier, handleChangeFilter };
}
