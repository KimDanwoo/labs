import type { DestinyFormData, DestinyResult } from '@entities/destiny/model';

const STRENGTH_LABEL: Record<string, string> = {
  strong: '신강',
  weak: '신약',
  balanced: '중화',
};

const GENDER_LABEL: Record<string, string> = {
  male: '남',
  female: '여',
};

function buildSajuContext(
  result: DestinyResult,
  form: DestinyFormData,
): string {
  const {
    fourPillars,
    fiveElements,
    tenGods,
    combinations,
    voidAnalysis,
    luck,
    bodyStrength,
    format,
    yongsin,
  } = result;
  const { year, month, day, gender } = form;
  const name = form.name ?? '이름없음';

  const { counts, dominant, missing } = fiveElements;
  const { strength, supportScore, drainScore } = bodyStrength;

  // 오행 분포 라인
  const elementDist = `木: ${counts['木']}개 / 火: ${counts['火']}개 / 土: ${counts['土']}개 / 金: ${counts['金']}개 / 水: ${counts['水']}개`;
  const dominantStr = dominant.join(', ');
  const missingStr =
    missing.length > 0 ? ` / 결핍 오행: ${missing.join(', ')}` : '';

  // 십신 구성
  const tenGodLine = [
    `년주: ${tenGods.yearStem}·${tenGods.yearBranch}`,
    `월주: ${tenGods.monthStem}·${tenGods.monthBranch}`,
    `일주: 본원·${tenGods.dayBranch}`,
    `시주: ${tenGods.hourStem}·${tenGods.hourBranch}`,
  ].join(' / ');

  // 십신 패턴 (빈도 기준 상위)
  const allGodValues = [
    tenGods.yearStem,
    tenGods.yearBranch,
    tenGods.monthStem,
    tenGods.monthBranch,
    tenGods.dayBranch,
    tenGods.hourStem,
    tenGods.hourBranch,
  ];
  const godFreq: Record<string, number> = {};
  for (const g of allGodValues) godFreq[g] = (godFreq[g] ?? 0) + 1;
  const tenGodPattern = Object.entries(godFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([g, n]) => `${g}(${n})`)
    .join(', ');

  // 합·충·형
  const stemCombStr =
    combinations.stemCombinations.length > 0
      ? combinations.stemCombinations
          .map((c) => `${c.stems[0]}${c.stems[1]}합→${c.element}`)
          .join(', ')
      : '없음';

  const branchConflictStr =
    combinations.branchConflicts.length > 0
      ? combinations.branchConflicts
          .map((c) => `${c.branches[0]}${c.branches[1]}충`)
          .join(', ')
      : '없음';

  const branchPunishStr =
    combinations.branchPunishments.length > 0
      ? combinations.branchPunishments
          .map((p) => p.branches.join(''))
          .join(', ')
      : '없음';

  // 공망
  const voidStr = voidAnalysis.voidBranches.join(', ');
  const affectedStr =
    voidAnalysis.affectedPillars.length > 0
      ? ` (영향: ${voidAnalysis.affectedPillars.join(', ')}주)`
      : '';

  // 대운 처음 5개
  const majorLuckStr = luck.majorLuck
    .slice(0, 5)
    .map(
      (p) => `${p.startAge}~${p.endAge}세 ${p.pillar.stem}${p.pillar.branch}`,
    )
    .join(' / ');

  return [
    '[기본 정보]',
    `이름: ${name}, 성별: ${GENDER_LABEL[gender]}, 생년월일: ${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    '',
    '[사주팔자]',
    `년주: ${fourPillars.year.stem}${fourPillars.year.branch} / 월주: ${fourPillars.month.stem}${fourPillars.month.branch} / 일주: ${fourPillars.day.stem}${fourPillars.day.branch} / 시주: ${fourPillars.hour.stem}${fourPillars.hour.branch}`,
    '',
    `[격국] ${format.name}`,
    `[일간 강약] ${STRENGTH_LABEL[strength]} (지지점수: 지원 ${supportScore} / 소모 ${drainScore})`,
    `[용신] ${yongsin.yongsin} / [기신] ${yongsin.kijin}`,
    '',
    '[오행 분포]',
    elementDist,
    `${dominantStr} 강세${missingStr}`,
    '',
    '[십신 구성]',
    tenGodLine,
    `패턴: ${tenGodPattern}`,
    '',
    '[합·충·형]',
    `천간합: ${stemCombStr}`,
    `지지충: ${branchConflictStr}`,
    `지지형: ${branchPunishStr}`,
    '',
    '[공망]',
    `${voidStr}${affectedStr}`,
    '',
    '[대운 흐름]',
    `시작 나이: ${luck.startAge}세 (${luck.direction === 'forward' ? '순행' : '역행'})`,
    majorLuckStr,
  ].join('\n');
}

export { buildSajuContext };
