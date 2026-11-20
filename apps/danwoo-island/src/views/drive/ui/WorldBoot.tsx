'use client';

import { reloadPage } from '@views/drive/lib/reloadPage';
import { useWorldBoot } from '@views/drive/model/hooks/useWorldBoot';

export function WorldBoot() {
  const { hasFailed } = useWorldBoot();

  if (!hasFailed) return null;

  return (
    <div className="island-startup" role="alert">
      <span>준비를 마치지 못했어요</span>
      <button type="button" onClick={reloadPage}>
        다시 불러오기
      </button>
    </div>
  );
}
