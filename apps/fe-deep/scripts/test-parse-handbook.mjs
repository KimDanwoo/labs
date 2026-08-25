// 학습 문서 파서 회귀 체크: node scripts/test-parse-handbook.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import { STEP_KIND, parseStudyDoc } from '../src/views/study/model/parseHandbook.ts';

const SAMPLE = `# 핸드북

머리말.

# 1. 자기소개

## 핵심 키워드

- 프론트엔드
- 0→1

## 30초 답변

안녕하세요.

## 60초 답변

길게 말하기.

## 주의

과장하지 않는다.

## 꼬꼬무

### 왜 그렇게 했나요?

이유를 설명한다.

### 다른 방법은요?

---

# 2. 답 없는 주제

## 꼬꼬무

- 첫 질문?
- 둘째 질문?
`;

test('H1은 주제, H2는 역할별 섹션으로 갈린다', () => {
  const doc = parseStudyDoc('sample', SAMPLE);

  assert.equal(doc.title, '핸드북');
  assert.equal(doc.topics.length, 2);

  const topic = doc.topics[0];
  assert.deepEqual(
    topic.steps.map((step) => step.kind),
    [STEP_KIND.keywords, STEP_KIND.answer, STEP_KIND.followUp, STEP_KIND.followUp],
  );
  assert.deepEqual(topic.steps[0].keywords, ['프론트엔드', '0→1']);
  assert.equal(topic.steps[0].reveal, '안녕하세요.');
  assert.match(topic.notes, /과장하지 않는다/);
});

test('꼬꼬무는 H3면 답까지, 불릿이면 질문만 가져온다', () => {
  const doc = parseStudyDoc('sample', SAMPLE);

  const followUps = doc.topics[0].steps.filter((step) => step.kind === STEP_KIND.followUp);
  assert.equal(followUps[0].reveal, '이유를 설명한다.');
  assert.equal(followUps[1].reveal, '');

  const bulletOnly = doc.topics[1].steps;
  assert.equal(bulletOnly.length, 2);
  assert.equal(bulletOnly[0].prompt, '첫 질문?');
  assert.equal(bulletOnly[0].reveal, '');
});

test('주제가 H2 번호 제목이어도(역할 섹션과 같은 레벨) 갈라낸다', () => {
  const doc = parseStudyDoc(
    'x',
    `# 핸드북

## 1. 자기소개

## 핵심 키워드

- 프론트엔드

## 30초 답변

안녕하세요.

## 2. 다음 주제

## 설명

내용.
`,
  );

  assert.deepEqual(
    doc.topics.map((topic) => topic.title),
    ['1. 자기소개', '2. 다음 주제'],
  );
  assert.deepEqual(doc.topics[0].steps[0].keywords, ['프론트엔드']);
  assert.equal(doc.topics[0].steps[0].reveal, '안녕하세요.');
});

test('4단 계층(##주제 / ###섹션 / ####꼬리질문)을 상대 깊이로 읽는다', () => {
  const doc = parseStudyDoc(
    'x',
    `# 핸드북

## 1. 자기소개

### 핵심 키워드

- 프론트엔드

### 30초 답변

안녕하세요.

### 참고

배경 설명.

### 꼬꼬무

#### 왜 그렇게 했나요?

이유입니다.

##### 더 깊은 제목은 본문으로 남는다

#### 다른 방법은요?
`,
  );

  const topic = doc.topics[0];
  assert.equal(topic.title, '1. 자기소개');
  assert.deepEqual(
    topic.steps.map((step) => step.kind),
    [STEP_KIND.keywords, STEP_KIND.followUp, STEP_KIND.followUp],
  );
  assert.deepEqual(topic.steps[0].keywords, ['프론트엔드']);
  assert.equal(topic.steps[0].reveal, '안녕하세요.');
  assert.match(topic.steps[1].reveal, /이유입니다/);
  assert.match(topic.steps[1].reveal, /##### 더 깊은 제목은 본문으로 남는다/);
  assert.match(topic.notes, /배경 설명/);
});

test('코드펜스 안의 # 은 제목으로 오해하지 않는다', () => {
  const doc = parseStudyDoc('x', '# 문서\n\n# 1. 주제\n\n## 설명\n\n```bash\n# 주석입니다\n```\n');
  assert.equal(doc.topics.length, 1);
  assert.match(doc.topics[0].steps[0].reveal, /# 주석입니다/);
});
