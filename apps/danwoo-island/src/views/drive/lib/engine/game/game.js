import { STARTUP, setStartupStage } from '../islandStartup'
import { WORLD_CONFIG } from '../worldConfig'
import * as THREE from 'three/webgpu'

import { Inputs } from './inputs/inputs'
import { Physics } from './physics/physics'
import { Rendering } from './rendering'
import { ResourcesLoader } from './resourcesLoader'
import { Ticker } from './ticker'
import { Time } from './time'
import { Player } from './player'
import { View } from './view'
import { Viewport } from './viewport'
import { World } from './world/world'
import { Tracks } from './tracks'
// import { Monitoring } from './Monitoring.js'
import { Lighting } from './lighting'
import { Materials } from './materials'
import { Objects } from './objects'
import { islandTextureResources } from './world/islandTextures'
import { islandModelResources } from './world/islandModels'
import { Fog } from './fog'
import { DayCycles } from './cycles/dayCycles'
import { Weather } from './weather'
import { Noises } from './noises'
import { Wind } from './wind'
import { Terrain } from './terrain'
import { Explosions } from './explosions'
import { YearCycles } from './cycles/yearCycles'
import { Modals } from './modals'
import { PhysicsVehicle } from './physics/physicsVehicle'
import { PhysicsWireframe } from './physics/physicsWireframe'
import { Zones } from './zones'
import { Overlay } from './overlay'
import { InteractivePoints } from './interactivePoints'
import { Respawns } from './respawns'
import { Audio } from './audio'
import { ClosingManager } from './closingManager'
import { RayCursor } from './rayCursor'
import { Water } from './water'
import { Reveal } from './reveal'
import { KonamiCode } from './konamiCode'
import { Notifications } from './notifications'
import { Quality } from './quality'
import { Menu } from './menu'
import { Title } from './title'
import { PreRenderer } from './preRenderer'
import { Options } from './options'
import gsap from 'gsap'
import { Map } from './map'

export class Game
{
    static getInstance()
    {
        return Game.instance
    }

    constructor()
    {
        // Singleton
        if(Game.instance)
            return Game.instance

        Game.instance = this

        this.init().catch(() => setStartupStage(STARTUP.error))
    }

    async init()
    {
        // Setup
        this.domElement = document.querySelector('.game')
        this.canvasElement = this.domElement.querySelector('.js-canvas')
        document.documentElement.classList.add('is-started')

        // First batch for intro
        this.scene = new THREE.Scene()
        this.resourcesLoader = new ResourcesLoader()
        this.quality = new Quality()
        this.ticker = new Ticker()
        this.time = new Time()
        this.dayCycles = new DayCycles()
        this.yearCycles = new YearCycles()
        this.inputs = new Inputs([], [ 'intro' ])
        this.audio = new Audio()
        this.notifications = new Notifications()
        this.rayCursor = new RayCursor()
        this.viewport = new Viewport(this.domElement)
        this.modals = new Modals()
        this.menu = new Menu()
        this.rendering = new Rendering()
        await this.rendering.setRenderer()

        const compressed = WORLD_CONFIG.compressedAssets
        const compressedModelSuffix = compressed ? '-compressed' : ''
        const compressedTextureFormat = compressed ? 'textureKtx' : 'texture'
        const compressedTextureExtension = compressed ? 'ktx' : 'png'

        const cb = '?cb=1'
        this.resources = await this.resourcesLoader.load([
            [ 'respawnsReferencesModel',    `respawns/respawnsReferences${compressedModelSuffix}.glb${cb}`, 'gltf' ],
            [ 'behindTheSceneStarsTexture', `behindTheScene/stars.${compressedTextureExtension}${cb}`,      compressedTextureFormat, (resource) => { resource.colorSpace = THREE.SRGBColorSpace; resource.minFilter = THREE.NearestFilter; resource.magFilter = THREE.NearestFilter; resource.generateMipmaps = false; resource.wrapS = THREE.RepeatWrapping; resource.wrapT = THREE.RepeatWrapping; } ],
            [ 'soundTexture',               `intro/sound.${compressedTextureExtension}${cb}`,               compressedTextureFormat, (resource) => { resource.minFilter = THREE.LinearFilter; resource.magFilter = THREE.LinearFilter; resource.generateMipmaps = false; resource.repeat.x = 0.5; } ],
            [ 'paletteTexture',             `palette.${compressedTextureExtension}${cb}`,                   compressedTextureFormat, (resource) => { resource.minFilter = THREE.NearestFilter; resource.magFilter = THREE.NearestFilter; resource.generateMipmaps = false; resource.colorSpace = THREE.SRGBColorSpace; } ],

        ])
        this.options = new Options()
        this.respawns = new Respawns(WORLD_CONFIG.playerSpawn)
        this.view = new View()
        this.rendering.setPostprocessing()
        this.rendering.start()
        this.reveal = new Reveal()
        this.noises = new Noises()
        this.weather = new Weather()
        this.wind = new Wind()
        this.tracks = new Tracks()
        this.lighting = new Lighting()
        this.fog = new Fog()
        this.water = new Water()
        this.materials = new Materials()
        this.objects = new Objects()
        this.explosions = new Explosions()
        this.world = new World()

        // Load and init RAPIER
        const fontsPromise = Promise.all([document.fonts.load('400 24px MaruBuri'), document.fonts.load('700 24px MaruBuri')])
        const rapierPromise = import('@dimforge/rapier3d-compat').then(async (RAPIER) => { await RAPIER.init(); return RAPIER })

        // Load rest of resources
        const resourcesPromise = this.resourcesLoader.load(
            [
                [ 'foliageTexture',                        `foliage/cherryPetalSDF.png${cb}`,                                                   'texture', (resource) => { resource.minFilter = THREE.NearestFilter; resource.magFilter = THREE.NearestFilter; resource.generateMipmaps = false; } ],
                [ 'bushesReferences',                      `bushes/bushesReferences${compressedModelSuffix}.glb${cb}`,                           'gltf' ],
                [ 'vehicle',                               `vehicle/default${compressedModelSuffix}.glb${cb}`,                                   'gltf' ],
                [ 'playgroundVisual',                      `playground/playgroundVisual${compressedModelSuffix}.glb${cb}`,                       'gltf' ],
                [ 'playgroundPhysical',                    `playground/playgroundPhysical${compressedModelSuffix}.glb${cb}`,                     'gltf' ],
                [ 'flowersReferencesModel',                `flowers/flowersReferences${compressedModelSuffix}.glb${cb}`,                         'gltf' ],
                [ 'bricksModel',                           `bricks/bricks${compressedModelSuffix}.glb${cb}`,                                     'gltf' ],
                [ 'fencesModel',                           `fences/fences${compressedModelSuffix}.glb${cb}`,                                     'gltf' ],
                [ 'benchesModel',                          `benches/benches${compressedModelSuffix}.glb${cb}`,                                   'gltf' ],
                [ 'explosiveCratesModel',                  `explosiveCrates/explosiveCrates${compressedModelSuffix}.glb${cb}`,                   'gltf' ],
                [ 'lanternsModel',                         `lanterns/lanterns${compressedModelSuffix}.glb${cb}`,                                 'gltf' ],
                [ 'terrainTexture',                        `terrain/terrain.${compressedTextureExtension}${cb}`,                                 compressedTextureFormat, (resource) => { resource.flipY = false; } ],
                [ 'terrainModel',                          `terrain/terrain${compressedModelSuffix}.glb${cb}`,                                   'gltf' ],
                [ 'floorSlabsTexture',                     `floor/slabs.${compressedTextureExtension}`,                                     compressedTextureFormat, (resource) => { resource.wrapS = THREE.RepeatWrapping; resource.wrapT = THREE.RepeatWrapping; resource.minFilter = THREE.LinearFilter; resource.magFilter = THREE.LinearFilter; resource.generateMipmaps = false } ],
                [ 'birchTreesVisualModel',                 `birchTrees/birchTreesVisual${compressedModelSuffix}.glb${cb}`,                       'gltf' ],
                [ 'birchTreesReferencesModel',             `birchTrees/birchTreesReferences${compressedModelSuffix}.glb${cb}`,                   'gltf' ],
                [ 'oakTreesVisualModel',                   `oakTrees/oakTreesVisual${compressedModelSuffix}.glb${cb}`,                           'gltf' ],
                [ 'oakTreesReferencesModel',               `oakTrees/oakTreesReferences${compressedModelSuffix}.glb${cb}`,                                               'gltf' ],
                [ 'cherryTreesVisualModel',                `cherryTrees/cherryTreesVisual${compressedModelSuffix}.glb${cb}`,                     'gltf' ],
                [ 'cherryTreesReferencesModel',            `cherryTrees/cherryTreesReferences${compressedModelSuffix}.glb${cb}`,                 'gltf' ],
                [ 'sceneryModel',                          `scenery/scenery${compressedModelSuffix}.glb${cb}`,                                   'gltf' ],
                [ 'areasModel',                            `areas/areas${compressedModelSuffix}.glb${cb}`,                                       'gltf' ],
                [ 'poleLightsModel',                       `poleLights/poleLights${compressedModelSuffix}.glb${cb}`,                             'gltf' ],
                [ 'satanStarTexture',                      `areas/lotusMark.png${cb}`,                                 'texture', (resource) => { resource.minFilter = THREE.LinearFilter; resource.magFilter = THREE.LinearFilter; resource.generateMipmaps = false } ],
                [ 'overlayPatternTexture',                 `overlay/overlayPattern.${compressedTextureExtension}${cb}`,                          compressedTextureFormat, (resource) => { resource.wrapS = THREE.RepeatWrapping; resource.wrapT = THREE.RepeatWrapping; resource.magFilter = THREE.NearestFilter; resource.minFilter = THREE.NearestFilter; resource.generateMipmaps = false } ],
                [ 'interactivePointsKeyIconCrossTexture',  `interactivePoints/interactivePointsKeyIconCross.${compressedTextureExtension}${cb}`, compressedTextureFormat, (resource) => { resource.minFilter = THREE.NearestFilter; resource.magFilter = THREE.NearestFilter; resource.generateMipmaps = false } ],
                [ 'interactivePointsKeyIconEnterTexture',  `interactivePoints/interactivePointsKeyIconEnter.${compressedTextureExtension}${cb}`, compressedTextureFormat, (resource) => { resource.minFilter = THREE.NearestFilter; resource.magFilter = THREE.NearestFilter; resource.generateMipmaps = false } ],
                [ 'interactivePointsKeyIconATexture',      `interactivePoints/interactivePointsKeyIconA.${compressedTextureExtension}${cb}`,     compressedTextureFormat, (resource) => { resource.minFilter = THREE.NearestFilter; resource.magFilter = THREE.NearestFilter; resource.generateMipmaps = false } ],
                [ 'islandMapTexture',                      `areas/island/islandMap.webp${cb}`,                           'texture', (resource) => { resource.colorSpace = THREE.SRGBColorSpace } ],
                [ 'bowlingNeonTexture',                    `bowling/neonSign.png${cb}`,                                 'texture', (resource) => { resource.colorSpace = THREE.SRGBColorSpace; resource.generateMipmaps = false; resource.minFilter = THREE.LinearFilter } ],
                [ 'jukeboxMusicNotes',                     `jukebox/jukeboxMusicNotes.${compressedTextureExtension}${cb}`,                       compressedTextureFormat, (resource) => { resource.minFilter = THREE.LinearFilter; resource.magFilter = THREE.LinearFilter; resource.generateMipmaps = false } ],
                [ 'achievementsGlyphsTexture',             `achievements/glyphs.${compressedTextureExtension}${cb}`,                             compressedTextureFormat, (resource) => { resource.minFilter = THREE.LinearFilter; resource.magFilter = THREE.LinearFilter; resource.generateMipmaps = false; resource.wrapS = THREE.RepeatWrapping; } ],
                [ 'careerFreelancerTexture',               `career/careerFreelancer.${compressedTextureExtension}${cb}`,                         compressedTextureFormat, (resource) => { resource.flipY = false; resource.minFilter = THREE.LinearFilter; resource.magFilter = THREE.LinearFilter; resource.generateMipmaps = false; resource.wrapS = THREE.ClampToEdgeWrapping; resource.wrapT = THREE.ClampToEdgeWrapping; } ],
                [ 'careerHeticTexture',                    `career/careerHetic.${compressedTextureExtension}${cb}`,                              compressedTextureFormat, (resource) => { resource.flipY = false; resource.minFilter = THREE.LinearFilter; resource.magFilter = THREE.LinearFilter; resource.generateMipmaps = false; resource.wrapS = THREE.ClampToEdgeWrapping; resource.wrapT = THREE.ClampToEdgeWrapping; } ],
                [ 'careerImmersiveGardenTexture',          `career/careerImmersiveGarden.${compressedTextureExtension}${cb}`,                    compressedTextureFormat, (resource) => { resource.flipY = false; resource.minFilter = THREE.LinearFilter; resource.magFilter = THREE.LinearFilter; resource.generateMipmaps = false; resource.wrapS = THREE.ClampToEdgeWrapping; resource.wrapT = THREE.ClampToEdgeWrapping; } ],
                [ 'careerIRLTeacherTexture',               `career/careerIRLTeacher.${compressedTextureExtension}${cb}`,                         compressedTextureFormat, (resource) => { resource.flipY = false; resource.minFilter = THREE.LinearFilter; resource.magFilter = THREE.LinearFilter; resource.generateMipmaps = false; resource.wrapS = THREE.ClampToEdgeWrapping; resource.wrapT = THREE.ClampToEdgeWrapping; } ],
                [ 'careerOnlineTeacherTexture',            `career/careerOnlineTeacher.${compressedTextureExtension}${cb}`,                      compressedTextureFormat, (resource) => { resource.flipY = false; resource.minFilter = THREE.LinearFilter; resource.magFilter = THREE.LinearFilter; resource.generateMipmaps = false; resource.wrapS = THREE.ClampToEdgeWrapping; resource.wrapT = THREE.ClampToEdgeWrapping; } ],
                [ 'careerUzikTexture',                     `career/careerUzik.${compressedTextureExtension}${cb}`,                               compressedTextureFormat, (resource) => { resource.flipY = false; resource.minFilter = THREE.LinearFilter; resource.magFilter = THREE.LinearFilter; resource.generateMipmaps = false; resource.wrapS = THREE.ClampToEdgeWrapping; resource.wrapT = THREE.ClampToEdgeWrapping; } ],
                [ 'timeMachineScreenMGSTexture',           `timeMachine/timeMachineScreenMGS.${compressedTextureExtension}${cb}`,                compressedTextureFormat, (resource) => { resource.minFilter = THREE.NearestFilter; resource.magFilter = THREE.NearestFilter; resource.generateMipmaps = false; resource.wrapS = THREE.ClampToEdgeWrapping; resource.wrapT = THREE.ClampToEdgeWrapping; resource.colorSpace = THREE.SRGBColorSpace; } ],
                [ 'timeMachineScreenFolioTexture',         `timeMachine/timeMachineScreenFolio.${compressedTextureExtension}${cb}`,              compressedTextureFormat, (resource) => { resource.minFilter = THREE.NearestFilter; resource.magFilter = THREE.NearestFilter; resource.generateMipmaps = false; resource.wrapS = THREE.ClampToEdgeWrapping; resource.wrapT = THREE.ClampToEdgeWrapping; resource.colorSpace = THREE.SRGBColorSpace; } ],
                ...islandTextureResources(cb),
                ...islandModelResources(cb),
            ],
            (toLoad, total) =>
            {
                this.world.intro.updateProgress(1 - toLoad / total)
            }
        )

        const [ newResources, RAPIER ] = await Promise.all([ resourcesPromise, rapierPromise, fontsPromise ])
        setStartupStage(STARTUP.graphics)
        this.RAPIER = RAPIER
        this.resources = { ...newResources, ...this.resources }

        this.terrain = new Terrain()
        this.physics = new Physics()
        this.wireframe = new PhysicsWireframe()
        this.physicalVehicle = new PhysicsVehicle()
        this.zones = new Zones()
        this.player = new Player()
        this.closingManager = new ClosingManager()
        this.interactivePoints = new InteractivePoints()
        this.konamiCode = new KonamiCode()
        this.map = new Map()
        this.title = new Title()
        // this.monitoring = new Monitoring()
        this.world.step(1)
        this.overlay = new Overlay()

        // Pre-render if quality high
        if(this.quality.level === 0 && this.rendering.renderer.backend.isWebGPUBackend)
            PreRenderer.render()

        this.ticker.wait(3, () =>
        {
            this.reveal.updateStep(0)
        })
    }

    reset()
    {
        // Interactive buttons
        this.inputs.interactiveButtons.clearItems()

        // Player respawn
        this.player.respawn(null, () =>
        {
            // Objects reset
            this.objects.resetAll()

            // Explosive crates
            if(this.world.explosiveCrates)
                this.world.explosiveCrates.reset()

            // Bowling
            if(this.world.areas.bowling)
                this.world.areas.bowling.restart()

            // Cookie
            if(this.world.areas.cookie)
                this.world.areas.cookie.cookies.instancedGroup.needsUpdate = true

            // Toilet
            if(this.world.areas.toilet)
                this.world.areas.toilet.cabin.down = false

            // Social
            if(this.world.areas.social)
            {
                this.world.areas.social.fans.instancedGroup.needsUpdate = true
            }

            // Benches
            if(this.world.benches)
                this.world.benches.instancedGroup.needsUpdate = true

            // Fences
            if(this.world.fences)
                this.world.fences.instancedGroup.needsUpdate = true

            // Bricks
            if(this.world.bricks)
                this.world.bricks.instancedGroup.needsUpdate = true

            // Lanterns
            if(this.world.lanterns)
                this.world.lanterns.instancedGroup.needsUpdate = true
            gsap.delayedCall(2, () =>
            {

            })
        })
    }
}

