import content from '@views/drive/lib/engine/data/danwoo';
import type { Area } from '@views/drive/lib/engine/game/world/areas/area';
import { interactButtons } from '@views/drive/lib/engine/game/world/areas/areaPoint';
import { LINK_ELEVATION, LINK_MODELS } from '@views/drive/lib/engine/game/world/areas/socialAreaConfig';

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
