import * as THREE from 'three/webgpu'
import { texture, uv, vec2 } from 'three/tsl'
import { MeshDefaultMaterial } from '../Materials/MeshDefaultMaterial.js'

const PROP_TEXTURES = {
    yutBoard: { path: 'areas/island/props/yutBoard.webp' },
    jangseungHeaven: { path: 'areas/island/props/jangseungHeaven.webp' },
    jangseungEarth: { path: 'areas/island/props/jangseungEarth.webp' },
    hareubangFront: { path: 'areas/island/props/hareubangFront.webp' },
    basalt: { path: 'areas/island/props/basaltTile.webp', isRepeating: true },
    steleFace: { path: 'areas/island/props/steleFace.webp' },
    haetaeFront: { path: 'areas/island/props/haetaeFront.webp' },
    dongjaseokFront: { path: 'areas/island/props/dongjaseokFront.webp' },
    jindoFront: { path: 'areas/island/props/jindoFront.webp' },
}

const resourceName = (key) => `prop${key[0].toUpperCase()}${key.slice(1)}Texture`

export function propTextureResources(cacheBuster)
{
    return Object.entries(PROP_TEXTURES).map(([key, { path, isRepeating }]) => [
        resourceName(key),
        `${path}${cacheBuster}`,
        'texture',
        (resource) =>
        {
            resource.colorSpace = THREE.SRGBColorSpace
            if(isRepeating)
            {
                resource.wrapS = THREE.RepeatWrapping
                resource.wrapT = THREE.RepeatWrapping
            }
        },
    ])
}

const materialCache = new Map()

export function propMaterial(materials, key, { repeat = [1, 1], hasAlpha = false } = {})
{
    const cacheKey = `${key}:${repeat.join('x')}:${hasAlpha}`
    if(materialCache.has(cacheKey))
        return materialCache.get(cacheKey)
    const map = materials.game.resources[resourceName(key)]
    const sample = texture(map, uv().mul(vec2(...repeat)))
    const material = new MeshDefaultMaterial({ colorNode: sample.rgb, ...(hasAlpha ? { alphaNode: sample.a } : {}) })
    material.userData.prevent = true
    materialCache.set(cacheKey, material)
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

export function curvedPatchGeometry({ radiusAt, thetaHalf, bottom, top, lift = 0, columns = 8, rows = 6 })
{
    const positions = []
    const uvs = []
    for(let row = 0; row <= rows; row++)
    {
        const v = row / rows
        const y = bottom + (top - bottom) * v
        const radius = radiusAt(y) + lift
        for(let column = 0; column <= columns; column++)
        {
            const u = column / columns
            const theta = -thetaHalf + u * thetaHalf * 2
            positions.push(radius * Math.sin(theta), y, radius * Math.cos(theta))
            uvs.push(u, v)
        }
    }
    const indices = []
    for(let row = 0; row < rows; row++)
        for(let column = 0; column < columns; column++)
        {
            const a = row * (columns + 1) + column
            const b = a + columns + 1
            indices.push(a, a + 1, b, a + 1, b + 1, b)
        }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    geometry.setIndex(indices)
    return geometry
}

export function profileRadius(profile)
{
    return (y) =>
    {
        const upper = profile.findIndex(([, py]) => py >= y)
        if(upper <= 0)
            return profile[Math.max(upper, 0)][0]
        const [r0, y0] = profile[upper - 1]
        const [r1, y1] = profile[upper]
        return r0 + ((r1 - r0) * (y - y0)) / Math.max(y1 - y0, 1e-6)
    }
}

export function projectFrontUV(geometry, { left, right, bottom, top })
{
    const position = geometry.attributes.position
    const uvs = new Float32Array(position.count * 2)
    for(let index = 0; index < position.count; index++)
    {
        uvs[index * 2] = (position.getX(index) - left) / (right - left)
        uvs[index * 2 + 1] = (position.getY(index) - bottom) / (top - bottom)
    }
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
    return geometry
}
