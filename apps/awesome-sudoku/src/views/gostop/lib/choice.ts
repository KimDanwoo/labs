import { CARD_KIND } from '@views/gostop/config/cards';
import { CHOICE_COPY, KIND_LABEL } from '@views/gostop/config/copy';
import { CHOICE_DIRECTION, CHOICE_LIFT, CHOICE_SPREAD } from '@views/gostop/config/floor';
import { cardOf, monthOf } from '@views/gostop/lib/cards';
import { floorPose, poseStyle } from '@views/gostop/lib/floorPose';
import { cardLabel } from '@views/gostop/lib/view';
import type { FloorChoice } from '@views/gostop/model/types/gostop';

export type ChoiceRole = 'candidate' | 'dimmed' | 'none';

export interface ChoicePoseStyle {
  rotate: string;
  translate: string;
}

export function choiceKindLabel(id: number): string {
  const card = cardOf(id);
  const isSsangPi = card.kind === CARD_KIND.PI && card.piValue > 1;
  return isSsangPi ? CHOICE_COPY.ssangPi : KIND_LABEL[card.kind];
}

export const choicePickLabel = (id: number): string => `${cardLabel(id)} ${CHOICE_COPY.pick}`;

export function choicePoseStyle(id: number, stackIndex: number): ChoicePoseStyle {
  const spread = CHOICE_SPREAD[CHOICE_DIRECTION[monthOf(id)] ?? 'center'];
  const x = spread[Math.min(stackIndex, spread.length - 1)] ?? 0;
  return {
    rotate: '0deg',
    translate: `calc(var(--floor-card) * ${x}) calc(var(--floor-card) * ${-CHOICE_LIFT} - var(--stack-step) * ${stackIndex})`,
  };
}

export function choiceRoleOf(choice: FloorChoice | null, id: number): ChoiceRole {
  if (!choice) return 'none';
  return choice.options.includes(id) ? 'candidate' : 'dimmed';
}

export function floorCardPose(id: number, stackIndex: number, isGathering: boolean, role: ChoiceRole): ChoicePoseStyle {
  if (role === 'candidate') return choicePoseStyle(id, stackIndex);
  return poseStyle(floorPose(id, stackIndex, isGathering));
}
