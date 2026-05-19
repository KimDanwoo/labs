import {
  ELEMENT_EMOJI,
  ELEMENT_KR,
  STEM_ELEMENT,
} from '@views/destiny-result/constants';

import type { FiveElementAnalysis } from '@entities/destiny/lib';
import type { HeavenlyStem } from '@entities/destiny/model';

import { CharacterBubble } from './CharacterBubble';
import { DataSection } from './DataSection';
import { ElementBarLight } from './ElementBarLight';
import { SectionTitle } from './SectionTitle';

type ElementSectionProps = {
  fiveElements: FiveElementAnalysis;
  dayStem: HeavenlyStem;
};

export function ElementSection({ fiveElements, dayStem }: ElementSectionProps) {
  const dayEl = STEM_ELEMENT[dayStem];
  const dominantEls = fiveElements.dominant
    .map((e) => ELEMENT_KR[e])
    .join(', ');
  const missingEls = fiveElements.missing;

  return (
    <>
      <CharacterBubble
        imageSrc="/bubble_2.png"
        text={`오행 에너지 분포를\n함께 분석해볼게요.`}
      />
      <DataSection>
        <SectionTitle
          title={`${ELEMENT_EMOJI[dayEl]} 오행 에너지`}
          sub={`강한 기운: ${dominantEls}${missingEls.length > 0 ? ` · 부족: ${missingEls.map((e) => ELEMENT_KR[e]).join(', ')}` : ' · 균형 잡힌 사주!'}`}
        />
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <ElementBarLight fiveElements={fiveElements} />
        </div>
      </DataSection>
    </>
  );
}
