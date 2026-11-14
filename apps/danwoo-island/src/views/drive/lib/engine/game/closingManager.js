import { getGame } from './gameContext'
import { Inputs } from './inputs/inputs'
import { Menu } from './menu'
import { Modals } from './modals'
import { CircuitArea } from './world/areas/circuitArea'
import { LabArea } from './world/areas/labArea'
import { ProjectsArea } from './world/areas/projectsArea'

export class ClosingManager
{
    constructor()
    {
        this.game = getGame()

        this.game.inputs.addActions([
            { name: 'close', categories: [ 'modal', 'menu', 'racing', 'cinematic', 'wandering' ], keys: [ 'Keyboard.Escape', 'Gamepad.cross' ] },
            { name: 'pause', categories: [ 'modal', 'menu', 'racing', 'cinematic', 'wandering' ], keys: [ 'Gamepad.start' ] }
        ])

        this.game.inputs.events.on('close', (action) =>
        {
            if(action.active)
            {
                if(this.game.modals.state === Modals.OPEN)
                    this.game.modals.close()

                else if(this.game.menu.state === Menu.OPEN || (this.game.inputs.mode !== Inputs.MODE_GAMEPAD && this.game.menu.state === Menu.OPENING))
                    this.game.menu.close()

                else if(this.game.world.areas?.circuit?.state === CircuitArea.STATE_RUNNING || this.game.world.areas?.circuit?.state === CircuitArea.STATE_STARTING)
                    this.game.menu.open('circuit')

                else if(this.game.world.areas?.projects && (this.game.world.areas?.projects.state === ProjectsArea.STATE_OPEN || this.game.world.areas?.projects.state === ProjectsArea.STATE_OPENING))
                    this.game.world.areas.projects.close()

                else if(this.game.world.areas?.lab && (this.game.world.areas?.lab.state === LabArea.STATE_OPEN || this.game.world.areas?.lab.state === LabArea.STATE_OPENING))
                    this.game.world.areas.lab.close()

                else if(action.activeKeys.has('Keyboard.Escape'))
                    this.game.menu.open()
            }
        })

        this.game.inputs.events.on('pause', (action) =>
        {
            if(action.active)
            {
                if(this.game.menu.state === Menu.OPEN || this.game.menu.state === Menu.OPENING)
                {
                    this.game.menu.close()
                }
                else
                {
                    this.game.menu.open('home')
                }
            }
        })

        this.game.modals.events.on('open', () =>
        {
            if(this.game.menu.state === Menu.OPEN || this.game.menu.state === Menu.OPENING)
                this.game.menu.close()
        })

        this.game.menu.events.on('open', () =>
        {
            if(this.game.modals.state === Modals.OPEN || this.game.modals.state === Modals.OPENING)
                this.game.modals.close()
        })

        const modalMenuCloseCallback = () =>
        {
            this.game.inputs.filters.clear()

            if(
                this.game.world.areas?.circuit?.state === CircuitArea.STATE_RUNNING ||
                this.game.world.areas?.circuit?.state === CircuitArea.STATE_STARTING ||
                this.game.world.areas?.circuit?.state === CircuitArea.STATE_ENDING
            )
            {
                this.game.inputs.filters.add('racing')
            }
            else
            {
                this.game.inputs.filters.add('wandering')
            }
        }
        this.game.modals.events.on('close', modalMenuCloseCallback)
        this.game.menu.events.on('close', modalMenuCloseCallback)
    }
}
