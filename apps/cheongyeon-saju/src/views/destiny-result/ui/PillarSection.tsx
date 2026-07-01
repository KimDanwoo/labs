import type { VoidAnalysis } from '@entities/destiny/lib';
import type { DestinyFormData, FourPillars } from '@entities/destiny/model';

import { CharacterBubble } from './CharacterBubble';
import { DataSection } from './DataSection';
import { PillarCardLight } from './PillarCardLight';
import { SectionTitle } from './SectionTitle';

type PillarSectionProps = {
  fourPillars: FourPillars;
  input: DestinyFormData;
  displayName: string;
  voidAnalysis: VoidAnalysis;
};

export function PillarSection({
  fourPillars,
  input,
  displayName,
  voidAnalysis,
}: PillarSectionProps) {
  const isVoidBranch = (branch: string) =>
    voidAnalysis.voidBranches.includes(branch as never);

  return (
    <>
      <CharacterBubble
        imageSrc="/bubble_1.webp"
        text={`${displayName}님의 사주팔자를\n살펴볼게요!`}
      />
      <DataSection>
        <SectionTitle
          title="사주팔자"
          sub={`${input.year}년 ${input.month}월 ${input.day}일 · ${input.gender === 'male' ? '남' : '여'}`}
        />
        <div className="border-b border-gray-100 mb-4" />
        <div className="grid grid-cols-4 gap-2">
          <PillarCardLight
            label="시주"
            pillar={fourPillars.hour}
            isVoid={isVoidBranch(fourPillars.hour.branch)}
          />
          <PillarCardLight
            label="일주"
            pillar={fourPillars.day}
            isVoid={isVoidBranch(fourPillars.day.branch)}
          />
          <PillarCardLight
            label="월주"
            pillar={fourPillars.month}
            isVoid={isVoidBranch(fourPillars.month.branch)}
          />
          <PillarCardLight
            label="년주"
            pillar={fourPillars.year}
            isVoid={isVoidBranch(fourPillars.year.branch)}
          />
        </div>
      </DataSection>
    </>
  );
}
