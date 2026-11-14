import * as THREE from 'three/webgpu'
import { getGame } from '../gameContext'
import { Fn, color, float, frontFacing, If, max, mix, normalWorld, positionWorld, vec2, vec3, vec4 } from 'three/tsl'

export class MeshDefaultMaterial extends THREE.MeshLambertNodeMaterial
{
    static revealDiscardNodeBuilder = (game, outputColor) =>
    {
        return Fn(([ outputColor ]) =>
        {
            const distanceToCenter = positionWorld.xz.sub(game.reveal.position2Uniform).length()
            distanceToCenter.greaterThan(game.reveal.distance).discard()

            const revealMix = distanceToCenter.step(game.reveal.distance.sub(game.reveal.thickness))
            const revealColor = game.reveal.color.mul(game.reveal.intensity)
            return mix(outputColor.rgb, revealColor, revealMix)
        })(outputColor)
    }

    constructor(parameters = {})
    {
        super()

        this.game = getGame()

        this.depthWrite = parameters.depthWrite ?? true
        this.depthTest = parameters.depthTest ?? true
        this.side = parameters.side ?? THREE.FrontSide
        this.wireframe = parameters.wireframe ?? false
        this.transparent = parameters.transparent ?? false
        this.shadowSide = parameters.shadowSide ?? THREE.FrontSide

        this.hasCoreShadows = parameters.hasCoreShadows ?? true
        this.hasDropShadows = parameters.hasDropShadows ?? true
        this.hasLightBounce = parameters.hasLightBounce ?? true
        this.hasFog = parameters.hasFog ?? true
        this.hasWater = parameters.hasWater ?? true
        this.hasReveal = parameters.hasReveal ?? true

        this._colorNode = parameters.colorNode ?? color(0xffffff)
        this._normalNode = parameters.normalNode ?? normalWorld
        this._alphaNode = parameters.alphaNode ?? float(1)
        this._shadowNode = parameters.shadowNode ?? float(0)
        this.alphaTest = parameters.alphaTest ?? 0.1

        this.normalNode = this._normalNode

        const catchedShadow = float(1).toVar()

        if(this.hasDropShadows)
        {
            this.receivedShadowNode = Fn(([ shadow ]) =>
            {
                catchedShadow.mulAssign(shadow.r)
                return float(1)
            })
        }

        this.outputNode = Fn(() =>
        {
            const baseColor = this._colorNode.toVar()
            const outputColor = this._colorNode.toVar()

            const reorientedNormal = this._normalNode.toVar()
            if(this.side === THREE.DoubleSide || this.side === THREE.BackSide)
            {
                If(frontFacing.not(), () => { reorientedNormal.mulAssign(-1) })
            }

            if(this.hasLightBounce)
            {
                const bounceOrientation = reorientedNormal.dot(vec3(0, - 1, 0)).smoothstep(this.game.lighting.lightBounceEdgeLow, this.game.lighting.lightBounceEdgeHigh)
                const bounceDistance = this.game.lighting.lightBounceDistance.sub(max(0, positionWorld.y)).div(this.game.lighting.lightBounceDistance).max(0).pow(2)
                const terrainData = this.game.terrain.terrainNode(positionWorld.xz)
                const bounceColor = this.game.terrain.colorNode(terrainData)
                outputColor.assign(mix(outputColor, bounceColor, bounceOrientation.mul(bounceDistance).mul(this.game.lighting.lightBounceMultiplier)))
            }

            if(this.hasWater)
            {
                const nearWaterSurface = positionWorld.y.sub(this.game.water.surfaceElevationUniform).abs().greaterThan(this.game.water.surfaceThicknessUniform)
                outputColor.assign(nearWaterSurface.select(outputColor, color('#ffffff')))
                baseColor.assign(nearWaterSurface.select(baseColor, color('#ffffff')))
            }

            outputColor.mulAssign(this.game.lighting.colorUniform.mul(this.game.lighting.intensityUniform))

            let coreShadowMix = float(0)
            if(this.hasCoreShadows)
                coreShadowMix = reorientedNormal.dot(this.game.lighting.directionUniform).smoothstep(this.game.lighting.coreShadowEdgeHigh, this.game.lighting.coreShadowEdgeLow)

            let dropShadowMix = float(0)
            if(this.hasDropShadows)
                dropShadowMix = catchedShadow.oneMinus()

            if(this.hasCoreShadows || this.hasDropShadows)
            {
                const combinedShadowMix = max(coreShadowMix, dropShadowMix, this._shadowNode).clamp(0, 1)

                const shadowColor = baseColor.rgb.mul(this.game.lighting.shadowColor).rgb
                outputColor.assign(mix(outputColor, shadowColor, combinedShadowMix))
            }

            if(this.hasFog)
                outputColor.assign(this.game.fog.strength.mix(outputColor, this.game.fog.color))

            this._alphaNode.lessThan(this.alphaTest).discard()

            if(this.hasReveal)
                outputColor.assign(MeshDefaultMaterial.revealDiscardNodeBuilder(this.game, outputColor))

            return vec4(outputColor, this._alphaNode)
        })()
    }
}