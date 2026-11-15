import * as THREE from 'three/webgpu'
import { islandModelMesh } from './islandModels'

const collider = (size, position) => ({ size: new THREE.Vector3(...size), position: new THREE.Vector3(...position) })

const SHELL_FOUNTAIN = {
    key: 'shellFountain',
    size: new THREE.Vector3(2.6, 2.4, 2.6),
    colliders: [collider([2.3, 1.2, 2.3], [0, 0.6, 0]), collider([1.4, 2.2, 1.4], [0, 1.1, 0])],
}

const PALM_HAMMOCK = {
    key: 'palmHammock',
    size: new THREE.Vector3(3.8, 3.8, 2.4),
    colliders: [collider([0.35, 3, 0.35], [-0.85, 1.5, -0.27]), collider([0.35, 3, 0.35], [0.85, 1.5, -0.27])],
}

const SURF_CORNER = {
    key: 'surfCorner',
    size: new THREE.Vector3(3.4, 2.8, 2.6),
    colliders: [collider([1.6, 1.9, 0.5], [-0.75, 0.95, -0.4])],
}

export const LIGHTHOUSE = {
    key: 'lighthouse',
    size: new THREE.Vector3(1.5, 4.6, 1.5),
    colliders: [collider([1, 4.4, 1], [0, 2.2, 0])],
}

const LANDMARKS = [
    { pattern: /^refStatuePhysicalDynamic$/, ...SHELL_FOUNTAIN },
    { pattern: /^gamepadPhysicalDynamic/, ...PALM_HAMMOCK, offset: new THREE.Vector3(1, 0, 0) },
]

const BEACH_SPOTS = [{ pattern: /^gamepadPhysicalDynamic/, ...SURF_CORNER, position: new THREE.Vector3(56, 0, 37.6) }]

const REMOVED = /^(baguira|boy|sudo|phone)PhysicalDynamic/

function colliderFloor(object)
{
    object.updateMatrix()
    const bottoms = object.children
        .filter((child) => /^cuboid/.test(child.name))
        .map((cuboid) => cuboid.position.clone().add(new THREE.Vector3(0, -cuboid.scale.y / 2, 0)).applyMatrix4(object.matrix).y)
    return bottoms.length ? Math.min(...bottoms) : null
}

function footprintOf(model, object)
{
    model.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(object).applyMatrix4(model.matrixWorld.clone().invert())
    const center = box.getCenter(new THREE.Vector3())
    return new THREE.Vector3(center.x, colliderFloor(object) ?? box.min.y, center.z)
}

export function fixedLandmark(materials, { key, size, colliders }, base, quaternion)
{
    const landmark = new THREE.Group()
    landmark.name = `${key}PhysicalFixed`
    landmark.position.copy(base)
    landmark.quaternion.copy(quaternion)
    landmark.add(islandModelMesh(materials, key, new THREE.Matrix4().makeTranslation(0, size.y / 2, 0), size))
    for(const { size: colliderSize, position } of colliders)
    {
        const cuboid = new THREE.Object3D()
        cuboid.name = 'cuboid'
        cuboid.scale.copy(colliderSize)
        cuboid.position.copy(position)
        landmark.add(cuboid)
    }
    return landmark
}

export function placeLandmarks(model, materials)
{
    for(const child of [...model.children])
    {
        const landmark = LANDMARKS.find(({ pattern }) => pattern.test(child.name))
        if(landmark)
            model.add(fixedLandmark(materials, landmark, footprintOf(model, child).add(landmark.offset ?? new THREE.Vector3()), child.quaternion))
        for(const spot of BEACH_SPOTS.filter(({ pattern }) => pattern.test(child.name)))
            model.add(fixedLandmark(materials, spot, model.worldToLocal(spot.position.clone()), new THREE.Quaternion()))
        if(landmark || REMOVED.test(child.name))
            child.removeFromParent()
    }
}
