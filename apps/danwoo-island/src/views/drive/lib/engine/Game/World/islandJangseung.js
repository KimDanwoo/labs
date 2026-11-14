import * as THREE from 'three/webgpu'
import { texture } from 'three/tsl'
import { MeshDefaultMaterial } from '../Materials/MeshDefaultMaterial.js'

export const GENERALS = {
    heaven: { inscription: '天下大將軍', isMale: true },
    earth: { inscription: '地下女將軍', isMale: false },
}

const BODY_PROFILE = [[1.12, 0], [1, 0.06], [0.9, 0.45], [0.82, 0.58], [0.86, 0.61], [1.24, 0.66], [1.3, 0.8], [1.2, 0.93], [0.74, 0.99], [0, 1]]
const NECK_BAND = { y: 0.6, radius: 0.86 }
const FACE = { y: 0.8, depth: 1.2 }
const INSCRIPTION = { top: 0.56, bottom: 0.12, width: 0.62, canvas: [128, 640] }

const inscriptionTextures = new Map()

function inscriptionTexture(text)
{
    if(inscriptionTextures.has(text))
        return inscriptionTextures.get(text)
    const [width, height] = INSCRIPTION.canvas
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    context.fillStyle = '#d8a574'
    context.fillRect(0, 0, width, height)
    context.strokeStyle = '#3a2418'
    context.lineWidth = 6
    context.strokeRect(8, 8, width - 16, height - 16)
    context.fillStyle = '#2b1a12'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.font = `700 ${width * 0.72}px serif`
    const step = (height - 40) / text.length
    Array.from(text).forEach((character, index) => context.fillText(character, width / 2, 20 + step * (index + 0.5)))
    const canvasTexture = new THREE.CanvasTexture(canvas)
    canvasTexture.colorSpace = THREE.SRGBColorSpace
    inscriptionTextures.set(text, canvasTexture)
    return canvasTexture
}

function inscriptionPlate(radius, height, text, matrix)
{
    const plateHeight = (INSCRIPTION.top - INSCRIPTION.bottom) * height
    const geometry = new THREE.PlaneGeometry(radius * INSCRIPTION.width, plateHeight)
    geometry.translate(0, (INSCRIPTION.top + INSCRIPTION.bottom) * height * 0.5, radius * 0.99)
    geometry.applyMatrix4(matrix)
    const material = new MeshDefaultMaterial({ colorNode: texture(inscriptionTexture(text)).rgb, hasCoreShadows: true, hasDropShadows: false })
    material.userData.prevent = true
    const mesh = new THREE.Mesh(geometry, material)
    mesh.name = 'jangseungInscription'
    mesh.receiveShadow = true
    return mesh
}

function eyes(parts, radius, faceY, front, matrix, isMale)
{
    for(const side of [-1, 1])
    {
        const x = side * radius * 0.42
        parts.add('obangWhite', new THREE.SphereGeometry(radius * 0.22, 10, 8), { position: [x, faceY + radius * 0.1, front - radius * 0.05], scale: [1, 0.85, 0.7], matrix })
        parts.add('ink', new THREE.SphereGeometry(radius * 0.1, 8, 6), { position: [x + side * radius * 0.02, faceY + radius * 0.08, front + radius * 0.1], matrix })
        const browLift = isMale ? radius * 0.18 : radius * 0.04
        parts.rod('ink', radius * 0.06, new THREE.Vector3(side * radius * 0.16, faceY + radius * 0.34, front).applyMatrix4(matrix).toArray(), new THREE.Vector3(side * radius * 0.72, faceY + radius * 0.34 + browLift, front - radius * 0.12).applyMatrix4(matrix).toArray(), 5)
    }
}

function mouth(parts, radius, faceY, front, matrix, isMale)
{
    const mouthY = faceY - radius * 0.62
    parts.add('woodDark', new THREE.SphereGeometry(radius * 0.24, 8, 6), { position: [0, faceY - radius * 0.2, front + radius * 0.06], scale: [0.9, 1.3, 1], matrix })
    parts.box('ink', [radius * 0.95, radius * 0.26, radius * 0.12], { position: [0, mouthY, front], matrix })
    for(let index = 0; index < 5; index++)
        parts.box('obangWhite', [radius * 0.14, radius * 0.1, radius * 0.05], { position: [(index - 2) * radius * 0.17, mouthY + radius * 0.07, front + radius * 0.06], matrix })
    if(isMale)
        for(const side of [-1, 1])
            parts.add('obangWhite', new THREE.ConeGeometry(radius * 0.06, radius * 0.22, 5), { position: [side * radius * 0.36, mouthY + radius * 0.08, front + radius * 0.07], matrix })
    else
        parts.box('obangRed', [radius * 0.6, radius * 0.06, radius * 0.05], { position: [0, mouthY - radius * 0.14, front + radius * 0.04], matrix })
}

function cheeks(parts, radius, faceY, front, matrix)
{
    for(const side of [-1, 1])
        parts.prism('obangRed', radius * 0.14, radius * 0.14, radius * 0.04, { position: [side * radius * 0.7, faceY - radius * 0.3, front - radius * 0.22], rotation: [Math.PI / 2, 0, side * 0.5], matrix }, 10)
}

function beard(parts, radius, faceY, front, matrix)
{
    for(let index = 0; index < 5; index++)
    {
        const x = (index - 2) * radius * 0.16
        parts.rod('ink', radius * 0.03, new THREE.Vector3(x, faceY - radius * 0.8, front - radius * 0.02).applyMatrix4(matrix).toArray(), new THREE.Vector3(x * 1.2, faceY - radius * 1.35, front - radius * 0.1).applyMatrix4(matrix).toArray(), 4)
    }
}

function samo(parts, radius, top, matrix)
{
    parts.prism('ink', radius * 0.78, radius * 0.86, radius * 0.5, { position: [0, top + radius * 0.2, 0], matrix }, 12)
    parts.add('ink', new THREE.SphereGeometry(radius * 0.5, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), { position: [0, top + radius * 0.42, -radius * 0.2], matrix })
    for(const side of [-1, 1])
        parts.box('ink', [radius * 0.75, radius * 0.24, radius * 0.04], { position: [side * radius * 1.05, top + radius * 0.4, -radius * 0.25], rotation: [0, 0, side * 0.12], matrix })
}

function hairBun(parts, radius, top, matrix)
{
    parts.add('ink', new THREE.SphereGeometry(radius * 0.92, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), { position: [0, top - radius * 0.32, -radius * 0.08], scale: [1.08, 0.7, 1.08], matrix })
    parts.add('ink', new THREE.SphereGeometry(radius * 0.32, 8, 6), { position: [0, top - radius * 0.05, -radius * 0.9], matrix })
    parts.rod('obangYellow', radius * 0.04, new THREE.Vector3(-radius * 0.55, top, -radius * 0.9).applyMatrix4(matrix).toArray(), new THREE.Vector3(radius * 0.55, top - radius * 0.1, -radius * 0.9).applyMatrix4(matrix).toArray(), 5)
}

export function jangseungFigure(parts, { height, radius, bottom = 0, matrix = new THREE.Matrix4(), general = GENERALS.heaven })
{
    const local = new THREE.Matrix4().makeTranslation(0, bottom, 0).premultiply(matrix)
    const profile = BODY_PROFILE.map(([r, y]) => new THREE.Vector2(r * radius, y * height))
    parts.add('jangseungWood', new THREE.LatheGeometry(profile, 14), { matrix: local })
    parts.add('woodDark', new THREE.TorusGeometry(radius * NECK_BAND.radius, radius * 0.07, 4, 14), { position: [0, NECK_BAND.y * height, 0], rotation: [Math.PI / 2, 0, 0], matrix: local })
    const faceY = FACE.y * height
    const front = radius * FACE.depth
    eyes(parts, radius, faceY, front, local, general.isMale)
    mouth(parts, radius, faceY, front, local, general.isMale)
    if(general.isMale)
    {
        cheeks(parts, radius, faceY, front, local)
        beard(parts, radius, faceY, front, local)
        samo(parts, radius, height, local)
    }
    else
        hairBun(parts, radius, height, local)
    return inscriptionPlate(radius, height, general.inscription, local)
}
