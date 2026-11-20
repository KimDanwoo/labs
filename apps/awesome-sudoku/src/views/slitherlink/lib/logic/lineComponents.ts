import { EDGE } from '@views/slitherlink/config/board';
import { itemAt } from '@views/slitherlink/lib/itemAt';
import type { EdgeState, GridTopology } from '@views/slitherlink/model/types/slitherlink';

export interface LineComponents {
  find: (vertex: number) => number;
  hasCycle: boolean;
  componentCount: number;
}

export const collectLineComponents = (edges: readonly EdgeState[], topology: GridTopology): LineComponents => {
  const parent = Array.from({ length: topology.vertexCount }, (_, vertex) => vertex);
  const touched = Array.from({ length: topology.vertexCount }, () => false);
  const find = (vertex: number): number => {
    let root = vertex;
    while (itemAt(parent, root) !== root) root = itemAt(parent, root);
    parent[vertex] = root;
    return root;
  };
  const touch = (vertex: number): number => {
    if (itemAt(touched, vertex)) return 0;
    touched[vertex] = true;
    return 1;
  };

  let touchedCount = 0;
  let unions = 0;
  let hasCycle = false;
  for (let edge = 0; edge < edges.length; edge += 1) {
    if (itemAt(edges, edge) !== EDGE.LINE) continue;
    const [from, to] = itemAt(topology.edgeVertices, edge);
    touchedCount += touch(from) + touch(to);
    const fromRoot = find(from);
    const toRoot = find(to);
    if (fromRoot === toRoot) hasCycle = true;
    else {
      parent[fromRoot] = toRoot;
      unions += 1;
    }
  }
  return { find, hasCycle, componentCount: touchedCount - unions };
};
