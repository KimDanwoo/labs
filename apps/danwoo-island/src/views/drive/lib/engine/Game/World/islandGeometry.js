import * as THREE from 'three/webgpu'
import { color } from 'three/tsl'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { MeshDefaultMaterial } from '../Materials/MeshDefaultMaterial.js'

export const OCTAGON = 8
export const FULL_TURN = Math.PI * 2

export const SHADES = {
    stone: '#a39a90',
    stoneDark: '#857c74',
    wood: '#9a5b34',
    woodDark: '#6b3d24',
    twig: '#b07a45',
    silkRed: '#d6453a',
    silkBlue: '#3a56b5',
    onggi: '#5b2f1f',
    onggiLid: '#7c4127',
    fieldstone: '#9a948b',
    pillarRed: '#a5402c',
    giwa: '#55555f',
    giwaRidge: '#3c3c46',
    dancheongGreen: '#3f8a6a',
    dancheongRed: '#c8452f',
    dancheongBlue: '#3d5fae',
    thatch: '#d6a548',
    thatchRope: '#a3772c',
    hanji: '#efe2c4',
    mapGreen: '#7fb069',
    mapBlue: '#69a7c9',
    tarpOrange: '#e8742f',
    tarpLight: '#f3a35a',
    iron: '#3b3a3f',
    glass: '#bfe3ea',
    earth: '#b9956b',
    ink: '#2b2420',
    jangseungWood: '#c4895a',
    obangBlue: '#2f5fb3',
    obangRed: '#c9372c',
    obangYellow: '#e8b830',
    obangWhite: '#f2eee4',
    obangBlack: '#2a2a2e',
}

const GLOW = {
    lantern: { name: 'emissiveSeokdeungGradient', inner: '#fff1b8', outer: '#ffad3d', intensity: 1.6 },
    cheongsachorong: { name: 'emissiveCheongsachorongGradient', inner: '#ffd58a', outer: '#ff3b2f', intensity: 1.8 },
}

const SIGNAGE_FACES = new Set(['hanji', 'mapGreen', 'mapBlue', 'glass'])

const shadedMaterials = new Map()

function shadedMaterial(name)
{
    if(!shadedMaterials.has(name))
    {
        const material = new MeshDefaultMaterial({ colorNode: color(SHADES[name]), hasCoreShadows: !SIGNAGE_FACES.has(name), hasDropShadows: !SIGNAGE_FACES.has(name) })
        material.userData.prevent = true
        shadedMaterials.set(name, material)
    }
    return shadedMaterials.get(name)
}

function resolveMaterial(materials, name)
{
    const glow = GLOW[name]
    if(!glow)
        return shadedMaterial(name)
    if(!materials.list.has(glow.name))
        materials.createEmissiveGradient(glow.name, glow.inner, glow.outer, glow.intensity, true)
    return materials.list.get(glow.name)
}

export function seededRandom(seed)
{
    let state = seed
    return () =>
    {
        state = (state * 1664525 + 1013904223) % 4294967296
        return state / 4294967296
    }
}

function hipRoofGeometry(width, depth, height, ridgeRatio)
{
    const w = width / 2
    const d = depth / 2
    const r = (width * ridgeRatio) / 2
    const corners = {
        frontLeft: [-w, 0, d], frontRight: [w, 0, d], backRight: [w, 0, -d], backLeft: [-w, 0, -d],
        ridgeLeft: [-r, height, 0], ridgeRight: [r, height, 0],
    }
    const faces = [
        ['frontLeft', 'frontRight', 'ridgeRight'], ['frontLeft', 'ridgeRight', 'ridgeLeft'],
        ['backRight', 'backLeft', 'ridgeLeft'], ['backRight', 'ridgeLeft', 'ridgeRight'],
        ['frontRight', 'backRight', 'ridgeRight'],
        ['backLeft', 'frontLeft', 'ridgeLeft'],
        ['frontLeft', 'backLeft', 'backRight'], ['frontLeft', 'backRight', 'frontRight'],
    ]
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(faces.flat().flatMap((key) => corners[key]), 3))
    return geometry
}

export function createParts()
{
    const batches = new Map()

    const add = (name, geometry, { position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], matrix = null } = {}) =>
    {
        geometry.scale(...scale)
        geometry.rotateX(rotation[0])
        geometry.rotateY(rotation[1])
        geometry.rotateZ(rotation[2])
        geometry.translate(...position)
        if(matrix)
            geometry.applyMatrix4(matrix)
        const flat = geometry.index ? geometry.toNonIndexed() : geometry
        if(flat !== geometry)
            geometry.dispose()
        if(flat.hasAttribute('uv'))
            flat.deleteAttribute('uv')
        flat.computeVertexNormals()
        if(!batches.has(name))
            batches.set(name, [])
        batches.get(name).push(flat)
    }

    const box = (name, size, transform) => add(name, new THREE.BoxGeometry(...size), transform)
    const prism = (name, radiusTop, radiusBottom, height, transform, sides = OCTAGON) =>
        add(name, new THREE.CylinderGeometry(radiusTop, radiusBottom, height, sides), transform)
    const rod = (name, radius, from, to, sides = 5) =>
    {
        const start = new THREE.Vector3(...from)
        const end = new THREE.Vector3(...to)
        const geometry = new THREE.CylinderGeometry(radius, radius, start.distanceTo(end), sides)
        geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(start).normalize()))
        geometry.translate(...start.add(end).multiplyScalar(0.5).toArray())
        add(name, geometry)
    }
    const hipRoof = (name, { width, depth, height, ridgeRatio = 0.55, position }) =>
        add(name, hipRoofGeometry(width, depth, height, ridgeRatio), { position })

    const build = (materials, matrix = new THREE.Matrix4()) =>
    {
        const group = new THREE.Group()
        for(const [name, geometries] of batches)
        {
            const mesh = new THREE.Mesh(mergeGeometries(geometries), resolveMaterial(materials, name))
            for(const geometry of geometries)
                geometry.dispose()
            mesh.name = name
            mesh.castShadow = true
            mesh.receiveShadow = true
            mesh.matrixAutoUpdate = false
            mesh.matrix.copy(matrix)
            group.add(mesh)
        }
        return group
    }

    return { add, box, prism, rod, hipRoof, build }
}
