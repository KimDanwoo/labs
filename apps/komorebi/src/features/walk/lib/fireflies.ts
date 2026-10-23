import * as THREE from 'three';

const COUNT = 36;
const SIZE = 16;

/**
 * Night-only glow points drifting over the painting. Positions and blinking live in the shader, so the CPU only
 * advances one clock; with reduced motion the clock stops and the lights hold still.
 */
export function createFireflies(scene: THREE.Scene) {
  let seed = 1_297;
  const random = () => {
    seed = (seed * 1_664_525 + 1_013_904_223) >>> 0;
    return seed / 4_294_967_296;
  };
  const positions = new Float32Array(COUNT * 3);
  const phases = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    positions[i * 3] = random() * 110 - 55;
    positions[i * 3 + 1] = random() * 50 - 30;
    positions[i * 3 + 2] = 3;
    phases[i] = random() * Math.PI * 2;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, night: { value: 0 }, size: { value: SIZE } },
    vertexShader: `attribute float phase; uniform float time; uniform float size; varying float glow;
      void main(){
        vec3 p=position;
        p.x+=sin(time*.31+phase*3.)*1.6;
        p.y+=sin(time*.47+phase)*1.1;
        glow=pow(.5+.5*sin(time*1.7+phase*5.),3.);
        gl_PointSize=size*(.55+glow*.45);
        gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
      }`,
    fragmentShader: `uniform float night; varying float glow;
      void main(){
        float d=length(gl_PointCoord-.5);
        float a=smoothstep(.5,0.,d)*night*(.25+glow*.75);
        gl_FragColor=vec4(vec3(.86,1.,.52)*a,a);
      }`,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geometry, material);
  points.renderOrder = 5;
  points.visible = false;
  scene.add(points);
  return {
    update(elapsed: number, darkness: number, isStill: boolean) {
      points.visible = darkness > 0.01;
      material.uniforms.night!.value = darkness;
      if (!isStill) material.uniforms.time!.value = elapsed;
    },
    dispose() {
      scene.remove(points);
      geometry.dispose();
      material.dispose();
    },
  };
}
