import { Events } from './events'
import { getGame } from './gameContext'

export class Quality
{
    constructor()
    {
        this.game = getGame()

        this.events = new Events()

        const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
        this.level = isMobile ? 1 : 0
    }

    changeLevel(level = 0)
    {
        if(level === this.level)
            return

        this.level = level
        this.events.trigger('change', this.level)
    }
}