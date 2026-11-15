import * as THREE from 'three/webgpu'
import { color, uniform, vec2 } from 'three/tsl'
import { getGame } from './gameContext'
import gsap from 'gsap'
import { isTideLoading, TIDE_REVEAL } from './world/tideLoading'

export class Reveal
{
    constructor()
    {
        this.game = getGame()

        this.step = -1
        const respawn = this.game.respawns.getDefault()
        this.position = respawn.position.clone()
        this.position2Uniform = uniform(vec2(this.position.x, this.position.z))
        this.distance = uniform(0)
        this.thickness = uniform(0.05)
        this.color = uniform(color('#e88eff'))
        this.intensity = uniform(5.5)
        this.intensityMultiplier = 1
        this.sound = this.game.audio.register({
            path: 'sounds/reveal/reveal-1.mp3',
            autoplay: false,
            loop: false,
            volume: 0.5,
            preload: true
        })

        this.update = this.update.bind(this)
        this.game.ticker.events.on('tick', this.update, 10)
    }

    updateStep(step)
    {
        const speedMultiplier = location.hash.match(/skip/i) ? 4 : 1

        if(step === 0)
        {
            this.game.world.intro.circle.hide(() =>
            {
                this.game.world.grid.show()

                this.distance.value = 0

                gsap.to(
                    this.distance,
                    {
                        value: 3.5,
                        ease: 'back.out(1.7)',
                        duration: 2 / speedMultiplier,
                        overwrite: true,
                    }
                )

                this.game.view.zoom.smoothedRatio = 0.6
                this.game.view.zoom.baseRatio = 0.6

                gsap.to(
                    this.game.view.zoom,
                    {
                        baseRatio: 0.3,
                        ease: 'power1.inOut',
                        duration: 1.25 / speedMultiplier,
                        overwrite: true,
                    }
                )

                this.game.world.intro.setText()
                this.game.world.intro.setSoundButton()
                this.game.ticker.wait(1, () =>
                {
                    this.game.world.intro.showLabel()
                })

                if(this.game.world.cherryTrees)
                    this.game.world.cherryTrees.leaves.seeThroughMultiplier = 0.5

                if(location.hash.match(/skip/i))
                {
                    this.updateStep(1)
                }
                else
                {
                    const next = () =>
                    {
                        this.updateStep(1)
                        this.game.inputs.events.off('introStart', inputCallback)
                        this.game.rayCursor.removeIntersect(intersect)
                    }

                    const inputCallback = () =>
                    {
                        next()
                    }

                    const position = this.position.clone()
                    position.y = 0

                    const intersect = this.game.rayCursor.addIntersect({
                        active: true,
                        shape: new THREE.Sphere(position, 3.5),
                        onClick: next,
                        onEnter: () =>
                        {
                            gsap.to(this, { intensityMultiplier: 1.22, duration: 0.2, overwrite: true })
                        },
                        onLeave: () =>
                        {
                            gsap.to(this, { intensityMultiplier: 1, duration: 0.2, overwrite: true })
                        }
                    })

                    this.game.inputs.addActions([
                        { name: 'introStart', categories: [ 'intro' ], keys: [ 'Gamepad.cross', 'Keyboard.Enter', 'Keyboard.ArrowUp', 'Keyboard.ArrowDown', 'Keyboard.KeyW', 'Keyboard.KeyD' ] },
                    ])

                    this.game.inputs.events.on('introStart', inputCallback)
                }
            })
        }
        else if(step === 1)
        {
            this.game.audio.init()
            this.sound.play()

            gsap.to(
                this.distance,
                {
                    value: 30,
                    ease: 'back.in(1.3)',
                    duration: 2 / speedMultiplier,
                    overwrite: true,
                    onComplete: () =>
                    {
                        this.distance.value = 99999
                    }
                }
            )

            this.game.world.intro.hideLabel()

            this.game.inputs.filters.clear()
            this.game.inputs.filters.add('wandering')

            this.game.view.focusPoint.isTracking = true
            this.game.view.focusPoint.magnet.active = false

            gsap.to(
                this.game.view.zoom,
                {
                    baseRatio: 0,
                    ease: 'back.in(1.5)',
                    duration: 1.75 / speedMultiplier,
                    overwrite: true,
                    onComplete: () =>
                    {
                        this.updateStep(2)
                    }
                }
            )

            if(this.game.world.cherryTrees)
            {
                gsap.to(
                    this.game.world.cherryTrees.leaves,
                    {
                        seeThroughMultiplier: 1,
                        ease: 'power1.inOut',
                        duration: 2 / speedMultiplier,
                        overwrite: true
                    }
                )
            }
        }
        else if(step === 2)
        {
            this.game.interactivePoints.recover()

            this.game.world.step(2)
            this.game.world.grid.destroy()
            this.game.world.intro.destroy()
            this.game.world.intro = null

            this.game.overlay.moveOnTop()

            this.game.menu.preopen()

            this.game.ticker.events.off('tick', this.update)
        }

        this.step = step
    }

    update()
    {
        if(isTideLoading)
        {
            this.color.value.set(TIDE_REVEAL.color)
            this.intensity.value = TIDE_REVEAL.intensity * this.intensityMultiplier
            return
        }
        this.color.value.copy(this.game.dayCycles.properties.revealColor.value)
        this.intensity.value = this.game.dayCycles.properties.revealIntensity.value * this.intensityMultiplier
    }
}
