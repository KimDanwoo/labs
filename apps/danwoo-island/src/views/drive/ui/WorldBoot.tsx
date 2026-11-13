'use client';

import { useEffect, useState } from 'react';

import { bootWorld } from '../lib/bootWorld';

function reloadPage() {
  window.location.reload();
}

export function WorldBoot() {
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => {
    let isMounted = true;
    bootWorld(() => isMounted).catch(() => setHasFailed(true));
    return () => {
      isMounted = false;
    };
  }, []);

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
