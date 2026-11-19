/**
 * 면접 핸드북 마크다운을 학습 단계로 분해한다.
 *
 * 계층은 "주제 레벨"을 기준으로 상대적으로 읽는다. 문서가 `#`을 주제로 쓰든 `##`을 쓰든 따라간다.
 *   주제        문서에서 처음 번호가 붙은 제목의 레벨. 그 레벨의 제목은 전부 주제다
 *   역할 섹션   주제보다 한 단계 깊은 제목. 키워드 / 답변 / 오답 / 보완할 점 / 꼬리질문 / 나머지(참고 자료)로 갈린다
 *   꼬리질문    `## 꼬리`·`## 꼬꼬무` 안의 목록이나 한 단계 깊은 제목, 또는 물음표로 끝나는 섹션 제목 자체
 *
 * 특수 문법은 없다. 제목 텍스트만으로 역할을 판별한다.
 */
export const STEP_KIND = {
  keywords: 'keywords',
  answer: 'answer',
  mistake: 'mistake',
  followUp: 'followUp',
  improve: 'improve',
} as const;

export type StepKind = (typeof STEP_KIND)[keyof typeof STEP_KIND];

export type StudyStep = {
  id: string;
  kind: StepKind;
  prompt: string;
  keywords: string[];
  reveal: string;
};

export type StudyTopic = {
  id: string;
  title: string;
  steps: StudyStep[];
  notes: string;
};

export type StudyDoc = {
  slug: string;
  title: string;
  date: string | null;
  intro: string;
  topics: StudyTopic[];
};
