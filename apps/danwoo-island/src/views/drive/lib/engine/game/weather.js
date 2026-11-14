import { autoBinding } from './utilities/autoBinding'
import gsap from 'gsap'
import { Game } from './game'
import { lerp, remapClamp } from './utilities/maths'

export class Weather
{
    constructor()
    {
        this.game = Game.getInstance()

        // Debug

        this.properties = []
        this.setOverride()

        // Temperature
        this.addProperty(
            'temperature',
            -15,
            40,
            () =>
            {
                const yearValue = this.game.yearCycles.properties.temperature.value
                const dayValue = this.game.dayCycles.properties.temperature.value

                const frequency = 0.4
                const amplitude = 7.5
                const variation = this.noise(this.game.dayCycles.absoluteProgress * frequency) * amplitude

                return yearValue + dayValue + variation
            }
        )

        // Humidity
        this.addProperty(
            'humidity',
            0,
            1,
            () =>
            {
                const yearValue = this.game.yearCycles.properties.humidity.value

                const frequency = 0.36
                const amplitude = 0.2
                const variation = this.noise(this.game.dayCycles.absoluteProgress * frequency) * amplitude

                return yearValue + variation
            }
        )

        // Electric field
        this.addProperty(
            'electricField',
            -1,
            1,
            () =>
            {
                const dayValue = this.game.dayCycles.properties.electricField.value
                
                const frequency = 0.53
                const amplitude = 1
                const variation = this.noise(this.game.dayCycles.absoluteProgress * frequency) * amplitude

                return dayValue * variation
            }
        )

        // Clouds
        this.addProperty(
            'clouds',
            -1,
            1,
            () =>
            {
                const frequency = 0.44
                const amplitude = 1
                const variation = this.noise(this.game.dayCycles.absoluteProgress * frequency) * amplitude
                return variation
            }
        )

        // Wind
        this.addProperty(
            'wind',
            0,
            1,
            () =>
            {
                const frequency = 1
                const variation = this.noise(this.game.dayCycles.absoluteProgress * frequency) * 0.5 + 0.5
                return variation
            }
        )

        // Rain
        this.addProperty(
            'rain',
            0,
            1,
            () =>
            {
                return remapClamp(this.humidity.value, 0.65, 1, 0, 1) * remapClamp(this.clouds.value, 0, 1, 0, 1)
            }
        )

        // Snow
        this.addProperty(
            'snow',
            -1,
            1,
            () =>
            {
                const rainRatio = remapClamp(this.rain.value, 0.05, 0.3, 0, 1)
                const freezeRatio = remapClamp(this.temperature.value, 0, -5, 0, 1)
                const meltRatio = remapClamp(this.temperature.value, 0, 10, 0, -1)

                return rainRatio * freezeRatio + meltRatio
            }
        )
        
        this.game.ticker.events.on('tick', () =>
        {
            this.update()
        }, 8)
    }

    noise(x)
    {
        return Math.sin(x) * Math.sin(x * 1.678) * Math.sin(x * 2.345)
    }

    addProperty(name, min, max, get)
    {
        const property = {}
        property.name = name
        property.min = min
        property.max = max

        property.value = get()
        property.overrideValue = null

        // Debug
        property.binding = autoBinding(property, 'value', () =>
            {
                let value = get()
                
                if(this.override.strength > 0 && property.overrideValue !== null)
                {
                    value = lerp(value, property.overrideValue, this.override.strength)

                    // if(name === 'humidity')
                    // {
                    //     console.log(value)
                    // }
                }
                
                return value
            })


        this[name] = property
        this.properties.push(property)
    }

    setOverride()
    {
        this.override = {}
        this.override.strength = 0
        
        this.override.start = (values = {}, duration = 5) =>
        {
            for(const property of this.properties)
            {
                if(typeof values[property.name] !== 'undefined')
                    property.overrideValue = values[property.name]
                else
                    property.overrideValue = null
            }

            if(duration === 0)
                this.override.strength = 1
            else
                gsap.to(this.override, { strength: 1, duration, overwrite: true })
        }

        this.override.end = (duration = 5) =>
        {
            if(duration === 0)
                this.override.strength = 0
            else
                gsap.to(this.override, { strength: 0, duration, overwrite: true })
        }
    }

    update()
    {
        for(const property of this.properties)
            property.binding.update()
    }
}