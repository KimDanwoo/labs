import * as THREE from 'three/webgpu'
import { color } from 'three/tsl'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { MeshDefaultMaterial } from '../Materials/MeshDefaultMaterial.js'

const OCTAGON = 8
const FULL_TURN = Math.PI * 2

const SHADES = {
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
}

const GLOW = {
    lantern: { name: 'emissiveSeokdeungGradient', inner: '#fff1b8', outer: '#ffad3d', intensity: 1.6 },
    cheongsachorong: { name: 'emissiveCheongsachorongGradient', inner: '#ffd58a', outer: '#ff3b2f', intensity: 1.8 },
}

function shadedMaterial(shade)
{
    const material = new MeshDefaultMaterial({ colorNode: color(shade), hasCoreShadows: true, hasDropShadows: true })
    material.userData.prevent = true
    return material
}

function seededRandom(seed)
{
    let state = seed
    return () =>
    {
        state = (state * 1664525 + 1013904223) % 4294967296
        return state / 4294967296
    }
}

function createParts()
{
    const batches = new Map()

    const add = (name, geometry, { position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1] } = {}) =>
    {
        geometry.scale(...scale)
        geometry.rotateX(rotation[0])
        geometry.rotateY(rotation[1])
        geometry.rotateZ(rotation[2])
        geometry.translate(...position)
        const flat = geometry.index ? geometry.toNonIndexed() : geometry
        if(flat !== geometry)
            geometry.dispose()
        flat.deleteAttribute('uv')
        flat.computeVertexNormals()
        if(!batches.has(name))
            batches.set(name, [])
        batches.get(name).push(flat)
    }

    const box = (name, size, transform) => add(name, new THREE.BoxGeometry(...size), transform)
    const prism = (name, radiusTop, radiusBottom, height, transform, sides = OCTAGON) =>
        add(name, new THREE.CylinderGeometry(radiusTop, radiusBottom, height, sides), transform)
    const rod = (name, radius, from, to) =>
    {
        const start = new THREE.Vector3(...from)
        const end = new THREE.Vector3(...to)
        const length = start.distanceTo(end)
        const geometry = new THREE.CylinderGeometry(radius, radius, length, 5)
        geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(start).normalize()))
        geometry.translate(...start.add(end).multiplyScalar(0.5).toArray())
        add(name, geometry)
    }

    const build = (materialFor, template) =>
    {
        const group = new THREE.Group()
        for(const [name, geometries] of batches)
        {
            const mesh = new THREE.Mesh(mergeGeometries(geometries), materialFor(name))
            for(const geometry of geometries)
                geometry.dispose()
            mesh.name = name
            mesh.castShadow = true
            mesh.receiveShadow = true
            mesh.matrixAutoUpdate = false
            mesh.matrix.copy(template.matrix)
            group.add(mesh)
        }
        return group
    }

    return { add, box, prism, rod, build }
}

function materialResolver(materials, shadeByPart)
{
    const cache = new Map()
    return (name) =>
    {
        const glow = GLOW[name]
        if(glow)
        {
            if(!materials.list.has(glow.name))
                materials.createEmissiveGradient(glow.name, glow.inner, glow.outer, glow.intensity, true)
            return materials.list.get(glow.name)
        }
        if(!cache.has(name))
            cache.set(name, shadedMaterial(shadeByPart[name]))
        return cache.get(name)
    }
}

function prepareTemplate(template)
{
    template.updateMatrix()
    return template
}

export function createStoneLantern(materials, template)
{
    const parts = createParts()
    parts.prism('stone', 0.44, 0.46, 0.1, { position: [0, -0.46, 0] })
    parts.prism('stone', 0.3, 0.4, 0.14, { position: [0, -0.34, 0] })
    for(let index = 0; index < OCTAGON; index++)
    {
        const angle = (index / OCTAGON) * FULL_TURN
        parts.add('stone', new THREE.SphereGeometry(1, 4, 3), {
            position: [Math.cos(angle) * 0.32, -0.27, Math.sin(angle) * 0.32],
            rotation: [0, -angle, 0],
            scale: [0.07, 0.11, 0.1],
        })
    }
    parts.prism('stone', 0.1, 0.12, 0.42, { position: [0, -0.06, 0] })
    parts.prism('stone', 0.24, 0.2, 0.07, { position: [0, 0.18, 0] })
    for(let index = 0; index < 4; index++)
    {
        const angle = (index / 4) * FULL_TURN + Math.PI / 4
        parts.box('stone', [0.08, 0.24, 0.08], { position: [Math.cos(angle) * 0.17, 0.33, Math.sin(angle) * 0.17], rotation: [0, -angle, 0] })
    }
    parts.prism('lantern', 0.15, 0.15, 0.22, { position: [0, 0.33, 0] })
    parts.prism('stoneDark', 0.38, 0.4, 0.04, { position: [0, 0.47, 0] })
    parts.prism('stone', 0.1, 0.36, 0.13, { position: [0, 0.55, 0] })
    parts.prism('stone', 0.05, 0.07, 0.05, { position: [0, 0.63, 0] })
    parts.add('stone', new THREE.IcosahedronGeometry(0.065, 0), { position: [0, 0.69, 0] })
    return parts.build(materialResolver(materials, SHADES), prepareTemplate(template))
}

export function createLanternPole(materials, template)
{
    const lanternX = 0.62
    const parts = createParts()
    parts.box('woodDark', [0.4, 0.28, 0.4], { position: [0, -1.64, 0] })
    parts.box('wood', [0.2, 3.36, 0.2], { position: [0, -0.1, 0] })
    parts.box('wood', [0.26, 0.12, 0.26], { position: [0, 1.66, 0] })
    parts.box('wood', [0.8, 0.11, 0.12], { position: [0.36, 1.48, 0] })
    parts.rod('wood', 0.04, [0.05, 1.05, 0], [0.42, 1.44, 0])
    parts.rod('woodDark', 0.012, [lanternX, 1.43, 0], [lanternX, 1.3, 0])
    parts.box('woodDark', [0.38, 0.05, 0.38], { position: [lanternX, 1.28, 0] })
    parts.box('silkRed', [0.32, 0.3, 0.32], { position: [lanternX, 1.11, 0] })
    parts.box('silkBlue', [0.32, 0.2, 0.32], { position: [lanternX, 0.86, 0] })
    parts.box('woodDark', [0.38, 0.05, 0.38], { position: [lanternX, 0.74, 0] })
    parts.rod('silkRed', 0.02, [lanternX, 0.72, 0], [lanternX, 0.56, 0])
    parts.box('cheongsachorong', [0.34, 0.31, 0.34], { position: [lanternX, 1.11, 0] })
    const group = parts.build(materialResolver(materials, SHADES), prepareTemplate(template))
    group.getObjectByName('cheongsachorong').name = 'glass'
    return group
}

export function createPyeongsang(materials, template)
{
    const parts = createParts()
    const legX = 1.12
    const legZ = 0.82
    for(const x of [-legX, legX])
        for(const z of [-legZ, legZ])
            parts.box('woodDark', [0.2, 0.56, 0.2], { position: [x, -0.43, z] })
    parts.box('woodDark', [2.5, 0.12, 0.14], { position: [0, -0.2, legZ] })
    parts.box('woodDark', [2.5, 0.12, 0.14], { position: [0, -0.2, -legZ] })
    for(let index = 0; index < 5; index++)
        parts.box('wood', [2.56, 0.12, 0.36], { position: [0, -0.08, -0.78 + index * 0.39] })
    const railY = 0.28
    for(const x of [-1.16, -0.4, 0.4, 1.16])
        parts.box('woodDark', [0.1, 0.62, 0.1], { position: [x, 0.17, -0.94] })
    parts.box('wood', [2.44, 0.08, 0.1], { position: [0, railY + 0.18, -0.94] })
    parts.box('wood', [2.44, 0.06, 0.08], { position: [0, railY - 0.08, -0.94] })
    for(const z of [-0.3, 0.4])
        parts.box('woodDark', [0.1, 0.62, 0.1], { position: [-1.2, 0.17, z] })
    parts.box('wood', [0.1, 0.08, 1.9], { position: [-1.2, railY + 0.18, -0.05] })
    parts.box('wood', [0.08, 0.06, 1.9], { position: [-1.2, railY - 0.08, -0.05] })
    return parts.build(materialResolver(materials, SHADES), prepareTemplate(template))
}

export function createBrushwoodFence(materials, template)
{
    const random = seededRandom(7)
    const parts = createParts()
    for(const x of [-1.04, 1.04])
        parts.prism('woodDark', 0.08, 0.09, 1.26, { position: [x, -0.42, 0] }, 6)
    for(const y of [-0.72, -0.38, -0.06])
        parts.rod('wood', 0.03, [-1.04, y, 0.05], [1.04, y + (random() - 0.5) * 0.05, 0.05])
    const twigCount = 15
    for(let index = 0; index < twigCount; index++)
    {
        const x = -0.92 + (index / (twigCount - 1)) * 1.84
        const lean = (random() - 0.5) * 0.12
        const top = 0.06 + random() * 0.12
        const z = index % 2 === 0 ? 0.02 : -0.03
        parts.rod('twig', 0.02, [x, -0.98, z], [x + lean, top, z])
    }
    return parts.build(materialResolver(materials, SHADES), prepareTemplate(template))
}

export function createOnggi(materials, template)
{
    const profile = [
        [0.0, -0.55],
        [0.34, -0.55],
        [0.46, -0.4],
        [0.55, -0.12],
        [0.54, 0.12],
        [0.44, 0.32],
        [0.3, 0.42],
        [0.28, 0.46],
        [0.0, 0.46],
    ].map(([x, y]) => new THREE.Vector2(x, y))
    const parts = createParts()
    parts.add('onggi', new THREE.LatheGeometry(profile, 10))
    parts.prism('onggiLid', 0.26, 0.33, 0.07, { position: [0, 0.5, 0] }, 10)
    parts.prism('onggiLid', 0.06, 0.08, 0.06, { position: [0, 0.56, 0] }, 6)
    return parts.build(materialResolver(materials, SHADES), prepareTemplate(template))
}

export function createFieldstone(materials, template)
{
    const random = seededRandom(11)
    const geometry = new THREE.IcosahedronGeometry(1, 1)
    const position = geometry.attributes.position
    const jitterByVertex = new Map()
    for(let index = 0; index < position.count; index++)
    {
        const key = `${position.getX(index).toFixed(3)},${position.getY(index).toFixed(3)},${position.getZ(index).toFixed(3)}`
        if(!jitterByVertex.has(key))
            jitterByVertex.set(key, 0.86 + random() * 0.22)
        const jitter = jitterByVertex.get(key)
        position.setXYZ(index, position.getX(index) * jitter, position.getY(index) * jitter, position.getZ(index) * jitter)
    }
    const parts = createParts()
    parts.add('fieldstone', geometry, { scale: [0.68, 0.37, 0.82] })
    return parts.build(materialResolver(materials, SHADES), prepareTemplate(template))
}

