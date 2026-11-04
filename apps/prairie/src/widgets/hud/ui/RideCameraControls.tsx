'use client';

import { CAMERA_MODE } from '@entities/ride-settings/model/constants';
import { useCameraSettings } from '@entities/ride-settings/model/hooks';
import { cameraSettings } from '@entities/ride-settings/model/store';

export function RideCameraControls() {
  const { mode } = useCameraSettings();
  return (
    <div className="pointer-events-auto flex items-center gap-sm">
      <div
        role="group"
        aria-label="카메라 거리"
        className="flex rounded-full border border-prairie-paper/25 bg-prairie-ink/60 p-xs backdrop-blur-md"
      >
        <button
          type="button"
          aria-label="가까운 주행 시점"
          aria-pressed={mode === CAMERA_MODE.close}
          onClick={() => cameraSettings.setMode(CAMERA_MODE.close)}
          className="ride-camera-option rounded-full px-md py-sm text-xs transition-colors focus-visible:outline-2 focus-visible:outline-prairie-accent"
        >
          가까이
        </button>
        <button
          type="button"
          aria-label="넓은 풍경 시점"
          aria-pressed={mode === CAMERA_MODE.wide}
          onClick={() => cameraSettings.setMode(CAMERA_MODE.wide)}
          className="ride-camera-option rounded-full px-md py-sm text-xs transition-colors focus-visible:outline-2 focus-visible:outline-prairie-accent"
        >
          넓게 보기
        </button>
      </div>
      <button
        type="button"
        onClick={() => cameraSettings.recenter()}
        aria-label="시점 초기화"
        className="flex size-10 items-center justify-center rounded-full border border-prairie-paper/25 bg-prairie-ink/60 text-lg backdrop-blur-md transition-colors hover:bg-prairie-ink/80 focus-visible:outline-2 focus-visible:outline-prairie-accent"
      >
        <span aria-hidden>↺</span>
      </button>
    </div>
  );
}
