'use client';

import { useEffect, useRef, useState } from 'react';

import { startSimulation, type SimulationHandle } from '@views/lotto/lib/simulationService';
import type { SimulationRequest, SimulationResult, SimulationStatus } from '@views/lotto/model/types/lotto';

export interface SimulationRun {
  status: SimulationStatus;
  request: SimulationRequest | null;
  result: SimulationResult | null;
}

const IDLE_RUN: SimulationRun = { status: 'idle', request: null, result: null };

export function useSimulation() {
  const [run, setRun] = useState<SimulationRun>(IDLE_RUN);
  const handleRef = useRef<SimulationHandle | null>(null);

  useEffect(() => () => handleRef.current?.cancel(), []);

  const start = (request: SimulationRequest) => {
    handleRef.current?.cancel();
    setRun({ status: 'running', request, result: null });
    const handle = startSimulation(request, (result) =>
      setRun((current) => (current.request === request ? { ...current, result } : current)),
    );
    handleRef.current = handle;
    handle.finished.then((result) => {
      if (handleRef.current !== handle) return;
      handleRef.current = null;
      setRun((current) => ({ ...current, status: result ? 'done' : 'cancelled', result: result ?? current.result }));
    });
  };

  return {
    run,
    isRunning: run.status === 'running',
    start,
    cancel: () => handleRef.current?.cancel(),
  };
}
