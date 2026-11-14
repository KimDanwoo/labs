import * as THREE from 'three/webgpu'
import { createParts, removeComponents } from '../islandGeometry.js'
import { canvasMaterial, propMaterial, texturedMesh } from '../islandTextured.js'

const LABELS = {
    x: 'LAB', bluesky001: '✦', youtube: 'MUSIC', mail: '이력서',
    twitch: '블로그', gitHub: 'CODE', linkedIn: '⌘', discord: '∞',
    onlyfans: '바람',
}

const STELE = {
    outline: [[-0.44, 0.12], [0.44, 0.12], [0.44, 0.83], [0.35, 0.94], [-0.35, 0.94], [-0.44, 0.83]],
    maxThickness: 0.3,
    faceHeight: 0.58,
    basaltRepeat: [0.8, 0.8],
}
const PEDESTAL_TIERS = [
    { shade: 'stoneDark', width: 0.96, height: 0.3, y: 0.15 },
    { shade: 'stone', width: 0.84, height: 0.5, y: 0.55 },
    { shade: 'basalt', width: 0.92, height: 0.18, y: 0.89 },
]
const PLAZA = { pedestalMaxHeight: 0.6, centerMinWidth: 2.5 }

function steleOutline(width, height)
{
    const shape = new THREE.Shape()
    STELE.outline.forEach(([x, t], index) =>
    {
        const point = [x * width, (t - 0.5) * height]
        if(index === 0)
            shape.moveTo(...point)
        else
            shape.lineTo(...point)
    })
    shape.closePath()
    return shape
}

function labelTexture(label)
{
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 256
    const context = canvas.getContext('2d')
    context.font = '700 104px MaruBuri'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillStyle = '#1a1716'
    context.fillText(label, 260, 132, 460)
    context.fillStyle = '#efe2c4'
    context.fillText(label, 256, 128, 460)
    const map = new THREE.CanvasTexture(canvas)
    map.colorSpace = THREE.SRGBColorSpace
    return map
}

const COLLIDER = /^(cuboid|tube)/i
const TUBE_INNER = { width: 0.9, depth: 0.4 }

function colliderFrame(collider)
{
    const matrix = new THREE.Matrix4().compose(collider.position, collider.quaternion, new THREE.Vector3(1, 1, 1))
    if(/^tube/i.test(collider.name))
    {
        const diameter = collider.scale.x
        return { size: new THREE.Vector3(diameter * TUBE_INNER.width, collider.scale.y, diameter * TUBE_INNER.depth), matrix }
    }
    return { size: collider.scale.clone(), matrix }
}

function signName(name)
{
    return name.replace(/PhysicalDynamic.*$/, '')
}

export function recordSteleFrames(model)
{
    for(const child of model.children.filter((item) => LABELS[signName(item.name)]))
    {
        const frames = child.children.filter((item) => COLLIDER.test(item.name)).map(colliderFrame)
        frames.sort((a, b) => b.size.x * b.size.y * b.size.z - a.size.x * a.size.y * a.size.z)
        if(frames[0])
            child.userData.steleFrame = frames[0]
    }
}

function steleFrame(mesh)
{
    const { size, matrix } = mesh.userData.steleFrame
    const isThinX = size.x < size.z
    return {
        width: isThinX ? size.z : size.x,
        height: size.y,
        thickness: Math.min(isThinX ? size.x : size.z, STELE.maxThickness),
        matrix: matrix.clone().multiply(new THREE.Matrix4().makeRotationY(isThinX ? Math.PI / 2 : 0)),
    }
}

function faceCard(width, height, z, isBack)
{
    const geometry = new THREE.PlaneGeometry(width, height)
    if(isBack)
        geometry.rotateY(Math.PI)
    geometry.translate(0, 0, z)
    return geometry
}

function buildStele(mesh, label, materials)
{
    const { width, height, thickness, matrix } = steleFrame(mesh)
    const body = new THREE.ExtrudeGeometry(steleOutline(width, height), { depth: thickness, bevelEnabled: false })
    body.translate(0, 0, -thickness / 2)
    body.applyMatrix4(matrix)
    mesh.geometry = body
    mesh.material = propMaterial(materials, 'basalt', { repeat: STELE.basaltRepeat })

    const parts = createParts()
    parts.box('basaltDark', [width * 0.94, height * 0.1, thickness * 0.8], { position: [0, (0.07 - 0.5) * height, 0], matrix })
    mesh.add(parts.build(materials))

    const faceSize = Math.min(width * 0.8, height * 1.2)
    const faceY = (STELE.faceHeight - 0.5) * height
    const faceMaterial = propMaterial(materials, 'steleFace')
    const labelMaterial = canvasMaterial(labelTexture(label))
    for(const isBack of [false, true])
    {
        const side = isBack ? -1 : 1
        const face = faceCard(faceSize, faceSize / 2, side * (thickness / 2 + 0.004), isBack)
        face.translate(0, faceY, 0)
        mesh.add(texturedMesh(face, faceMaterial, { name: 'steleFace', matrix, castShadow: false }))
        const text = faceCard(faceSize * 0.68, faceSize * 0.34, side * (thickness / 2 + 0.008), isBack)
        text.translate(0, faceY, 0)
        mesh.add(texturedMesh(text, labelMaterial, { name: 'steleLabel', matrix, castShadow: false }))
    }
}

export function personalizeSocialSigns(area)
{
    for(const object of area.objects.items)
    {
        const mesh = object.visual?.object3D
        const label = LABELS[mesh?.name]
        if(label && mesh.isMesh && mesh.userData.steleFrame)
            buildStele(mesh, label, area.game.materials)
    }
}

function pedestal(parts, { box }, angle)
{
    const center = box.getCenter(new THREE.Vector3())
    const height = box.max.y - box.min.y
    const span = Math.max(box.max.x - box.min.x, box.max.z - box.min.z)
    const side = span / (Math.abs(Math.cos(angle)) + Math.abs(Math.sin(angle)))
    for(const { shade, width, height: tierHeight, y } of PEDESTAL_TIERS)
        parts.box(shade, [side * width, height * tierHeight, side * width], { position: [center.x, box.min.y + height * y, center.z], rotation: [0, angle, 0] })
}

function plinth(parts, { box })
{
    const center = box.getCenter(new THREE.Vector3())
    const radius = (box.max.x - box.min.x) / 2
    const height = box.max.y - box.min.y
    parts.prism('stoneDark', radius, radius, height * 0.42, { position: [center.x, box.min.y + height * 0.21, center.z] }, 8)
    parts.prism('stone', radius * 0.86, radius * 0.9, height * 0.48, { position: [center.x, box.min.y + height * 0.66, center.z] }, 8)
    parts.prism('basalt', radius * 0.9, radius * 0.86, height * 0.1, { position: [center.x, box.min.y + height * 0.95, center.z] }, 8)
}

export function reshapeSocialPlaza(model, materials)
{
    const plaza = model.getObjectByName('Cube133')
    if(!plaza?.isMesh)
        return
    const parts = createParts()
    removeComponents(plaza, (component) =>
    {
        const { box } = component
        const width = box.max.x - box.min.x
        if(width > PLAZA.centerMinWidth)
        {
            plinth(parts, component)
            return true
        }
        if(box.max.y > PLAZA.pedestalMaxHeight)
            return false
        const center = box.getCenter(new THREE.Vector3())
        pedestal(parts, component, Math.atan2(center.x, center.z))
        return true
    })
    plaza.add(parts.build(materials))
}

