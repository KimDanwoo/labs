import { ELEMENT_KR, STEM_ELEMENT } from '@views/destiny-result/constants';

import type { FiveElementAnalysis } from '@entities/destiny/lib';
import type { HeavenlyStem } from '@entities/destiny/model';

import { CharacterBubble } from './CharacterBubble';
import { DataSection } from './DataSection';
import { ElementBarLight } from './ElementBarLight';
import { ElementCycleChart } from './ElementCycleChart';
import { SectionTitle } from './SectionTitle';

type ElementSectionProps = {
  fiveElements: FiveElementAnalysis;
  dayStem: HeavenlyStem;
};

function getElementComment(dominant: string[], missing: string[]): string {
  if (missing.length > 0) {
    return `${missing.join(', ')}의 기운이 부족해요.\n보완하면 균형이 좋아질 거예요!`;
  }
  if (dominant.length === 1) {
    return `${dominant[0]}의 기운이 강하네요!\n아래 상생·상극 관계를\n확인해보세요.`;
  }
  return '오행이 고르게 분포되어 있어요!\n균형 잡힌 좋은 사주예요.';
}

export function ElementSection({ fiveElements, dayStem }: ElementSectionProps) {
  const dayEl = STEM_ELEMENT[dayStem];
  const dominantKr = fiveElements.dominant.map((e) => ELEMENT_KR[e]);
  const missingKr = fiveElements.missing.map((e) => ELEMENT_KR[e]);

  return (
    <>
      <CharacterBubble
        imageSrc="/bubble_2.webp"
        text={`오행 에너지 분포를\n함께 분석해볼게요.`}
      />
      <DataSection>
        <SectionTitle
          title={`${ELEMENT_KR[dayEl]}의 오행 에너지`}
          sub={`강한 기운: ${dominantKr.join(', ')}${missingKr.length > 0 ? ` · 부족: ${missingKr.join(', ')}` : ' · 균형 잡힌 사주!'}`}
        />
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <ElementBarLight fiveElements={fiveElements} />
        </div>
      </DataSection>

      <CharacterBubble
        imageSrc="/bubble_3.webp"
        text={getElementComment(dominantKr, missingKr)}
      />

      <DataSection>
        <ElementCycleChart />
      </DataSection>
    </>
  );
}
