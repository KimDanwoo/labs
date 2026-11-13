import { Game } from './Game.js'
import { createElement } from './utilities/createElement.js'

export class Options
{
    constructor()
    {
        this.game = Game.getInstance()
        this.element = this.game.menu.items.get('options').contentElement

        this.setSound()
        this.setQuality()
        this.setRespawn()
        this.setReset()
        this.setRenderer()
        this.setPaints()
    }

    setSound()
    {
        const element = this.element.querySelector('.js-audio-toggle')

        element.addEventListener('click', this.game.audio.mute.toggle)
    }

    setQuality()
    {
        const element = this.element.querySelector('.js-quality-toggle')
        const text = element.querySelector('span')
        text.textContent = this.game.quality.level === 0 ? 'High' : 'Low'

        element.addEventListener('click', () =>
        {
            this.game.quality.changeLevel(this.game.quality.level === 0 ? 1 : 0)
        })

        this.game.quality.events.on('change', () =>
        {
            text.textContent = this.game.quality.level === 0 ? 'High' : 'Low'
        })
    }

    setRespawn()
    {
        const element = this.element.querySelector('.js-respawn')

        element.addEventListener('click', () =>
        {
            this.game.player.respawn()
            this.game.menu.close()
        })
    }

    setReset()
    {
        const element = this.element.querySelector('.js-reset')

        element.addEventListener('click', () =>
        {
            this.game.reset()
            this.game.menu.close()
        })
    }

    setRenderer()
    {
        if(this.game.rendering.renderer.backend.isWebGLBackend)
        {
            const element = this.element.querySelector('.js-renderer')
            element.classList.remove('is-success')
            element.classList.add('is-danger')

            const text = element.querySelector('span')
            text.textContent = 'WebGL'

            const tooltip = element.querySelector('.js-tooltip')
            tooltip.replaceChildren('Your browser is ', createElement('strong', '', [ 'not compatible' ]), ' with WebGPU resulting in performance loss')
        }
    }

    setPaints()
    {
        const select = this.element.querySelector('.js-paint-select')
        const names = ['black', 'orange', 'white', 'red', 'flames', 'abyssal']
        const stored = localStorage.getItem('danwoo-island-paint')
        this.paintName = names.includes(stored) ? stored : 'black'
        select.value = this.paintName
        select.addEventListener('change', () =>
        {
            if(!names.includes(select.value)) return
            this.paintName = select.value
            localStorage.setItem('danwoo-island-paint', this.paintName)
            this.game.world.visualVehicle.paints.changeTo(this.paintName)
        })
    }
}
