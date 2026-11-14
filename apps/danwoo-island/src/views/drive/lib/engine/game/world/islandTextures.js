const ISLAND_TEXTURES = {
    circuitBrand: 'areas/island/circuitBrand.png',
    circuitWebgl: 'areas/island/circuitWebgl.png',
    circuitWebgpu: 'areas/island/circuitWebgpu.png',
    circuitThreejs: 'areas/island/circuitThreejs.png',
    cookieBanner: 'areas/island/cookieBanner.png',
    projectsCarpet: 'areas/island/projectsCarpet.png',
    labCarpet: 'areas/island/labCarpet.png',
    blackboardLabels: 'areas/island/blackboardLabels.png',
    projectsLabels: 'areas/island/projectsLabels.png',
    bowlingLabelStrike: 'areas/island/bowlingLabelStrike.png',
}

const resourceName = (materialName) => `island${materialName[0].toUpperCase()}${materialName.slice(1)}Texture`

export function islandTextureResources(cacheBuster)
{
    return Object.entries(ISLAND_TEXTURES).map(([materialName, path]) => [ resourceName(materialName), `${path}${cacheBuster}`, 'texture' ])
}

function matchSampling(texture, original)
{
    texture.flipY = original.flipY
    texture.colorSpace = original.colorSpace
    texture.wrapS = original.wrapS
    texture.wrapT = original.wrapT
    texture.needsUpdate = true
    return texture
}

export function applyIslandTextures(root, resources)
{
    root.traverse((child) =>
    {
        const material = child.isMesh ? child.material : null
        if(!material?.map || !ISLAND_TEXTURES[material.name])
            return

        const replacement = resources[resourceName(material.name)]
        if(material.map !== replacement)
            material.map = matchSampling(replacement, material.map)
    })
}
