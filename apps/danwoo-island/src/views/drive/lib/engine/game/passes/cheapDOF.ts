import { hashBlur } from 'three/addons/tsl/display/hashBlur.js';
import { convertToTexture, Fn, mix, nodeObject, uniform, uv } from 'three/tsl';
import { Node, type TextureNode } from 'three/webgpu';

const DOF = { start: 0.2, end: 0.5, repeats: 25, amount: 0.003 } as const;

class CheapDOFNode extends Node<'vec4'> {
  static get type(): string {
    return 'CheapDOFNode';
  }

  readonly #texture: TextureNode;
  readonly start = uniform(DOF.start);
  readonly end = uniform(DOF.end);
  readonly repeats = uniform(DOF.repeats);
  readonly amount = uniform(DOF.amount);

  constructor(texture: TextureNode) {
    super('vec4');
    this.#texture = texture;
  }

  override setup(): Node<'vec4'> {
    const texture = this.#texture;
    return Fn(() => {
      const strength = uv().y.sub(0.5).abs().smoothstep(this.start, this.end);
      const blurred = hashBlur(texture, strength.mul(this.amount), { repeats: this.repeats, premultipliedAlpha: true });
      return mix(texture, blurred, strength);
    })();
  }
}

export const cheapDOF = (node: Node): Node<'vec4'> => nodeObject(new CheapDOFNode(convertToTexture(node)));
