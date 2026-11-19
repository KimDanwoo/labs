import type { Game } from './game';

const PROBE_KEY = '__islandProbe';
const YEAR_PROGRESS = 0.5;
const IMMEDIATE = 0;

type Triple = [number, number, number];

interface ProbeSnapshot {
  elapsed: number;
  elapsedScaled: number;
  vehicle: { position: Triple; quaternion: [number, number, number, number]; velocity: Triple; speed: number };
  camera: Triple;
}

interface IslandProbe {
  freezeDay: (progress: number) => void;
  moveTo: (place: string) => void;
  press: (key: string) => void;
  release: (key: string) => void;
  snapshot: () => ProbeSnapshot;
}

const round = (value: number): number => Math.round(value * 1000) / 1000;
const triple = ({ x, y, z }: { x: number; y: number; z: number }): Triple => [round(x), round(y), round(z)];

function createProbe(game: Game): IslandProbe {
  return {
    freezeDay: (progress) => {
      game.dayCycles.override.start({ progress }, IMMEDIATE);
      game.yearCycles.override.start({ progress: YEAR_PROGRESS }, IMMEDIATE);
    },
    moveTo: (place) => {
      const respawn = game.respawns.getByName(place);
      game.physicalVehicle.moveTo(respawn.position, respawn.rotation);
    },
    press: (key) => game.inputs.start(key),
    release: (key) => game.inputs.end(key),
    snapshot: () => {
      const vehicle = game.physicalVehicle;
      const { x, y, z, w } = vehicle.quaternion;
      return {
        elapsed: round(game.ticker.elapsed),
        elapsedScaled: round(game.ticker.elapsedScaled),
        vehicle: {
          position: triple(vehicle.position),
          quaternion: [round(x), round(y), round(z), round(w)],
          velocity: triple(vehicle.velocity),
          speed: round(vehicle.speed),
        },
        camera: triple(game.view.camera.position),
      };
    },
  };
}

export function exposeDevProbe(game: Game): void {
  if (process.env.NODE_ENV !== 'development') return;
  Reflect.set(window, PROBE_KEY, createProbe(game));
}
