import { HIDDEN_STEMS_TABLE } from '../data/hiddenStems';
import { STEM_DATA } from '../data/stems';
import type { FourPillars, TenGod } from '../model/types';

import { getTenGod } from './tenGods';

type FormatAnalysis = {
  name: string;
  tenGod: TenGod;
  desc: string;
};

const FORMAT_NAMES: Record<TenGod, string> = {
  비견: '건록격',
  겁재: '양인격',
  식신: '식신격',
  상관: '상관격',
  편재: '편재격',
  정재: '정재격',
  편관: '편관격',
  정관: '정관격',
  편인: '편인격',
  정인: '정인격',
};

const FORMAT_DESCS: Record<string, string> = {
  건록격:
    '태어날 때부터 강한 일간을 가진 격이에요. 독립심과 추진력이 강하고 자기 주도적으로 삶을 개척해나가요. 리더십이 자연스럽게 발현되고, 사회적으로 자수성가하는 경우가 많아요.',
  양인격:
    '강렬하고 날카로운 기운을 가진 격이에요. 경쟁 환경에서 강함을 발휘하고, 한번 결심하면 물러서지 않는 의지가 있어요. 무인, 스포츠, 경쟁이 치열한 분야에서 두각을 나타내요.',
  식신격:
    '풍요롭고 창의적인 복록의 격이에요. 표현력과 창의성이 뛰어나고 먹고 즐기는 것을 사랑해요. 안정적인 복이 따르며, 자신의 재능을 통해 삶의 풍요를 만들어가요.',
  상관격:
    '재능과 개성이 넘치는 자유로운 격이에요. 틀에 얽매이지 않는 창의적 발상과 뛰어난 언변이 있어요. 예술, 방송, 글쓰기, 창업 등 독창성이 빛나는 분야가 잘 맞아요.',
  편재격:
    '넓은 세계를 향해 도전하는 역동적인 격이에요. 사업 감각과 사교성이 뛰어나며, 큰 돈이 들어오고 나가는 활발한 재물운을 가져요. 변화와 새로움을 즐기는 활동적인 성향이에요.',
  정재격:
    '성실하고 꼼꼼하게 기반을 다지는 안정의 격이에요. 규칙적인 노력으로 재산을 쌓아가는 타입으로, 신뢰와 성실함으로 주변의 인정을 받아요. 안정적인 재물운과 가정운이 있어요.',
  편관격:
    '강한 카리스마와 도전 정신을 가진 격이에요. 역경 속에서 오히려 강해지는 불굴의 의지가 있고, 조직을 이끄는 강력한 리더십이 있어요. 압박과 경쟁이 있는 환경에서 진가를 발휘해요.',
  정관격:
    '질서와 명예를 중시하는 신뢰의 격이에요. 책임감과 도덕성이 강하고, 꾸준한 성과로 사회적 명예와 신뢰를 쌓아가요. 공직·전문직·대기업 등 안정적인 조직에서 빛을 발해요.',
  편인격:
    '독특한 통찰력과 전문성을 가진 격이에요. 한 분야를 깊이 파고드는 집중력과 독창적인 관점이 강점이에요. 의료·연구·철학·IT 등 전문성을 오래 쌓아야 하는 분야에서 두각을 나타내요.',
  정인격:
    '학문과 인덕이 넘치는 지혜의 격이에요. 학문적 소양이 풍부하고 사람을 이끌고 가르치는 데서 보람을 느껴요. 교육·복지·상담 등 지식과 경험을 나누는 직업이 잘 맞아요.',
};

function analyzeFormat(fourPillars: FourPillars): FormatAnalysis {
  const dayStem = fourPillars.day.stem;
  const monthBranch = fourPillars.month.branch;
  const mainStem = HIDDEN_STEMS_TABLE[monthBranch].main.stem;

  // 일간 음양 확인: 비견(양)이면 건록격, 겁재(음)이면 양인격 구분은 getTenGod이 처리
  const tenGod = getTenGod(dayStem, mainStem);

  // 월지 본기가 일간과 같은 오행인지 확인해서 건록/양인 구분
  const dayElement = STEM_DATA[dayStem].element;
  const mainElement = STEM_DATA[mainStem].element;
  let resolvedTenGod = tenGod;

  // 비견이 나오면 실제 음양 비교로 건록/양인 재확인
  if (dayElement === mainElement) {
    const dayYinYang = STEM_DATA[dayStem].yinYang;
    const mainYinYang = STEM_DATA[mainStem].yinYang;
    resolvedTenGod = dayYinYang === mainYinYang ? '비견' : '겁재';
  }

  const name = FORMAT_NAMES[resolvedTenGod];
  const desc = FORMAT_DESCS[name];

  return { name, tenGod: resolvedTenGod, desc };
}

export { analyzeFormat };
export type { FormatAnalysis };
