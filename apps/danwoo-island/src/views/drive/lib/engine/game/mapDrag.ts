import * as THREE from 'three/webgpu';

interface MapDragHost {
  isActive: () => boolean;
  camera: () => THREE.Camera;
  viewport: () => { width: number; height: number };
  focus: () => THREE.Vector3;
  startPan: () => void;
  panTo: (focus: THREE.Vector3) => void;
}

export interface MapDrag {
  cancel: () => void;
}

interface DragStart {
  pointerId: number;
  camera: THREE.Camera;
  grabbed: THREE.Vector3;
  focus: THREE.Vector3;
}

const INTERACTIVE_TARGET = 'button, a, .map-card, .map-places, .map-chip, .map-hint';
const GROUND = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const NO_BUTTONS = 0;

function isInteractive(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(INTERACTIVE_TARGET) !== null;
}

function isReleased(event: PointerEvent): boolean {
  return event.pointerType === 'mouse' && event.buttons === NO_BUTTONS;
}

function groundPoint(
  camera: THREE.Camera,
  { width, height }: { width: number; height: number },
  event: PointerEvent,
): THREE.Vector3 | null {
  const pointer = new THREE.Vector2((event.clientX / width) * 2 - 1, -(event.clientY / height) * 2 + 1);
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(pointer, camera);
  return raycaster.ray.intersectPlane(GROUND, new THREE.Vector3());
}

export function bindMapDrag(target: Window, host: MapDragHost): MapDrag {
  let drag: DragStart | null = null;

  const cancel = (): void => {
    drag = null;
  };
  const release = (event: PointerEvent): void => {
    if (event.pointerId === drag?.pointerId) cancel();
  };

  target.addEventListener('pointerdown', (event) => {
    if (drag || !host.isActive() || isInteractive(event.target)) return;
    const camera = host.camera().clone();
    const grabbed = groundPoint(camera, host.viewport(), event);
    if (!grabbed) return;
    drag = { pointerId: event.pointerId, camera, grabbed, focus: host.focus().clone() };
    host.startPan();
  });

  target.addEventListener('pointermove', (event) => {
    if (event.pointerId !== drag?.pointerId) return;
    if (!host.isActive() || isReleased(event)) {
      cancel();
      return;
    }
    const current = groundPoint(drag.camera, host.viewport(), event);
    if (!current) return;
    host.panTo(drag.focus.clone().add(drag.grabbed).sub(current));
  });

  target.addEventListener('pointerup', release);
  target.addEventListener('pointercancel', release);
  target.addEventListener('blur', cancel);
  return { cancel };
}
