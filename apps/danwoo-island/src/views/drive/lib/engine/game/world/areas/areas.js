import { getGame } from '../../gameContext'
import { AltarArea } from './altarArea'
import { CookieArea } from './cookieArea'
import { LandingArea } from './landingArea'
import { ProjectsArea } from './projectsArea'
import { LabArea } from './labArea'
import { CareerArea } from './careerArea'
import { SocialArea } from './socialArea'
import { ToiletArea } from './toiletArea'
import { BowlingArea } from './bowlingArea'
import { CircuitArea } from './circuitArea'
import { BehindTheSceneArea } from './behindTheSceneArea'
import { AchievementsArea } from './achievementsArea'
import { TimeMachineArea } from './timeMachineArea'
import { EasterArea } from './easterArea'
import { applyIslandTextures } from '../islandTextures'

export class Areas
{
    constructor()
    {
        this.game = getGame()

        const list = [
            [ 'achievements', AchievementsArea ],
            [ 'altar', AltarArea ],
            [ 'behindTheScene', BehindTheSceneArea ],
            [ 'bowling', BowlingArea ],
            [ 'career', CareerArea ],
            [ 'circuit', CircuitArea ],
            [ 'cookie', CookieArea ],
            [ 'lab', LabArea ],
            [ 'landing', LandingArea ],
            [ 'projects', ProjectsArea ],
            [ 'social', SocialArea ],
            [ 'toilet', ToiletArea ],
            [ 'timeMachine', TimeMachineArea ],
        ]

        applyIslandTextures(this.game.resources.areasModel.scene, this.game.resources)
        const model = [...this.game.resources.areasModel.scene.children]

        for(const child of model)
        {
            for(const [ name, AreaClass ] of list)
            {
                if(child.name.startsWith(name))
                    this[name] = new AreaClass(child)
            }
        }
    }
}