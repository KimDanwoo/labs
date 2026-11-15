interface RouteOptions {
  readonly places: readonly string[];
  readonly visited: ReadonlySet<string>;
  readonly origin: string;
  readonly random: () => number;
}

export function pickTornadoDestination({ places, visited, origin, random }: RouteOptions): string | null {
  const candidates = places.filter((place) => place !== origin);
  const unvisited = candidates.filter((place) => !visited.has(place));
  const pool = unvisited.length > 0 ? unvisited : candidates;
  return pool[Math.floor(random() * pool.length)] ?? null;
}
