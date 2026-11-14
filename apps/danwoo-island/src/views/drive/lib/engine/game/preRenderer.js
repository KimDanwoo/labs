import * as THREE from 'three/webgpu'
import { getGame } from './gameContext'
import CubeRenderTarget from 'three/src/renderers/common/CubeRenderTarget.js'

export class PreRenderer
{
    static render()
    {
        const game = getGame()

        const renderTarget = new CubeRenderTarget(32)

        const cubeCamera = new THREE.CubeCamera(1, 100000, renderTarget)
        game.scene.add(cubeCamera)

        const invisibles = []
        game.scene.traverse((child) =>
        {
            if(child.visible === false && typeof child.userData.preventPreRender === 'undefined')
            {
                child.visible = true
                invisibles.push(child)
            }
        })

        cubeCamera.update(game.rendering.renderer, game.scene)

        for(const child of invisibles)
            child.visible = false
        cubeCamera.removeFromParent()
        renderTarget.dispose()
    }
}