import { color, float, Fn, max, PI, positionWorld, texture, uniform, uv, vec3 } from 'three/tsl'
import { rebuildBridge } from './islandStructures'
import { paintSteppingStones } from './islandReskins'
import { getGame } from '../gameContext'
import { References } from '../references'
import { MeshDefaultMaterial } from '../materials/meshDefaultMaterial'

export class Scenery
{
    constructor()
    {
        this.game = getGame()

        this.references = new References()
        const model = [...this.game.resources.sceneryModel.scene.children]
        for(const bridge of model.filter((child) => /^bridgePhysicalFixed/.test(child.name)))
            rebuildBridge(bridge, this.game.materials)
        paintSteppingStones(this.game.resources.sceneryModel.scene, this.game.materials)

        for(const child of [...this.game.resources.sceneryModel.scene.children])
        {
            if(typeof child.userData.prevent === 'undefined' || child.userData.prevent === false)
            {
                this.game.objects.addFromModel(
                    child,
                    {
                    },
                    {
                        position: child.position,
                        rotation: child.quaternion,
                        sleeping: true,
                        mass: child.userData.mass
                    }
                )
            }

            this.references.parse(child)
        }

        this.setRoad()

        this.game.ticker.events.on('tick', () =>
        {
            this.update()
        })
    }

    setRoad()
    {
        this.road = {}

        const mesh = this.references.items.get('road')[0]

        this.road.color = uniform(color('#384246'))
        this.road.glitterVariation = uniform(0)
        this.road.glitterScarcity = uniform(100)
        this.road.glitterIntensity = uniform(0.3)
        this.road.glitterPerlinFrequency = uniform(0.05)
        this.road.glitterHashFrequency = uniform(0.2)

        const colorNode = Fn(() =>
        {
            const glitter = float(0)

            const hashUv = positionWorld.xz.mul(this.road.glitterHashFrequency)
            const hash = texture(this.game.noises.hash, hashUv).r.mul(2).add(this.road.glitterVariation).mod(2).sub(1).abs()
            glitter.addAssign(hash)

            glitter.assign(glitter.pow(this.road.glitterScarcity))

            glitter.mulAssign(this.road.glitterIntensity)

            const perlinUv = positionWorld.xz.mul(this.road.glitterPerlinFrequency)
            const perlin = texture(this.game.noises.perlin, perlinUv).r
            glitter.mulAssign(perlin)

            const middle = uv().y.mul(PI).sin()
            glitter.mulAssign(middle)

            const baseColor = this.road.color.toVar()
            baseColor.addAssign(glitter)

            return vec3(baseColor)
        })()

        const material = new MeshDefaultMaterial({
            colorNode: colorNode,

            hasLightBounce: false,
            hasWater: false,
        })
        mesh.material = material
    }

    update()
    {
        this.road.glitterVariation.value += this.game.ticker.deltaScaled * 0.004 + this.game.view.delta.length() * 0.004
    }
}