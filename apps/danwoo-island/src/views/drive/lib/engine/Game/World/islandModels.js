import * as THREE from 'three/webgpu'

const ISLAND_MODELS = {
    hareubang: 'areas/island/models/hareubang.glb',
}

const resourceName = (key) => `islandModel${key[0].toUpperCase()}${key.slice(1)}`

export function islandModelResources(cacheBuster)
{
    return Object.entries(ISLAND_MODELS).map(([key, path]) => [resourceName(key), `${path}${cacheBuster}`, 'gltf'])
}

export function islandModelMesh(materials, key, matrix)
{
    const scene = materials.game.resources[resourceName(key)]?.scene
    const source = scene?.getObjectByProperty('isMesh', true)
    if(!source)
        return null
    source.updateWorldMatrix(true, false)
    const geometry = source.geometry.clone().applyMatrix4(source.matrixWorld).applyMatrix4(matrix)
    const mesh = new THREE.Mesh(geometry, source.material)
    mesh.name = key
    mesh.castShadow = true
    mesh.receiveShadow = true
    return mesh
}
