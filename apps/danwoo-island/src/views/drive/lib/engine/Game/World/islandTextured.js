import * as THREE from 'three/webgpu'
import { texture, uv } from 'three/tsl'
import { MeshDefaultMaterial } from '../Materials/MeshDefaultMaterial.js'

const PROP_TEXTURES = {
    yutBoard: { path: 'areas/island/props/yutBoard.webp' },
}

const resourceName = (key) => `prop${key[0].toUpperCase()}${key.slice(1)}Texture`

export function propTextureResources(cacheBuster)
{
    return Object.entries(PROP_TEXTURES).map(([key, { path }]) => [
        resourceName(key),
        `${path}${cacheBuster}`,
        'texture',
        (resource) => { resource.colorSpace = THREE.SRGBColorSpace },
    ])
}

const materialCache = new Map()

export function propMaterial(materials, key)
{
    if(materialCache.has(key))
        return materialCache.get(key)
    const material = new MeshDefaultMaterial({ colorNode: texture(materials.game.resources[resourceName(key)], uv()).rgb })
    material.userData.prevent = true
    materialCache.set(key, material)
    return material
}

export function canvasMaterial(canvasTexture)
{
    const sample = texture(canvasTexture, uv())
    const material = new MeshDefaultMaterial({ colorNode: sample.rgb, alphaNode: sample.a, hasDropShadows: false })
    material.userData.prevent = true
    return material
}

export function texturedMesh(geometry, material, { name, matrix = null, castShadow = true } = {})
{
    if(matrix)
        geometry.applyMatrix4(matrix)
    geometry.computeVertexNormals()
    const mesh = new THREE.Mesh(geometry, material)
    mesh.name = name ?? 'textured'
    mesh.castShadow = castShadow
    mesh.userData.preventShadow = !castShadow
    mesh.receiveShadow = true
    return mesh
}
