import type { PointAlign } from '../../interactivePointArt';
import type { Area } from './area';

export function interactButtons(area: Area): { onReveal: () => void; onConceal: () => void; onHide: () => void } {
  const { interactiveButtons } = area.game.inputs;
  return {
    onReveal: () => interactiveButtons.addItems(['interact']),
    onConceal: () => interactiveButtons.removeItems(['interact']),
    onHide: () => interactiveButtons.removeItems(['interact']),
  };
}

export function createAreaPoint(
  area: Area,
  { text, align, onInteract }: { text: string; align: PointAlign; onInteract: () => void },
): void {
  area.game.interactivePoints.create({
    position: area.requireReference('interactivePoint').position,
    text,
    align,
    state: 'concealed',
    onInteract,
    ...interactButtons(area),
  });
}

export function playGroups(area: Area, names: readonly string[]): void {
  for (const name of names) area.game.audio.groups.get(name)?.play();
}
