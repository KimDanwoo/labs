import { Events } from './events'

export class Viewport
{
    constructor(domElement)
    {
        this.domElement = domElement

        this.events = new Events()

        this.measure()
        this.setResize()
    }

    measure()
    {
        const bounding = this.domElement.getBoundingClientRect()

        this.width = bounding.width
        this.height = bounding.height
        this.ratio = this.width / this.height

        this.pixelRatioPure = window.devicePixelRatio
        const isCompact = matchMedia('(pointer: coarse)').matches || this.width < 760
        const pixelBudget = isCompact ? 1500000 : 4000000
        const areaRatio = Math.sqrt(pixelBudget / Math.max(1, this.width * this.height))
        this.pixelRatioMax = Math.min(isCompact ? 1.5 : 2, areaRatio)
        this.pixelRatio = Math.min(this.pixelRatioPure, this.pixelRatioMax)
    }

    setResize()
    {
        const throttleDuration = 400
        let throttleTimeout = null
        addEventListener('resize', () =>
        {
            this.measure()
            this.events.trigger('change')

            if(throttleTimeout)
            {
                clearTimeout(throttleTimeout)
            }

            throttleTimeout = setTimeout(() =>
            {
                throttleTimeout = null
                this.events.trigger('throttleChange')
            }, throttleDuration)
        })
    }
}