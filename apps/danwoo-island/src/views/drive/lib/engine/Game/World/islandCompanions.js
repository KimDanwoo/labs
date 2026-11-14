import * as THREE from 'three/webgpu'
import { projectFrontUV, propMaterial, texturedMesh } from './islandTextured.js'

const SHELL_LIFT = 1.015
const FRONT_ARC = 0.9

function framePlacer({ size, matrix })
{
    const at = (t) => (t - 0.5) * size.y
    return { W: size.x, H: size.y, D: size.z, at, matrix }
}

function ellipsoid(parts, shade, scale, position, matrix, segments = [8, 4])
{
    parts.add(shade, new THREE.SphereGeometry(0.5, ...segments), { scale, position, matrix })
}

function frontShell({ scale, position, segments = [12, 6], thetaRange = [0.3, 0.75] })
{
    const [thetaStart, thetaEnd] = thetaRange
    const geometry = new THREE.SphereGeometry(0.5, segments[0], segments[1], Math.PI / 2 - FRONT_ARC, FRONT_ARC * 2, Math.PI * thetaStart, Math.PI * (thetaEnd - thetaStart))
    geometry.scale(scale[0] * SHELL_LIFT, scale[1] * SHELL_LIFT, scale[2] * SHELL_LIFT)
    geometry.translate(...position)
    return geometry
}

function remapV(geometry, from, to)
{
    const uv = geometry.attributes.uv
    for(let index = 0; index < uv.count; index++)
        uv.setY(index, from + uv.getY(index) * (to - from))
    return geometry
}

function curlTail(parts, shade, radius, tube, position, matrix)
{
    parts.add(shade, new THREE.TorusGeometry(radius, tube, 4, 8, Math.PI * 1.4), { position, rotation: [0, Math.PI / 2, 0], matrix })
}

function maneShape(width, height)
{
    const shape = new THREE.Shape()
    const lobes = 6
    const points = 24
    for(let index = 0; index <= points; index++)
    {
        const angle = (index / points) * Math.PI * 2
        const wave = 1 + 0.08 * Math.sin(angle * lobes)
        const x = Math.cos(angle) * width * 0.5 * wave
        const y = Math.sin(angle) * height * 0.5 * wave
        if(index === 0)
            shape.moveTo(x, y)
        else
            shape.lineTo(x, y)
    }
    return shape
}

export function haetaeFigure(parts, [bodyFrame, headFrame], materials, container)
{
    const body = framePlacer(bodyFrame)
    const { W, H, D, at, matrix } = body
    parts.box('graniteDark', [0.96 * W, 0.06 * H, 0.94 * D], { position: [0, at(0.03), 0], matrix })
    ellipsoid(parts, 'granite', [0.74 * W, 0.48 * H, 0.7 * D], [0, at(0.4), 0], matrix)
    const shoulder = { scale: [0.44 * W, 0.5 * H, 0.78 * D], position: [0.25 * W, at(0.65), 0.04 * D] }
    ellipsoid(parts, 'granite', shoulder.scale, shoulder.position, matrix)
    for(const sx of [-1, 1])
        for(const sz of [-1, 1])
        {
            parts.box('granite', [0.16 * W, 0.2 * H, 0.2 * D], { position: [sx * 0.28 * W, at(0.2), sz * 0.28 * D], matrix })
            parts.box('granite', [0.22 * W, 0.1 * H, 0.3 * D], { position: [sx * 0.28 * W, at(0.09), sz * 0.28 * D], matrix })
        }
    parts.box('granite', [0.2 * W, 0.22 * H, 0.28 * D], { position: [0.39 * W, at(0.87), 0.34 * D], matrix })
    curlTail(parts, 'granite', 0.1 * W, 0.04 * W, [-0.35 * W, at(0.58), -0.1 * D], matrix)
    const chest = frontShell({ scale: shoulder.scale, position: shoulder.position })
    projectFrontUV(chest, { left: shoulder.position[0] - 0.17 * W, right: shoulder.position[0] + 0.17 * W, bottom: shoulder.position[1] - 0.055 * W, top: shoulder.position[1] + 0.055 * W })
    container.add(texturedMesh(remapV(chest, 0, 0.32), propMaterial(materials, 'haetaeFront'), { name: 'haetaeChest', matrix, castShadow: false }))
    if(!headFrame)
        return

    const head = framePlacer(headFrame)
    const headMatrix = head.matrix.clone().multiply(new THREE.Matrix4().makeRotationY(Math.PI))
    const mane = new THREE.ExtrudeGeometry(maneShape(0.96 * head.W, 0.96 * head.H), { depth: 0.36 * head.D, bevelEnabled: false, curveSegments: 4 })
    mane.translate(0, head.at(0.5), -0.12 * head.D - 0.18 * head.D)
    parts.add('graniteDark', mane, { matrix: headMatrix })
    const skull = { scale: [0.86 * head.W, 0.8 * head.H, 0.72 * head.D], position: [0, head.at(0.5), 0.04 * head.D] }
    ellipsoid(parts, 'granite', skull.scale, skull.position, headMatrix, [10, 5])
    parts.box('granite', [0.24 * head.W, 0.34 * head.H, 0.64 * head.D], { position: [0.34 * head.W, head.at(0.3), -0.1 * head.D], matrix: headMatrix })
    parts.box('granite', [0.32 * head.W, 0.26 * head.H, 0.16 * head.D], { position: [0, head.at(0.44), 0.39 * head.D], matrix: headMatrix })
    const faceWidth = Math.min(0.78 * head.W, (0.78 * head.H) / 0.68)
    const face = frontShell({ scale: skull.scale, position: skull.position, thetaRange: [0.15, 0.85] })
    projectFrontUV(face, { left: -faceWidth / 2, right: faceWidth / 2, bottom: head.at(0.52) - faceWidth * 0.34, top: head.at(0.52) + faceWidth * 0.34 })
    container.add(texturedMesh(remapV(face, 0.32, 1), propMaterial(materials, 'haetaeFront'), { name: 'haetaeFace', matrix: headMatrix, castShadow: false }))
}

const DONGJASEOK = {
    body: [[0, 0.06], [0.92, 0.06], [1, 0.1], [0.91, 0.28], [0.82, 0.48], [0.9, 0.6], [0.72, 0.69], [0, 0.71]],
    head: [[0, 0.66], [0.65, 0.66], [0.92, 0.7], [1, 0.78], [0.96, 0.87], [0.75, 0.93], [0, 0.95]],
    shell: [[0.83, 0.5], [0.9, 0.6], [0.92, 0.7], [1, 0.78], [0.96, 0.87], [0.85, 0.91]],
    basaltRepeat: [2, 3],
    sides: 10,
}

function squashedLathe(profile, radius, at, depthScale, { phiStart = 0, phiLength = Math.PI * 2, lift = 1 } = {})
{
    const geometry = new THREE.LatheGeometry(profile.map(([r, t]) => new THREE.Vector2(r * radius * lift, at(t))), DONGJASEOK.sides, phiStart, phiLength)
    geometry.scale(1, 1, depthScale)
    return geometry
}

export function dongjaseokFigure(parts, [frame], materials, container)
{
    const { W, D, at, matrix } = framePlacer(frame)
    const bodyRadius = 0.44 * W
    const headRadius = 0.45 * W
    const basalt = propMaterial(materials, 'basalt', { repeat: DONGJASEOK.basaltRepeat })
    container.add(texturedMesh(squashedLathe(DONGJASEOK.body, bodyRadius, at, (0.35 * D) / bodyRadius), basalt, { name: 'dongjaseokBody', matrix }))
    container.add(texturedMesh(squashedLathe(DONGJASEOK.head, headRadius, at, (0.3 * D) / headRadius), basalt, { name: 'dongjaseokHead', matrix }))
    parts.add('basalt', new THREE.CylinderGeometry(0.5, 0.5, 1, 8), { scale: [0.9 * W, 0.06 * frame.size.y, 0.76 * D], position: [0, at(0.03), 0], matrix })
    for(const side of [-1, 1])
        ellipsoid(parts, 'basaltDark', [0.18 * W, 0.07 * frame.size.y, 0.16 * D], [side * 0.28 * W, at(0.925), 0], matrix, [6, 3])
    const shell = squashedLathe(DONGJASEOK.shell, headRadius, at, (0.33 * D) / headRadius, { phiStart: -FRONT_ARC, phiLength: FRONT_ARC * 2, lift: SHELL_LIFT })
    const width = 0.84 * W
    projectFrontUV(shell, { left: -width / 2, right: width / 2, bottom: at(0.705) - width * 0.75, top: at(0.705) + width * 0.75 })
    container.add(texturedMesh(shell, propMaterial(materials, 'dongjaseokFront'), { name: 'dongjaseokFace', matrix, castShadow: false }))
}

function earShape(width, height)
{
    const shape = new THREE.Shape()
    shape.moveTo(-width / 2, 0)
    shape.lineTo(width / 2, 0)
    shape.lineTo(width * 0.2, height)
    shape.closePath()
    return shape
}

function backBoardShape(width, height)
{
    const cut = Math.min(width, height) * 0.18
    const shape = new THREE.Shape()
    const [x, y] = [width / 2, height / 2]
    shape.moveTo(-x + cut, -y)
    for(const [px, py] of [[x - cut, -y], [x, -y + cut], [x, y - cut], [x - cut, y], [-x + cut, y], [-x, y - cut], [-x, -y + cut]])
        shape.lineTo(px, py)
    shape.closePath()
    return shape
}

export function jindoFigure(parts, [bodyFrame, boardFrame], materials, container)
{
    const { W, H, D, at, matrix } = framePlacer(bodyFrame)
    ellipsoid(parts, 'jindoPaint', [0.68 * W, 0.48 * H, 0.62 * D], [0, at(0.38), -0.07 * D], matrix)
    ellipsoid(parts, 'jindoPaint', [0.86 * W, 0.29 * H, 0.6 * D], [0, at(0.22), -0.12 * D], matrix)
    for(const side of [-1, 1])
    {
        parts.box('jindoPaint', [0.17 * W, 0.26 * H, 0.18 * D], { position: [side * 0.24 * W, at(0.21), 0.24 * D], matrix })
        parts.box('jindoPaint', [0.23 * W, 0.08 * H, 0.3 * D], { position: [side * 0.24 * W, at(0.07), 0.26 * D], matrix })
        const ear = new THREE.ExtrudeGeometry(earShape(0.22 * W, 0.15 * H), { depth: 0.16 * D, bevelEnabled: false })
        ear.translate(0, 0, -0.08 * D)
        parts.add('jindoPaint', ear, { position: [side * 0.23 * W, at(0.84), 0.13 * D], matrix })
    }
    const skull = { scale: [0.82 * W, 0.32 * H, 0.42 * D], position: [0, at(0.7), 0.13 * D] }
    ellipsoid(parts, 'jindoPaint', skull.scale, skull.position, matrix, [10, 5])
    parts.box('jindoPaint', [0.42 * W, 0.1 * H, 0.18 * D], { position: [0, at(0.65), 0.34 * D], matrix })
    curlTail(parts, 'jindoPaint', 0.1 * W, 0.045 * W, [0.29 * W, at(0.43), -0.31 * D], matrix)
    const faceSize = 0.56 * W
    const face = frontShell({ scale: skull.scale, position: skull.position, thetaRange: [0.1, 0.9] })
    projectFrontUV(face, { left: -faceSize / 2, right: faceSize / 2, bottom: at(0.7) - faceSize / 2, top: at(0.7) + faceSize / 2 })
    container.add(texturedMesh(face, propMaterial(materials, 'jindoFront'), { name: 'jindoFace', matrix, castShadow: false }))
    if(!boardFrame)
        return
    const board = framePlacer(boardFrame)
    const plate = new THREE.ExtrudeGeometry(backBoardShape(0.88 * board.W, 0.84 * board.H), { depth: 0.64 * board.D, bevelEnabled: false })
    plate.translate(0, board.at(0.5), -0.32 * board.D)
    parts.add('jindoPaint', plate, { matrix: board.matrix })
}
