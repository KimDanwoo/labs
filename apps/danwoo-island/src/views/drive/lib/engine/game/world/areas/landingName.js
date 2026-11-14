import * as THREE from 'three/webgpu'

const NAME = 'DANWOO KIM'
const LETTER_GAP = 0.16
const WORD_GAP = 0.5
const BEVEL = 0.012

const POLYGONS = {
    A: [[0, 0], [0.32, 1], [0.62, 1], [0.94, 0], [0.69, 0], [0.63, 0.23], [0.31, 0.23], [0.25, 0]],
    N: [[0, 0], [0, 1], [0.24, 1], [0.65, 0.38], [0.65, 1], [0.89, 1], [0.89, 0], [0.65, 0], [0.24, 0.62], [0.24, 0]],
    W: [[0, 1], [0.25, 1], [0.42, 0.32], [0.58, 1], [0.81, 1], [0.97, 0.32], [1.14, 1], [1.39, 1], [1.1, 0], [0.85, 0], [0.695, 0.62], [0.54, 0], [0.29, 0]],
    K: [[0, 0], [0, 1], [0.24, 1], [0.24, 0.59], [0.6, 1], [0.9, 1], [0.48, 0.52], [0.93, 0], [0.62, 0], [0.3, 0.38], [0.24, 0.31], [0.24, 0]],
    I: [[0, 0], [0, 1], [0.25, 1], [0.25, 0]],
    M: [[0, 0], [0, 1], [0.26, 1], [0.53, 0.52], [0.8, 1], [1.06, 1], [1.06, 0], [0.82, 0], [0.82, 0.6], [0.59, 0.2], [0.47, 0.2], [0.24, 0.6], [0.24, 0]],
}

function polygon(points)
{
    return new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)))
}

function roundedLetter(character)
{
    const shape = new THREE.Shape()
    const hole = new THREE.Path()
    if(character === 'D')
    {
        shape.moveTo(0, 0)
        shape.lineTo(0, 1)
        shape.lineTo(0.4, 1)
        shape.bezierCurveTo(0.77, 1, 0.94, 0.82, 0.94, 0.5)
        shape.bezierCurveTo(0.94, 0.18, 0.77, 0, 0.4, 0)
        shape.closePath()
        hole.moveTo(0.24, 0.22)
        hole.lineTo(0.4, 0.22)
        hole.bezierCurveTo(0.6, 0.22, 0.69, 0.31, 0.69, 0.5)
        hole.bezierCurveTo(0.69, 0.69, 0.6, 0.78, 0.4, 0.78)
        hole.lineTo(0.24, 0.78)
        hole.closePath()
    }
    else
    {
        shape.absellipse(0.475, 0.5, 0.475, 0.5, 0, Math.PI * 2, false)
        hole.absellipse(0.475, 0.5, 0.225, 0.28, 0, Math.PI * 2, true)
    }
    shape.holes.push(hole)
    return shape
}

function letterGeometry(character, dimensions)
{
    const shape = POLYGONS[character] ? polygon(POLYGONS[character]) : roundedLetter(character)
    if(character === 'A')
        shape.holes.push(polygon([[0.37, 0.44], [0.57, 0.44], [0.47, 0.78]]))
    const heightScale = dimensions.y / (1 + BEVEL * 2)
    const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: dimensions.z / heightScale - BEVEL * 2,
        steps: 1,
        curveSegments: 8,
        bevelEnabled: true,
        bevelSize: BEVEL,
        bevelThickness: BEVEL,
        bevelSegments: 2,
    })
    geometry.scale(heightScale, heightScale, heightScale)
    geometry.center()
    return geometry
}

export function replaceLandingName(model)
{
    const originals = model.children.filter(child => /^refLettersPhysicalDynamic/.test(child.name))
    if(originals.length === 0)
        throw new Error('출발 구역의 글자 기준 모델이 없습니다.')

    const template = originals[0]
    const dimensions = template.children.find(child => /^cuboid/.test(child.name)).scale.clone()
    const direction = new THREE.Vector3(1, 0, 0).applyQuaternion(template.quaternion)
    originals.sort((a, b) => a.position.dot(direction) - b.position.dot(direction))
    const first = originals[0]
    const last = originals[originals.length - 1]
    const firstWidth = first.children.find(child => /^cuboid/.test(child.name)).scale.x
    const lastWidth = last.children.find(child => /^cuboid/.test(child.name)).scale.x
    const span = last.position.clone().sub(first.position).dot(direction) + (firstWidth + lastWidth) / 2
    const start = first.position.clone().addScaledVector(direction, -firstWidth / 2)
    const paletteUv = template.geometry.attributes.uv
    const letters = [...NAME].map(character => {
        if(character === ' ')
            return { width: WORD_GAP * dimensions.y }
        const geometry = letterGeometry(character, dimensions)
        const size = geometry.boundingBox.getSize(new THREE.Vector3())
        const uv = geometry.attributes.uv
        for(let index = 0; index < uv.count; index++)
            uv.setXY(index, paletteUv.getX(0), paletteUv.getY(0))
        return { character, geometry, width: size.x, size }
    })
    const gap = LETTER_GAP * dimensions.y
    const totalWidth = letters.reduce((total, letter) => total + letter.width, 0) + gap * (letters.length - 1)
    const widthScale = Math.min(1, span / totalWidth)
    let cursor = (span - totalWidth * widthScale) / 2

    for(const original of originals)
        model.remove(original)

    for(const [index, letter] of letters.entries())
    {
        if(letter.geometry)
        {
            letter.geometry.scale(widthScale, 1, 1)
            letter.size.x *= widthScale
            const mesh = new THREE.Mesh(letter.geometry, template.material)
            mesh.name = `refLettersPhysicalDynamic${index}`
            mesh.userData = { ...template.userData, letter: letter.character }
            mesh.position.copy(start).addScaledVector(direction, cursor + letter.width * widthScale / 2)
            mesh.quaternion.copy(template.quaternion)
            const collider = new THREE.Object3D()
            collider.name = `cuboidName${index}`
            collider.scale.copy(letter.size)
            mesh.add(collider)
            model.add(mesh)
        }
        cursor += (letter.width + gap) * widthScale
    }
}
