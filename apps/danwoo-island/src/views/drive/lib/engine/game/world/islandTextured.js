import * as THREE from 'three/webgpu'
import { texture, uv } from 'three/tsl'
import { MeshDefaultMaterial } from '../materials/meshDefaultMaterial'

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
