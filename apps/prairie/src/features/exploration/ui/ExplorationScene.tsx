'use client';

import { useFrame } from '@react-three/fiber';
import { terrainHeightAt } from '@shared/config';
import {
  getExploration,
  loadExploration,
  saveExploration,
  updateExploration,
  useExploration,
} from '@shared/exploration/store';
import { crossesGate, GATES, LANDMARKS } from '@shared/exploration/world';
import { runnerState } from '@shared/r3f';
import { useEffect, useRef } from 'react';
import { Vector3 } from 'three';
import { LivingLandmarks } from './LivingLandmarks';
import { StarlightGate } from './StarlightGate';

const centers = GATES.map((gate) => ({ x: gate.x, y: terrainHeightAt(gate.x, gate.z) + gate.height, z: gate.z }));

export function ExplorationScene() {
  const progress = useExploration();
  const previous = useRef(new Vector3());
  const bodyPosition = useRef(new Vector3());
  const initialized = useRef(false);
  const elapsed = useRef(0);
  const noticeUntil = useRef(0);
  const lastNotice = useRef('');
  useEffect(() => {
    loadExploration();
  }, []);
  useFrame((state, delta) => {
    const position = bodyPosition.current.copy(runnerState.position);
    position.y += 1.3; // The visible torso, rather than the hoof/terrain origin.
    if (!initialized.current) {
      previous.current.copy(position);
      initialized.current = true;
    }
    let current = getExploration();
    const nearby = LANDMARKS.find(
      (place) =>
        Math.hypot(position.x - place.x, position.z - place.z) < place.radius &&
        Math.abs(position.y - terrainHeightAt(place.x, place.z)) < 38,
    );
    if ((nearby?.name ?? '') !== current.nearby) updateExploration({ nearby: nearby?.name ?? '' });
    if (nearby && !current.discovered.includes(nearby.id)) {
      updateExploration({
        discovered: [...current.discovered, nearby.id],
        notice: `${nearby.name} 발견 · ${nearby.description}`,
      });
      saveExploration();
    }
    current = getExploration();
    if (!current.active) elapsed.current = 0;
    else elapsed.current += Math.min(delta, 0.1);
    const center = centers[current.nextGate];
    if (center && crossesGate(previous.current, position, center)) {
      if (current.nextGate === centers.length - 1) {
        const result = Math.max(0.1, Math.round(elapsed.current * 10) / 10);
        updateExploration({
          active: false,
          nextGate: centers.length,
          elapsed: result,
          best: Math.min(current.best ?? Infinity, result),
          notice: `바람길 완주 · ${result.toFixed(1)}초`,
        });
        saveExploration();
      } else {
        updateExploration({
          active: true,
          nextGate: current.nextGate + 1,
          notice: current.nextGate === 0 ? '바람길 시작 · 빛나는 고리를 따라가세요' : '',
        });
      }
    }
    current = getExploration();
    if (current.active && Math.floor(elapsed.current * 10) / 10 !== current.elapsed)
      updateExploration({ elapsed: Math.floor(elapsed.current * 10) / 10 });
    if (current.notice !== lastNotice.current) {
      lastNotice.current = current.notice;
      noticeUntil.current = state.clock.elapsedTime + 6;
    }
    if (current.notice && state.clock.elapsedTime > noticeUntil.current) updateExploration({ notice: '' });
    previous.current.copy(position);
  });
  return (
    <group>
      <LivingLandmarks />
      {centers.map(
        (center, index) =>
          index >= progress.nextGate && (
            <group key={index} position={[center.x, center.y, center.z]}>
              <StarlightGate active={index === progress.nextGate} index={index} />
            </group>
          ),
      )}
    </group>
  );
}
