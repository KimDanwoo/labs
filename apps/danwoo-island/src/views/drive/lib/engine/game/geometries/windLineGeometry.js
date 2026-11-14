import * as THREE from 'three/webgpu'
import { LineGeometry } from './lineGeometry'

export class WindLineGeometry extends LineGeometry
{
    constructor(length = 10, handlesCount = 4, amplitude = 1, divisions = 30)
    {
        const halfExtent = length / 2
        const handleSpan = length / (handlesCount - 1)
        const handles = []

        for(let i = 0; i < handlesCount; i++)
        {
            handles.push(new THREE.Vector3(
                0,
                i % 2 - 0.5 * amplitude,
                - halfExtent + i * handleSpan
            ))
        }

        const curve = new THREE.CatmullRomCurve3(handles)
        const points = curve.getPoints(divisions)

        super(points)

        this.type = 'WindLineGeometry'

        this.parameters = {
            length,
            handlesCount,
            amplitude,
            divisions
        }
    }
}