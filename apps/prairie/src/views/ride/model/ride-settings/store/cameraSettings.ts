import { CAMERA_MODE, type CameraMode } from '../constants';

const INITIAL = { mode: CAMERA_MODE.close as CameraMode, revision: 0 };
let snapshot = INITIAL;
const listeners = new Set<() => void>();

export const cameraSettings = {
  get: () => snapshot,
  getServer: () => INITIAL,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  setMode(mode: CameraMode) {
    if (snapshot.mode === mode) return;
    snapshot = { ...snapshot, mode };
    listeners.forEach((listener) => listener());
  },
  recenter() {
    snapshot = { ...snapshot, revision: snapshot.revision + 1 };
    listeners.forEach((listener) => listener());
  },
};
