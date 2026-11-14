import { clamp } from 'three/src/math/MathUtils.js'
import { getGame } from './gameContext'
import { worldAsset } from '../../../config/worldAsset'
import { createElement } from './utilities/createElement'

function toLines(text)
{
    return text.split('\n').flatMap((line, index) => index === 0 ? [ line ] : [ document.createElement('br'), line ])
}

export class Map
{
    constructor()
    {
        this.game = getGame()

        this.initiated = false
        this.modal = this.game.modals.items.get('map')
        this.element = this.modal.element.querySelector('.js-map-container')

        this.setTrigger()
        this.setInputs()

        this.modal.events.on('open', () =>
        {
            if(!this.initiated)
                this.init()

            this.texture.update()
        })
    }

    init()
    {
        this.initiated = true

        this.setLocations()
        this.setPlayer()
        this.setTexture()

        this.game.ticker.events.on('tick', () =>
        {
            this.update()
        }, 14)
    }

    setLocations()
    {
        this.locations = {}
        this.locations.items = [
            { name: '서핑 포인트', respawnName: 'altar', offset: { x: 0, y: -0.05 } },
            { name: '공사장', respawnName: 'behindTheScene', offset: { x: 0.01, y: 0 } },
            { name: '볼링장', respawnName: 'bowling', offset: { x: -0.08, y: 0.03 } },
            { name: '소개·이력서', respawnName: 'career', offset: { x: 0, y: -0.06 } },
            { name: '서킷', respawnName: 'circuit', offset: { x: -0.08, y: -0.05 } },
            { name: '코코넛 노점', respawnName: 'cookie', offset: { x: -0.02, y: -0.01 } },
            { name: 'Danwoo Lab', respawnName: 'lab', offset: { x: -0.03, y: 0 } },
            { name: '출발점', respawnName: 'landing', offset: { x: 0.02, y: 0 } },
            { name: '프로젝트', respawnName: 'projects', offset: { x: 0, y: -0.02 } },
            { name: '소셜', respawnName: 'social', offset: { x: -0.01, y: -0.04 } },
            { name: 'Lab 포털', respawnName: 'timeMachine', offset: { x: 0, y: 0 } },
        ]

        for(const item of this.locations.items)
        {
            const respawn = this.game.respawns.getByName(item.respawnName)
            const mapPosition = this.worldToMap(respawn.position)

            const element = createElement('div', 'location', [
                createElement('div', 'pin'),
                createElement('div', 'name-container', [ createElement('div', 'name', toLines(item.name)) ]),
            ])
            element.style.left = `${(mapPosition.x + item.offset.x)* 100}%`
            element.style.top = `${(mapPosition.y + item.offset.y)* 100}%`
            element.style.zIndex = Math.round(mapPosition.y * 1000)

            this.element.append(element)

            element.addEventListener('click', () =>
            {
                this.game.player.respawn(item.respawnName, () =>
                {
                    this.game.view.focusPoint.isTracking = true
                })
                this.game.modals.close()
            })
        }
    }

    setPlayer()
    {
        this.player = {}
        this.player.element = this.element.querySelector('.js-player')
        this.player.roundedPosition = { x: 0, y: 0 }
    }

    setTexture()
    {
        this.texture = {}
        this.texture.element = this.element.querySelector('.js-texture')
        this.texture.previousUrl = null

        this.texture.element.addEventListener('load', () =>
        {
            this.texture.element.classList.add('is-visible')
        })

        this.texture.update = () =>
        {
            const url = this.game.dayCycles.isInInterval('night') ? 'ui/map/map-night.webp' : 'ui/map/map-day.webp'

            if(url !== this.texture.previousUrl)
            {
                this.texture.element.classList.remove('is-visible')
                this.texture.previousUrl = url
                this.texture.element.src = worldAsset(url)
            }
        }
    }

    setTrigger()
    {
        const element = this.game.domElement.querySelector('.js-map-trigger')

        element.addEventListener('click', (event) =>
        {
            this.game.modals.open('map')
        })
        element.addEventListener('keydown', (event) =>
        {
            event.preventDefault()
        })
    }

    setInputs()
    {
        this.game.inputs.addActions([
            { name: 'map', categories: [ 'modal', 'menu', 'wandering' ], keys: [ 'Keyboard.m', 'Keyboard.KeyM' ] },
        ])
        this.game.inputs.events.on('map', (action) =>
        {
            if(action.active)
            {
                if(!this.modal.isOpen)
                    this.game.modals.open('map')
                else
                    this.game.modals.close()
            }
        })
    }

    worldToMap(coordinates)
    {
        let x = coordinates.x
        let y = typeof coordinates.z !== 'undefined' ? coordinates.z : coordinates.y

        x /= this.game.terrain.size
        y /= this.game.terrain.size

        x += 0.5
        y += 0.5

        x = clamp(x, 0, 1)
        y = clamp(y, 0, 1)

        return { x, y }
    }

    update()
    {
        if(!this.modal.isOpen)
            return

        const playerRoundedX = Math.round(this.game.player.position.x)
        const playerRoundedY = Math.round(this.game.player.position.z)

        if(playerRoundedX !== this.player.roundedPosition.x || playerRoundedY !== this.player.roundedPosition.y)
        {
            this.player.roundedPosition.x = playerRoundedX
            this.player.roundedPosition.y = playerRoundedY

            const playerCoordinates = this.worldToMap(this.player.roundedPosition)
            const x = Math.round(playerCoordinates.x * 1000) / 10
            const y = Math.round(playerCoordinates.y * 1000) / 10

            this.player.element.style.left = `${x}%`
            this.player.element.style.top = `${y}%`
            this.player.element.style.transform = `rotate(${-this.game.physicalVehicle.yRotation}rad)`
        }
    }
}
