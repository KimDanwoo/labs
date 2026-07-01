import type { FiveElement } from '../model/types';

import type { BodyStrengthAnalysis } from './bodyStrengthAnalysis';
import type { FiveElementAnalysis } from './fiveElements';

type YongsinAnalysis = {
  yongsin: FiveElement;
  kijin: FiveElement;
  yongsinDesc: string;
};

// 오행 상생: 木→火→土→金→水→木
const GENERATES: Record<FiveElement, FiveElement> = {
  木: '火',
  火: '土',
  土: '金',
  金: '水',
  水: '木',
};

// 오행 상극: 木→土→水→火→金→木
const CONTROLS: Record<FiveElement, FiveElement> = {
  木: '土',
  土: '水',
  水: '火',
  火: '金',
  金: '木',
};

// 역방향 조회용: 나를 극하는 오행
const CONTROLLED_BY: Record<FiveElement, FiveElement> = {
  土: '木',
  水: '土',
  火: '水',
  金: '火',
  木: '金',
};

const YONGSIN_DESCS: Record<FiveElement, string> = {
  木: '나무의 기운이 삶의 에너지원이에요. 성장과 추진력을 발휘할 때 흐름이 잘 타요. 새로운 시작, 창의적인 프로젝트, 동쪽과 봄의 기운이 도움이 돼요.',
  火: '불의 기운이 삶의 에너지원이에요. 열정과 표현력을 발휘할 때 활력이 넘쳐요. 사람과 어울리고 빛나는 환경, 남쪽과 여름의 기운이 긍정적으로 작용해요.',
  土: '땅의 기운이 삶의 안정 기반이에요. 꾸준함과 현실적 판단이 빛을 발하는 때에 성과가 나요. 중심을 잡고 내실을 다지는 방향이 삶의 흐름을 안정시켜요.',
  金: '쇠의 기운이 삶의 에너지원이에요. 결단력과 정밀함이 발휘될 때 강점이 드러나요. 원칙을 세우고 명확한 기준으로 움직이는 환경이 흐름을 좋게 해요.',
  水: '물의 기운이 삶의 에너지원이에요. 지혜와 유연성이 빛을 발하는 환경에서 잠재력이 열려요. 깊이 생각하고 적응하는 방향이 삶의 질을 높여줘요.',
};

function pickLeastFrom(
  candidates: FiveElement[],
  counts: Record<FiveElement, number>,
): FiveElement {
  return candidates.reduce((min, el) => (counts[el] < counts[min] ? el : min));
}

function analyzeYongsin(
  fiveElements: FiveElementAnalysis,
  bodyStrength: BodyStrengthAnalysis,
): YongsinAnalysis {
  const { dayMasterElement, counts } = fiveElements;
  const { strength } = bodyStrength;

  let yongsin: FiveElement;
  let kijin: FiveElement;

  if (strength === 'strong') {
    // 신강: 일간을 소모시키는 오행 필요
    const candidates: FiveElement[] = [
      GENERATES[dayMasterElement], // 식상 오행 (일간이 생하는)
      CONTROLS[dayMasterElement], // 재성 오행 (일간이 극하는)
      CONTROLLED_BY[dayMasterElement], // 관성 오행 (일간을 극하는)
    ];
    yongsin = pickLeastFrom(candidates, counts);
    // 기신: 일간을 강화하는 오행
    kijin = GENERATES[CONTROLLED_BY[dayMasterElement]]; // 인성 (일간을 생하는)
  } else if (strength === 'weak') {
    // 인성 오행 = 일간을 생하는 오행 = GENERATES[X] === dayMaster → X
    const inseong = (
      Object.entries(GENERATES) as [FiveElement, FiveElement][]
    ).find(([, v]) => v === dayMasterElement)?.[0] as FiveElement;

    // 신약: 일간을 강화하는 오행 필요 (비겁 vs 인성 중 부족한 것)
    yongsin = pickLeastFrom([dayMasterElement, inseong], counts);
    // 기신: 일간을 소모하는 오행
    kijin = GENERATES[dayMasterElement]; // 식상 (일간이 생하는)
  } else {
    // 중화: dominant 오행의 상극 오행
    const dominant = fiveElements.dominant[0] ?? dayMasterElement;
    yongsin = CONTROLLED_BY[dominant]; // dominant를 극하는 오행
    kijin = GENERATES[dominant]; // dominant가 생하는 오행
  }

  return {
    yongsin,
    kijin,
    yongsinDesc: YONGSIN_DESCS[yongsin],
  };
}

// 일간 오행 기준 인성 오행 계산 (외부 참조용)
function getInseongElement(dayMasterElement: FiveElement): FiveElement {
  return (Object.entries(GENERATES) as [FiveElement, FiveElement][]).find(
    ([, v]) => v === dayMasterElement,
  )?.[0] as FiveElement;
}

export { analyzeYongsin, getInseongElement };
export type { YongsinAnalysis };
