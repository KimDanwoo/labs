import { modelResource } from '../resourcesLoader'
import * as THREE from 'three/webgpu'

const ISLAND_MODELS = {
    gamepad: 'areas/island/models/gamepad.glb',
    shellFountain: 'areas/island/models/shellFountain.glb',
    lighthouse: 'areas/island/models/lighthouse.glb',
    palmHammock: 'areas/island/models/palmHammock.glb',
    surfCorner: 'areas/island/models/surfCorner.glb',
    coconutCrate: 'areas/island/models/coconutCrate.glb',
    beachBench: 'areas/island/models/beachBench.glb',
    lampPost: 'areas/island/models/lampPost.glb',
    gardenLamp: 'areas/island/models/gardenLamp.glb',
    ropeFence: 'areas/island/models/ropeFence.glb',
    surfboardStand: 'areas/island/models/surfboardStand.glb',
    linkSign: 'areas/island/models/linkSign.glb',
    rockBase: 'areas/island/models/rockBase.glb',
    guideBoard: 'areas/island/models/guideBoard.glb',
    snackShack: 'areas/island/models/snackShack.glb',
    coconut: 'areas/island/models/coconut.glb',
    surfFlag: 'areas/island/models/surfFlag.glb',
}

const resourceName = (key) => `islandModel${key[0].toUpperCase()}${key.slice(1)}`

export function islandModelResources(cacheBuster)
{
    return Object.entries(ISLAND_MODELS).map(([key, path]) => modelResource(resourceName(key), `${path}${cacheBuster}`))
}

function sourceMesh(materials, key)
{
    const source = materials.game.resources[resourceName(key)]?.scene?.getObjectByProperty('isMesh', true)
    if(!source)
        throw new Error(`섬 모델 ${key}을 불러오지 못했어요.`)
    source.updateWorldMatrix(true, false)
    return source
}

export function islandModelGeometry(materials, key, { size = null, matrix = null } = {})
{
    const source = sourceMesh(materials, key)
    const geometry = source.geometry.clone().applyMatrix4(source.matrixWorld)
    if(size)
    {
        geometry.computeBoundingBox()
        const native = geometry.boundingBox.getSize(new THREE.Vector3())
        const center = geometry.boundingBox.getCenter(new THREE.Vector3())
        geometry.translate(-center.x, -center.y, -center.z)
        geometry.scale(size.x / native.x, size.y / native.y, size.z / native.z)
    }
    if(matrix)
        geometry.applyMatrix4(matrix)
    return geometry
}

export function islandModelMesh(materials, key, matrix, size = null)
{
    const mesh = new THREE.Mesh(islandModelGeometry(materials, key, { size, matrix }), sourceMesh(materials, key).material)
    mesh.name = key
    mesh.castShadow = true
    mesh.receiveShadow = true
    return mesh
}

export function islandPaletteMaterial(materials, key)
{
    const { material } = sourceMesh(materials, key)
    return materials.getFromName(material.name, material)
}
