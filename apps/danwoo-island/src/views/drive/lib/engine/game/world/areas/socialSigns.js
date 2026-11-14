import * as THREE from 'three/webgpu'
import { removeComponents } from '../islandGeometry'
import { islandModelGeometry, islandModelMesh, islandPaletteMaterial } from '../islandModels'
import { canvasMaterial, texturedMesh } from '../islandTextured'

const LABELS = {
    x: 'LAB', bluesky001: '✦', youtube: 'MUSIC', mail: '이력서',
    twitch: '블로그', gitHub: 'CODE', linkedIn: '⌘', discord: '∞',
    onlyfans: '바람',
}

const STELE = { maxThickness: 0.3, labelHeight: 0.58 }
const PLAZA = { pedestalMaxHeight: 0.6, centerMinWidth: 2.5 }

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

function labelCard(width, height, z, isBack)
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
    mesh.geometry = islandModelGeometry(materials, 'linkSign', { size: new THREE.Vector3(width, height, thickness), matrix })
    mesh.material = islandPaletteMaterial(materials, 'linkSign')
    const textSize = Math.min(width * 0.8, height * 1.2)
    const labelMaterial = canvasMaterial(labelTexture(label))
    for(const isBack of [false, true])
    {
        const text = labelCard(textSize * 0.68, textSize * 0.34, (isBack ? -1 : 1) * (thickness / 2 + 0.006), isBack)
        text.translate(0, (STELE.labelHeight - 0.5) * height, 0)
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

function pedestalMesh(materials, { box }, angle)
{
    const center = box.getCenter(new THREE.Vector3())
    const height = box.max.y - box.min.y
    const span = Math.max(box.max.x - box.min.x, box.max.z - box.min.z)
    const side = span / (Math.abs(Math.cos(angle)) + Math.abs(Math.sin(angle)))
    const matrix = new THREE.Matrix4().makeTranslation(center.x, center.y, center.z).multiply(new THREE.Matrix4().makeRotationY(angle))
    return islandModelMesh(materials, 'rockBase', matrix, new THREE.Vector3(side, height, side))
}

export function reshapeSocialPlaza(model, materials)
{
    const plaza = model.getObjectByName('Cube133')
    if(!plaza?.isMesh)
        return
    const pedestals = []
    removeComponents(plaza, (component) =>
    {
        const { box } = component
        const isPlinth = box.max.x - box.min.x > PLAZA.centerMinWidth
        if(!isPlinth && box.max.y > PLAZA.pedestalMaxHeight)
            return false
        const center = box.getCenter(new THREE.Vector3())
        pedestals.push(pedestalMesh(materials, component, isPlinth ? 0 : Math.atan2(center.x, center.z)))
        return true
    })
    plaza.add(...pedestals)
}
