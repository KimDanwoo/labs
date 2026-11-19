// CC0 원본의 리그·애니메이션을 보존하고 Loop subdivision으로 곡면을 굽는다.
// 실행: node scripts/refine-runner.mjs (prairie 디렉토리에서)
import { fileURLToPath } from 'node:url';

import { readGlb, writeGlb } from './runner/glb.mjs';
import { closeBoundaryLoops, computeNormals, stripPlateTail, weldMesh } from './runner/mesh.mjs';
import { loopSubdivide } from './runner/subdivide.mjs';
import { addTailStrands } from './runner/tailStrands.mjs';

const { gltf, binary } = readGlb(new URL('../public/models/runner.glb', import.meta.url));
const { mesh: stripped, tailSource } = stripPlateTail(weldMesh(gltf, binary));
closeBoundaryLoops(stripped);
let mesh = stripped;
for (let iteration = 0; iteration < 2; iteration += 1) mesh = loopSubdivide(mesh);
addTailStrands(mesh, tailSource);
const { vertices, faces } = mesh;
const normals = computeNormals(mesh);
const destination = new URL('../public/models/unicorn.glb', import.meta.url);
writeGlb(
  destination,
  gltf,
  binary,
  { vertices, faces, normals },
  'Prairie: CC0 Quaternius horse, welded Loop subdivision × 2',
);
console.log(`${vertices.length} vertices, ${faces.length} triangles → ${fileURLToPath(destination)}`);
