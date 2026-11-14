import * as THREE from 'three/webgpu'
import { getGame } from '../gameContext'
import { Floor } from './floor'
import { Grid } from './grid'
import { Grass } from './grass'
import { color, float, Fn, instance, normalWorld, positionLocal, texture, vec3, vec4 } from 'three/tsl'
import { WaterSurface } from './waterSurface'
import { Areas } from './areas/areas'
import { WindLines } from './windLines'
import { Leaves } from './leaves'
import { Lightnings } from './lightnings'
import { Snow } from './snow'
import { VisualVehicle } from './visualVehicle'
import { Flowers } from './flowers'
import { Bricks } from './bricks'
import { Trees } from './trees'
import { Bushes } from './bushes'
import { MeshDefaultMaterial } from '../materials/meshDefaultMaterial'
import { Fireballs } from './fireballs'
import { ExplosiveCrates } from './explosiveCrates'
import { RainLines } from './rainLines'
import { Confetti } from './confetti'
import { Intro } from './intro'
import { PoleLights } from './poleLights'
import { Lanterns } from './lanterns'
import { Fences } from './fences'
import { Benches } from './benches'
import { Scenery } from './scenery'

export class World
{
    constructor()
    {
        this.game = getGame()

        this.step(0)
    }

    step(step)
    {
        if(step === 0)
        {
            this.grid = new Grid()
            this.intro = new Intro()
        }
        else if(step === 1)
        {
            this.visualVehicle = new VisualVehicle(this.game.resources.vehicle.scene)
            this.floor = new Floor()
            this.waterSurface = new WaterSurface()
            this.grass = new Grass()
            this.windLines = new WindLines()
            this.confetti = new Confetti()
            this.leaves = new Leaves()
            this.rain = new RainLines()
            this.lightnings = new Lightnings()
            this.fireballs = new Fireballs()
            this.snow = new Snow()
            this.bushes = new Bushes()
            this.birchTrees = new Trees('Birch Tree', this.game.resources.birchTreesVisualModel.scene, this.game.resources.birchTreesReferencesModel.scene.children, '#4F9B65', '#A8D878')
            this.oakTrees = new Trees('Oak Tree', this.game.resources.oakTreesVisualModel.scene, this.game.resources.oakTreesReferencesModel.scene.children, '#287A59', '#70BA69')
            this.cherryTrees = new Trees('Cherry Tree', this.game.resources.cherryTreesVisualModel.scene, this.game.resources.cherryTreesReferencesModel.scene.children, '#EC879D', '#FFD1CB')
            this.flowers = new Flowers()
            this.bricks = new Bricks()
            this.fences = new Fences()
            this.benches = new Benches()
            this.explosiveCrates = new ExplosiveCrates()
            this.poleLights = new PoleLights()
            this.lanterns = new Lanterns()
            this.scenery = new Scenery()
            this.areas = new Areas()
        }
    }

    setPhysicalFloor()
    {
        this.game.objects.add(
            null,
            {
                type: 'fixed',
                friction: 0.25,
                restitution: 0,
                colliders: [
                    { shape: 'cuboid', parameters: [ 1000, 1, 1000 ], position: { x: 0, y: - 1.01, z: 0 }, category: 'floor' },
                ]
            }
        )
    }

    setTestKtx()
    {
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(10, 10, 10),
            new THREE.MeshBasicNodeMaterial(),
        )
        mesh.material.outputNode = vec4(
            texture(this.game.resources.paletteTexture).rgb,
            1
        )
        mesh.position.copy(this.game.player.position)
        mesh.position.y += 2
        this.game.scene.add(mesh)
    }

    setTestShadow()
    {
        const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5)

        const material = new THREE.MeshLambertNodeMaterial()
        material.castShadowNode = vec4(0, 0, 0, 1)

        const mesh = new THREE.Mesh(geometry, material)
        mesh.position.y = 2
        mesh.receiveShadow = true
        mesh.castShadow = true
        this.game.scene.add(mesh)
    }

    setTestMesh()
    {
        console.log(this.game.rendering.renderer.library)
        const testMesh = new THREE.Mesh(
            new THREE.SphereGeometry(1, 32, 32),
            new THREE.MeshBasicMaterial()
        )

        testMesh.position.z = 3
        this.game.scene.add(testMesh)
    }

    setAxesHelper()
    {
        const axesHelper = new THREE.AxesHelper()
        axesHelper.position.y = 0.1
        this.game.scene.add(axesHelper)
    }

    setCollisionGroupsTest()
    {
        this.game.objects.add(
            null,
            {
                type: 'dynamic',
                position: { x: 4, y: 2, z: -1.1 },
                colliders: [ { shape: 'cuboid', parameters: [ 0.5, 0.5, 0.5 ], category: 'floor' } ]
            }
        )
    }

    updateLoadingProgress(ratio)
    {
        this.intro.updateProgress(ratio)
    }

    refreshAfterReset()
    {
        this.explosiveCrates?.reset()
        this.areas.bowling?.restart()
        if(this.areas.cookie)
            this.areas.cookie.cookies.instancedGroup.needsUpdate = true
        if(this.areas.toilet)
            this.areas.toilet.cabin.down = false
        if(this.areas.social)
            this.areas.social.fans.instancedGroup.needsUpdate = true
        for(const decoration of [this.benches, this.fences, this.bricks, this.lanterns])
            if(decoration)
                decoration.instancedGroup.needsUpdate = true
    }
}
