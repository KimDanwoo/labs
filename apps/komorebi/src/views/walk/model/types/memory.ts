import type { Landmark } from '../world/landmarks';

export type MemoryPage = { label: string; text: string };
export type Memory = { landmark: Landmark; pages: MemoryPage[] };
