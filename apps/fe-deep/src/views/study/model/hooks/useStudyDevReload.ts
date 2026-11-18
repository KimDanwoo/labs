import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

import { fetchStudyStamp } from '../../api/fetchStudyStamp';
import { STUDY_STAMP_POLL_MS, STUDY_STAMP_QUERY_KEY } from '../../config/devReload';
import { IS_DEVELOPMENT } from '../../config/environment';

export function useStudyDevReload() {
  const router = useRouter();
  const lastStampRef = useRef<number | null>(null);

  const { data: stamp } = useQuery({
    queryKey: STUDY_STAMP_QUERY_KEY,
    queryFn: fetchStudyStamp,
    enabled: IS_DEVELOPMENT,
    refetchInterval: STUDY_STAMP_POLL_MS,
    retry: false,
  });

  useEffect(() => {
    if (stamp === undefined) return;
    if (lastStampRef.current !== null && lastStampRef.current !== stamp) router.refresh();
    lastStampRef.current = stamp;
  }, [stamp, router]);
}
