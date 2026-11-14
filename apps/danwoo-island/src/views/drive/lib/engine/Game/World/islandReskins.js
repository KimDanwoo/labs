import { createParts, islandMaterial, removeComponents } from './islandGeometry.js'

const CAREER_PAINT = {
    emissiveWhiteRadialGradient: 'hanji',
    emissiveOrangeRadialGradient: 'obangYellow',
    emissivePurpleRadialGradient: 'obangRed',
    emissiveBlueRadialGradient: 'obangBlue',
}

const AWARDS_TABLE = ['table002', 'cube024', 'refel003', 'medal', 'refDistinctions']

const STEPPING_STONES = ['slabes', 'Cube001', 'Cube002']

const SCREEN_STAND = {
    boardBottom: 1.42,
    legX: [0.48, 3.85],
    z: -0.42,
    spread: 0.36,
    wheelRadius: 0.17,
    jetTop: 1,
    podTop: 1.35,
}

function paint(mesh, materials, shade)
{
    if(mesh?.isMesh)
        mesh.material = islandMaterial(materials, shade)
}

export function paintCareerLines(model, materials)
{
    model.traverse((child) =>
    {
        const shade = child.isMesh ? CAREER_PAINT[child.material?.name] : null
        if(shade)
            paint(child, materials, shade)
    })
}

export function paintAchievementsBasin(model, materials)
{
    paint(model.getObjectByName('Cube110'), materials, 'stone')
}

export function paintSteppingStones(scenery, materials)
{
    for(const name of STEPPING_STONES)
        paint(scenery.getObjectByName(name), materials, 'fieldstone')
}

function trestle(parts, x, ground)
{
    const { boardBottom, z, spread, wheelRadius } = SCREEN_STAND
    const axle = ground + wheelRadius
    for(const side of [-1, 1])
    {
        parts.rod('wood', 0.06, [x, boardBottom, z], [x, axle + 0.12, z + side * spread])
        parts.prism('woodDark', wheelRadius, wheelRadius, 0.08, { position: [x, axle, z + side * spread], rotation: [Math.PI / 2, 0, 0] }, 10)
        parts.prism('iron', 0.05, 0.05, 0.1, { position: [x, axle, z + side * spread], rotation: [Math.PI / 2, 0, 0] }, 6)
    }
    parts.box('woodDark', [0.12, 0.1, spread * 2 + 0.1], { position: [x, axle + 0.14, z] })
}

export function rebuildBowlingScreenStand(model, materials)
{
    const frame = model.getObjectByName('Cube180')
    const body = model.getObjectByName('Cube177')
    if(!frame?.isMesh || !body?.isMesh)
        return
    removeComponents(frame, (component) => component.box.max.y < SCREEN_STAND.jetTop)
    removeComponents(body, (component) => component.box.max.y < SCREEN_STAND.podTop)
    const ground = -body.position.y
    const parts = createParts()
    const [left, right] = SCREEN_STAND.legX
    SCREEN_STAND.legX.forEach((x) => trestle(parts, x, ground))
    parts.rod('woodDark', 0.05, [left, 0.95, SCREEN_STAND.z], [right, 0.95, SCREEN_STAND.z])
    body.add(parts.build(materials))
}

export function removeAwardsTable(model)
{
    for(const name of AWARDS_TABLE)
        model.getObjectByName(name)?.removeFromParent()
}
