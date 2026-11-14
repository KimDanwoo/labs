import * as THREE from 'three/webgpu'
import { createParts, seededRandom } from './islandGeometry'
import { islandModelGeometry, islandPaletteMaterial } from './islandModels'

const LAMP_GLASS = 'lantern'

function modelMesh(materials, key, offset)
{
    const matrix = new THREE.Matrix4().makeTranslation(...offset)
    const mesh = new THREE.Mesh(islandModelGeometry(materials, key, { matrix }), islandPaletteMaterial(materials, key))
    mesh.castShadow = true
    mesh.receiveShadow = true
    return mesh
}

function withGlass(materials, mesh, glass)
{
    const parts = createParts()
    parts.box(LAMP_GLASS, glass.size, { position: glass.position })
    const group = parts.build(materials)
    group.getObjectByName(LAMP_GLASS).name = 'glass'
    return group.add(mesh)
}

export function createGardenLamp(materials)
{
    return withGlass(materials, modelMesh(materials, 'gardenLamp', [0, 0.12, 0]), { size: [0.28, 0.2, 0.28], position: [0, 0.33, 0] })
}

export function createLampPost(materials)
{
    return withGlass(materials, modelMesh(materials, 'lampPost', [0.305, -0.03, 0]), { size: [0.32, 0.4, 0.32], position: [0.62, 1, 0] })
}

export function createBeachBench(materials)
{
    return new THREE.Group().add(modelMesh(materials, 'beachBench', [0, -0.105, -0.015]))
}

export function createRopeFence(materials)
{
    return new THREE.Group().add(modelMesh(materials, 'ropeFence', [0, -0.42, 0]))
}

export function createCoconutCrate(materials)
{
    const upright = new THREE.Matrix4().makeRotationX(-Math.PI / 2)
    const mesh = new THREE.Mesh(islandModelGeometry(materials, 'coconutCrate', { matrix: upright }), islandPaletteMaterial(materials, 'coconutCrate'))
    mesh.castShadow = true
    mesh.receiveShadow = true
    return new THREE.Group().add(mesh)
}

export function createFieldstone(materials)
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
    return parts.build(materials)
}

