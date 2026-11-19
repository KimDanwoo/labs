import content from '../../../data/danwoo';
import type { Area } from './area';
import { interactButtons } from './areaPoint';
import { LINK_ELEVATION, LINK_MODELS } from './socialAreaConfig';

export function createSocialLinks(area: Area): void {
  for (const link of content.social) {
    const modelName = LINK_MODELS.get(link.name);
    const object = area.objects.items.find((item) => item.visual?.object3D.name === modelName);
    if (!object?.visual) continue;
    const position = object.visual.object3D.position.clone();
    position.y = LINK_ELEVATION;
    area.game.interactivePoints.create({
      position,
      text: link.name,
      align: link.align === 'left' ? 'left' : 'right',
      state: 'concealed',
      onInteract: () => window.open(link.url, '_blank', 'noopener,noreferrer'),
      ...interactButtons(area),
    });
  }
}
