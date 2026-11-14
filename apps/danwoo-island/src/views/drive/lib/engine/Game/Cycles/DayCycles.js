import * as THREE from 'three/webgpu'
import { Cycles } from './Cycles.js'
import { WORLD_CONFIG } from '../../worldConfig.js'

const presets = {
    day:   { revealColor: new THREE.Color('#79cbd5'), revealIntensity: 12, electricField: 0, temperature: 5, lightColor: new THREE.Color('#fff5e6'), lightIntensity: 1.2, shadowColor: new THREE.Color('#8aaee8'), fogColorA: new THREE.Color('#82d5e5'), fogColorB: new THREE.Color('#c9eaf4'), fogNearRatio: 0.315, fogFarRatio: 1.25 },
    dusk:  { revealColor: new THREE.Color('#e8a18a'), revealIntensity: 5.55, electricField: 0.25, temperature: 0, lightColor: new THREE.Color('#ffb88f'), lightIntensity: 1.2, shadowColor: new THREE.Color('#7187b2'), fogColorA: new THREE.Color('#f4b493'), fogColorB: new THREE.Color('#e9b7c6'), fogNearRatio: 0, fogFarRatio: 1.25 },
    night: { revealColor: new THREE.Color('#5e8da8'), revealIntensity: 10, electricField: 1, temperature: -7.5, lightColor: new THREE.Color('#3f5d80'), lightIntensity: 3.8, shadowColor: new THREE.Color('#425d85'), fogColorA: new THREE.Color('#122c40'), fogColorB: new THREE.Color('#203b50'), fogNearRatio: -0.85, fogFarRatio: 1 },
    dawn:  { revealColor: new THREE.Color('#e8b99e'), revealIntensity: 4.85, electricField: 0.25, temperature: 0, lightColor: new THREE.Color('#ffe0bb'), lightIntensity: 1.2, shadowColor: new THREE.Color('#95accb'), fogColorA: new THREE.Color('#f5d1b2'), fogColorB: new THREE.Color('#d2e4ed'), fogNearRatio: 0.3, fogFarRatio: 1.25 },
}

export class DayCycles extends Cycles
{
    constructor()
    {
        const forcedProgress = WORLD_CONFIG.dayCycleProgress
        super('🕜 Day Cycles', 4 * 60, forcedProgress, false)
    }

    get presets()
    {
        return presets
    }

    getKeyframesDescriptions()
    {
        // Debug
        if(this.game.debug.active)
        {
            this.debugPanel.addBinding(this, 'duration', { min: 1, max: 60 * 10, step: 1 })

            for(const presetKey in presets)
            {
                const preset = presets[presetKey]
                const presetsDebugPanel = this.debugPanel.addFolder({
                    title: presetKey,
                    expanded: true,
                })

                this.game.debug.addThreeColorBinding(presetsDebugPanel, preset.revealColor, 'revealColor')
                presetsDebugPanel.addBinding(preset, 'revealIntensity', { min: 0, max: 20, step: 0.001 })
                this.game.debug.addThreeColorBinding(presetsDebugPanel, preset.lightColor, 'lightColor')
                presetsDebugPanel.addBinding(preset, 'lightIntensity', { min: 0, max: 20 })
                this.game.debug.addThreeColorBinding(presetsDebugPanel, preset.shadowColor, 'shadowColor')
                this.game.debug.addThreeColorBinding(presetsDebugPanel, preset.fogColorA, 'fogColorA')
                this.game.debug.addThreeColorBinding(presetsDebugPanel, preset.fogColorB, 'fogColorB')
                presetsDebugPanel.addBinding(preset, 'fogNearRatio', { label: 'near', min: -2, max: 2, step: 0.001 })
                presetsDebugPanel.addBinding(preset, 'fogFarRatio', { label: 'far', min: -2, max: 2, step: 0.001 })
            }
        }

        return [
            [
                { properties: presets.day, stop: 0.0 }, // day
                { properties: presets.day, stop: 0.15 }, // day
                { properties: presets.dusk, stop: 0.25 }, // Dusk
                { properties: presets.night, stop: 0.35 }, // Night
                { properties: presets.night, stop: 0.6 }, // Night
                { properties: presets.dawn, stop: 0.8 }, // Dawn
                { properties: presets.day, stop: 0.9 }, // day
            ]
        ]
    }

    getIntervalDescriptions()
    {
        return [
            { name: 'night', start: 0.25, end: 0.7 },
            { name: 'deepNight', start: 0.35, end: 0.6 },
        ]
    }
}