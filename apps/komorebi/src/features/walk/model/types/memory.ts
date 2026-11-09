import type { Landmark } from '@shared/world/world';

export type MemoryPage = { label: string; text: string };
export type Memory = { landmark: Landmark; pages: MemoryPage[] };
