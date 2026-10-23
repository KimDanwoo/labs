import type { Region } from './world';

/**
 * Where waves break, in painting percent (x across, z down): a stretch of shoreline, the way waves travel onto it
 * (a unit vector in square painting space, x scaled by 1.5) and how hard they break there (0–1). Traced by Codex.
 */
export type ShoreSegment = { a: [number, number]; b: [number, number]; incoming: [number, number]; strength: number };

const shore = (a: [number, number], b: [number, number], incoming: [number, number], strength: number) => ({
  a,
  b,
  incoming,
  strength,
});

export const SHORES: Partial<Record<Region, ShoreSegment[]>> = {
  coast: [
    shore([47, 41.6], [51, 40.2], [-0.227, -0.974], 0.36),
    shore([51, 40.2], [55, 38.9], [-0.212, -0.977], 0.4),
    shore([55, 38.9], [59.6, 37], [-0.265, -0.964], 0.46),
    shore([59.6, 37], [61.5, 36.7], [-0.105, -0.995], 0.5),
    shore([61.5, 36.7], [61.8, 34.6], [-0.978, -0.21], 0.62),
    shore([61.8, 34.6], [61.4, 32], [-0.974, 0.225], 0.68),
    shore([61.4, 32], [64, 31.7], [-0.077, -0.997], 0.82),
    shore([64, 31.7], [66.4, 31.3], [-0.11, -0.994], 0.94),
    shore([66.4, 31.3], [65.1, 29], [-0.763, 0.647], 0.9),
    shore([65.1, 29], [63.5, 25.1], [-0.852, 0.524], 0.75),
    shore([68.8, 19.5], [72, 20.1], [0.124, -0.992], 0.52),
    shore([72, 20.1], [78, 20.2], [0.011, -1.0], 0.65),
    shore([78, 20.2], [84, 19.8], [-0.044, -0.999], 0.72),
    shore([84, 19.8], [89, 20], [0.027, -1.0], 0.65),
    shore([89, 20], [94.9, 20.5], [0.056, -0.998], 0.5),
    shore([47, 41.6], [47, 45], [-1, 0], 0.26),
    shore([47, 45], [46.5, 49.5], [-0.986, -0.164], 0.3),
    shore([46.5, 49.5], [51.5, 50.6], [-0.145, 0.989], 0.36),
    shore([51.5, 50.6], [56, 52.5], [-0.271, 0.963], 0.44),
    shore([56, 52.5], [60.5, 54.1], [-0.231, 0.973], 0.52),
    shore([60.5, 54.1], [64, 54.5], [-0.076, 0.997], 0.58),
    shore([64, 54.5], [81.6, 55.4], [-0.034, 0.999], 0.62),
    shore([81.6, 55.4], [86.3, 52.6], [0.369, 0.929], 0.68),
    shore([86.3, 52.6], [90, 49.5], [0.488, 0.873], 0.74),
    shore([90, 49.5], [92.6, 46.7], [0.583, 0.812], 0.72),
    shore([92.6, 46.7], [96, 45.1], [0.299, 0.954], 0.62),
    shore([96, 45.1], [100, 45.5], [-0.067, 0.998], 0.54),
  ],
};
