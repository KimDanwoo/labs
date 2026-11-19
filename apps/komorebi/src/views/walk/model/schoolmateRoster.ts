import { CHARACTER, OUTFIT, type CharacterTemplate, type Outfit } from './world/appearance';
import { REGION, type Point } from './world/world';

export const SCHOOL_REGION = { yard: REGION.school, hallway: REGION.hallway, classroom: REGION.classroom } as const;
export type SchoolRegion = (typeof SCHOOL_REGION)[keyof typeof SCHOOL_REGION];
export const SCHOOLMATE_ID = { boy: 'boy', girl: 'girl' } as const;
export type SchoolmateId = (typeof SCHOOLMATE_ID)[keyof typeof SCHOOLMATE_ID];
type Stops = readonly [Point, Point, ...Point[]];
export type SchoolmateSpec = {
  id: SchoolmateId;
  name: string;
  character: CharacterTemplate;
  outfit: Outfit;
  speed: number;
  restSeconds: number;
  stops: Record<SchoolRegion, Stops>;
};

export const SCHOOLMATES: readonly SchoolmateSpec[] = [
  {
    id: SCHOOLMATE_ID.boy,
    name: '하루',
    character: CHARACTER.boy,
    outfit: OUTFIT.pe,
    speed: 4,
    restSeconds: 2.4,
    stops: {
      school: [
        { x: 18, z: 72 },
        { x: 34, z: 77 },
        { x: 45, z: 67 },
        { x: 26, z: 66 },
      ],
      hallway: [
        { x: 25, z: 71 },
        { x: 44, z: 74 },
        { x: 54, z: 77 },
        { x: 33, z: 73 },
      ],
      classroom: [
        { x: 50, z: 78 },
        { x: 50, z: 90 },
        { x: 50, z: 84 },
        { x: 50, z: 70 },
      ],
    },
  },
  {
    id: SCHOOLMATE_ID.girl,
    name: '소라',
    character: CHARACTER.girl,
    outfit: OUTFIT.summer,
    speed: 3.5,
    restSeconds: 3.1,
    stops: {
      school: [
        { x: 83, z: 72 },
        { x: 68, z: 75 },
        { x: 58, z: 69 },
        { x: 76, z: 64 },
      ],
      hallway: [
        { x: 69, z: 71 },
        { x: 88, z: 72 },
        { x: 80, z: 80 },
        { x: 63, z: 75 },
      ],
      classroom: [
        { x: 64, z: 62 },
        { x: 74, z: 62 },
        { x: 79, z: 60 },
        { x: 64, z: 60 },
      ],
    },
  },
];
