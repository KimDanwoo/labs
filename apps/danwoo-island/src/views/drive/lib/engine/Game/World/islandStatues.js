import * as THREE from 'three/webgpu'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { createParts } from './islandGeometry.js'
import { projectFrontUV, propMaterial, texturedMesh } from './islandTextured.js'

const HAREUBANG = {
    radiusRatio: 0.46,
    depthRatio: 0.4,
    sides: 12,
    frontArc: Math.PI * 0.32,
    shellLift: 1.012,
    decal: { bottom: 0.47, top: 0.995, widthRatio: 0.98 },
    basaltRepeat: [3, 4],
    body: [[0, 0.03], [0.76, 0.03], [0.88, 0.08], [0.9, 0.32], [0.87, 0.48], [0.8, 0.6], [0.65, 0.65], [0, 0.65]],
    head: [[0, 0.6], [0.65, 0.6], [0.91, 0.65], [0.97, 0.75], [0.88, 0.84], [0.65, 0.87], [0, 0.87]],
    hat: [[0, 0.84], [1, 0.84], [1, 0.875], [0.79, 0.885], [0.76, 0.94], [0.5, 0.985], [0, 0.99]],
    envelope: [[0.87, 0.47], [0.87, 0.48], [0.8, 0.6], [0.91, 0.65], [0.97, 0.75], [0.94, 0.835], [1, 0.84], [1, 0.875], [0.79, 0.885], [0.76, 0.94], [0.5, 0.985], [0.05, 0.99]],
}

function latheGeometry(profile, radius, height, { phiStart = 0, phiLength = Math.PI * 2, lift = 1 } = {})
{
    const points = profile.map(([r, t]) => new THREE.Vector2(r * radius * lift, (t - 0.5) * height))
    return new THREE.LatheGeometry(points, HAREUBANG.sides, phiStart, phiLength)
}

function squashDepth(geometry, depthScale)
{
    geometry.scale(1, 1, depthScale)
    return geometry
}

export function hareubangFigure(materials, { size, matrix })
{
    const radius = HAREUBANG.radiusRatio * size.x
    const depthScale = (HAREUBANG.depthRatio * size.z) / radius
    const group = new THREE.Group()
    const basalt = propMaterial(materials, 'basalt', { repeat: HAREUBANG.basaltRepeat })
    const stone = mergeGeometries([HAREUBANG.body, HAREUBANG.head, HAREUBANG.hat].map((profile) => squashDepth(latheGeometry(profile, radius, size.y), depthScale)))
    group.add(texturedMesh(stone, basalt, { name: 'hareubangStone', matrix }))

    const { bottom, top, widthRatio } = HAREUBANG.decal
    const shell = squashDepth(latheGeometry(HAREUBANG.envelope, radius, size.y, { phiStart: -HAREUBANG.frontArc, phiLength: HAREUBANG.frontArc * 2, lift: HAREUBANG.shellLift }), depthScale)
    const halfWidth = (size.x * widthRatio) / 2
    projectFrontUV(shell, { left: -halfWidth, right: halfWidth, bottom: (bottom - 0.5) * size.y, top: (top - 0.5) * size.y })
    group.add(texturedMesh(shell, propMaterial(materials, 'hareubangFront'), { name: 'hareubangFace', matrix }))

    const parts = createParts()
    parts.add('basaltDark', new THREE.CylinderGeometry(0.5, 0.5, 1, 8), { scale: [0.82 * size.x, 0.04 * size.y, 0.8 * size.z], position: [0, (0.03 - 0.5) * size.y, 0], matrix })
    group.add(parts.build(materials))
    return group
}
