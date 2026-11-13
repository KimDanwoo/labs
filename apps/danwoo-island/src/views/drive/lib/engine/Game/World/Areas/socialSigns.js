import * as THREE from 'three/webgpu'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { color, texture, uv, vec4 } from 'three/tsl'
import { MeshDefaultMaterial } from '../../Materials/MeshDefaultMaterial.js'

const LABELS = {
    x: 'LAB', bluesky001: '✦', youtube: 'MUSIC', mail: '이력서',
    twitch: '블로그', gitHub: 'CODE', linkedIn: '⌘', discord: '∞',
    onlyfans: '바람',
}

export function personalizeSocialSigns(area)
{
    const bodyMaterial = new MeshDefaultMaterial({ colorNode: color('#c6b8a3'), hasWater: false })
    for(const object of area.objects.items)
    {
        const mesh = object.visual?.object3D
        const label = LABELS[mesh?.name]
        if(!label || !mesh.isMesh) continue
        mesh.geometry.computeBoundingBox()
        const bounds = mesh.geometry.boundingBox
        const size = bounds.getSize(new THREE.Vector3())
        const center = bounds.getCenter(new THREE.Vector3())
        const geometry = new RoundedBoxGeometry(size.x, size.y, size.z, 2, Math.min(size.x, size.y, size.z) * 0.2)
        geometry.translate(center.x, center.y, center.z)
        mesh.geometry = geometry
        mesh.material = bodyMaterial

        const canvas = document.createElement('canvas')
        canvas.width = 512
        canvas.height = 256
        const context = canvas.getContext('2d')
        context.fillStyle = '#ede7d6'
        context.font = '700 96px MaruBuri'
        context.textAlign = 'center'
        context.textBaseline = 'middle'
        context.fillText(label, 256, 128, 470)
        const map = new THREE.CanvasTexture(canvas)
        map.colorSpace = THREE.SRGBColorSpace
        const material = new THREE.MeshBasicNodeMaterial({ transparent: true, side: THREE.DoubleSide, depthWrite: false })
        material.outputNode = vec4(texture(map, uv()).rgb, texture(map, uv()).a)
        const isThinX = size.x < size.z
        const width = (isThinX ? size.z : size.x) * 0.88
        const height = Math.min(size.y * 0.8, width * 0.5)
        for(const side of [-1, 1])
        {
            const face = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material)
            face.position.copy(center)
            if(isThinX)
            {
                face.rotation.y = side * Math.PI / 2
                face.position.x += side * (size.x / 2 + 0.008)
            }
            else
            {
                face.rotation.y = side < 0 ? Math.PI : 0
                face.position.z += side * (size.z / 2 + 0.008)
            }
            mesh.add(face)
        }
    }
}
