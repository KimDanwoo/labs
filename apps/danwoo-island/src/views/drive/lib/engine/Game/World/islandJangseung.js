import * as THREE from 'three/webgpu'
import { canvasMaterial, curvedPatchGeometry, profileRadius, propMaterial, texturedMesh } from './islandTextured.js'

export const GENERALS = {
    heaven: { inscription: '天下大將軍', face: 'jangseungHeaven', isMale: true },
    earth: { inscription: '地下女將軍', face: 'jangseungEarth', isMale: false },
}

const LOG_PROFILE = [[0, 0], [0.88, 0], [0.96, 0.03], [0.91, 0.27], [0.86, 0.6], [0.94, 0.65], [1, 0.72], [0.98, 0.86], [0.9, 0.92], [0.8, 0.95], [0, 0.95]]
const EARTH_CROWN = [[0.9, 0.94], [0.78, 0.98], [0, 0.995]]
const LOG_SIDES = 24
const LOG_TOP = 0.94
const NOSE = { width: 0.15, height: 0.055, depth: 0.12, t: 0.78, margin: 0.005 }
const FACE = { t: 0.79, halfAngle: (50 * Math.PI) / 180, lift: 0.004 }
const INSCRIPTION = { t: 0.35, widthRatio: 0.61, heightRatio: 0.4, lift: 0.004, canvas: [128, 640] }

const inscriptionMaterials = new Map()

function inscriptionMaterial(text)
{
    if(inscriptionMaterials.has(text))
        return inscriptionMaterials.get(text)
    const [width, height] = INSCRIPTION.canvas
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    context.fillStyle = '#2b1a12'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.font = `700 ${width * 0.78}px serif`
    const step = height / text.length
    Array.from(text).forEach((character, index) => context.fillText(character, width / 2, step * (index + 0.5)))
    const canvasTexture = new THREE.CanvasTexture(canvas)
    canvasTexture.colorSpace = THREE.SRGBColorSpace
    const material = canvasMaterial(canvasTexture)
    inscriptionMaterials.set(text, material)
    return material
}

function lathe(profile, radius, height)
{
    return new THREE.LatheGeometry(profile.map(([r, t]) => new THREE.Vector2(r * radius, t * height)), LOG_SIDES)
}

export function jangseungFigure(parts, materials, { height, radius, halfDepth = radius / 0.92, bottom = 0, matrix = new THREE.Matrix4(), general = GENERALS.heaven })
{
    const local = new THREE.Matrix4().makeTranslation(0, bottom, 0).premultiply(matrix)
    parts.add('jangseungWood', lathe(LOG_PROFILE, radius, height), { matrix: local })
    const width = 2 * halfDepth
    const noseDepth = NOSE.depth * width
    const noseZ = Math.min(radius * 1.02, halfDepth - noseDepth / 2 - NOSE.margin)
    parts.box('woodDark', [NOSE.width * width, NOSE.height * height, noseDepth], { position: [0, NOSE.t * height, noseZ], matrix: local })
    if(general.isMale)
        parts.prism('woodDark', 0.9 * radius, 0.9 * radius, 0.04 * height, { position: [0, 0.96 * height, 0], matrix: local }, LOG_SIDES)
    else
        parts.add('jangseungWood', lathe(EARTH_CROWN, radius, height), { matrix: local })

    const radiusAt = profileRadius(LOG_PROFILE.map(([r, t]) => [r * radius, t * height]))
    const faceY = FACE.t * height
    const faceTop = Math.min(faceY + FACE.halfAngle * radiusAt(faceY), LOG_TOP * height)
    const faceSize = 2 * (faceTop - faceY)
    const face = curvedPatchGeometry({ radiusAt, thetaHalf: FACE.halfAngle, bottom: faceY - faceSize / 2, top: faceTop, lift: FACE.lift, columns: 12 })
    const inscriptionWidth = INSCRIPTION.widthRatio * radius
    const inscriptionY = INSCRIPTION.t * height
    const inscriptionHalf = INSCRIPTION.heightRatio * height / 2
    const inscription = curvedPatchGeometry({ radiusAt, thetaHalf: inscriptionWidth / (2 * radiusAt(inscriptionY)), bottom: inscriptionY - inscriptionHalf, top: inscriptionY + inscriptionHalf, lift: INSCRIPTION.lift, columns: 3, rows: 10 })
    return [
        texturedMesh(face, propMaterial(materials, general.face), { name: 'jangseungFace', matrix: local, castShadow: false }),
        texturedMesh(inscription, inscriptionMaterial(general.inscription), { name: 'jangseungInscription', matrix: local, castShadow: false }),
    ]
}
