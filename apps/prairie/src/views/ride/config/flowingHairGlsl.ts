export const HAIR_COMMON_GLSL = `#include <common>
      attribute float aLength, aStrand;
      uniform vec3 uTop, uBottom;
      uniform float uTime, uFlow, uTail, uStrandCount;
      vec3 hairCenter(float t, float strand) {
        float rootT = strand / (uStrandCount - 1.0);
        float phase = strand * 2.39996;
        vec3 center;
        if (uTail > 0.5) {
          float spread = sqrt((strand + 0.5) / uStrandCount);
          center = mix(uTop, uBottom, t);
          center.x += cos(phase) * spread * (0.1 + sin(t * 2.4) * 0.3);
          center.z += sin(phase) * spread * 0.16;
          center.z -= t * t * (0.35 + uFlow * 0.5);
          center.y -= t * t * (0.12 + 0.16 * sin(phase));
        } else {
          center = mix(uTop, uBottom, rootT);
          float length = 0.92 + sin(rootT * 3.14159) * 0.36;
          center += vec3(0.32 + rootT * 0.18, -length, -0.14 - uFlow * 0.38) * t;
          center.x += sin(t * 3.14159) * 0.2;
          center.y += sin(phase) * 0.08 * t * t;
        }
        center.x += sin(uTime * 2.8 - t * 5.0 + strand * 0.3) * (0.025 + uFlow * 0.07) * t * t;
        center.y += sin(uTime * 2.0 + strand * 0.25) * 0.025 * t;
        return center;
      }
      mat3 hairFrame(float t, float strand) {
        vec3 tangent = normalize(hairCenter(t + 0.002, strand) - hairCenter(t - 0.002, strand));
        vec3 across = normalize(cross(vec3(1.0, 0.0, 0.0), tangent));
        return mat3(normalize(cross(tangent, across)), tangent, across);
      }`;

export const HAIR_NORMAL_GLSL = `#include <beginnormal_vertex>
        objectNormal = hairFrame(aLength, aStrand) * objectNormal;`;

export const HAIR_VERTEX_GLSL = `vec3 transformed = hairCenter(aLength, aStrand)
          + hairFrame(aLength, aStrand) * vec3(position.x, 0.0, position.z);`;
