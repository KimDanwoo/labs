import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env.local', 'utf-8');
for (const line of envContent.split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i > 0) process.env[t.slice(0, i)] = t.slice(i + 1);
}

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const sbAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY);

// === Part 1: 기존 질문 수정 ===
let count = 0;

try {
  // 1. q-4: Cookie expires date fix (2025 → 2027)
  {
    const { data, error } = await sbAdmin.from('questions').select('answer').eq('id', 'q-4').single();
    if (error) throw error;
    const newAnswer = data.answer.replace(/2025/g, '2027');
    const { error: upErr } = await sbAdmin.from('questions').update({ answer: newAnswer }).eq('id', 'q-4');
    if (upErr) throw upErr;
    console.log('✅ q-4 updated: Cookie expires 날짜 2025 → 2027 수정');
    count++;
  }

  // 2. q-42: sub_category fix (저장소 → 렌더링)
  {
    const { error } = await sbAdmin.from('questions').update({ sub_category: '렌더링' }).eq('id', 'q-42');
    if (error) throw error;
    console.log('✅ q-42 updated: sub_category 저장소 → 렌더링 수정 (Reflow/Repaint)');
    count++;
  }

  // 3. q-51: Core Web Vitals - FID → INP 교체
  {
    const { data, error } = await sbAdmin.from('questions').select('answer').eq('id', 'q-51').single();
    if (error) throw error;

    let newAnswer;
    if (data.answer.includes('FID') || data.answer.includes('First Input Delay')) {
      newAnswer = `Core Web Vitals는 Google이 정의한 사용자 경험의 핵심 지표 3가지입니다.

**1. LCP (Largest Contentful Paint) — 로딩 성능**
- 뷰포트 내 가장 큰 콘텐츠 요소가 렌더링되는 시점
- Good: ≤ 2.5s / Needs Improvement: ≤ 4s / Poor: > 4s

**2. INP (Interaction to Next Paint) — 상호작용 응답성**
- 페이지 전체 생명주기 동안 발생하는 모든 클릭·키 입력·탭에 대한 응답 지연의 대표값
- 2024년 3월, FID(First Input Delay)를 공식 대체
- Good: ≤ 200ms / Needs Improvement: ≤ 500ms / Poor: > 500ms
- FID는 첫 번째 입력만 측정했지만, INP는 전체 상호작용을 측정해 더 포괄적

**3. CLS (Cumulative Layout Shift) — 시각적 안정성**
- 페이지 로드 중 발생하는 예기치 않은 레이아웃 이동의 누적 점수
- Good: ≤ 0.1 / Needs Improvement: ≤ 0.25 / Poor: > 0.25

> FID(First Input Delay)는 2024년 3월 공식 교체되어 더 이상 Core Web Vitals에 포함되지 않습니다.`;
    } else {
      newAnswer = data.answer;
    }

    const { error: upErr } = await sbAdmin.from('questions').update({ answer: newAnswer }).eq('id', 'q-51');
    if (upErr) throw upErr;
    console.log('✅ q-51 updated: Core Web Vitals FID → INP 교체 (2024년 3월 기준)');
    count++;
  }

  // 4. q-36: Next.js fetch caching - Next.js 15 기본값 변경 반영
  {
    const { data, error } = await sbAdmin.from('questions').select('answer').eq('id', 'q-36').single();
    if (error) throw error;

    const nextJs15Note = `\n\n> **Next.js 15 변경사항:** fetch()의 기본 캐싱 동작이 변경되었습니다.\n> - 이전(Next.js 14 이하): \`cache: 'force-cache'\` (기본적으로 캐시됨)\n> - 현재(Next.js 15+): \`cache: 'no-store'\` (기본적으로 캐시하지 않음)\n> - 캐싱을 원하면 \`cache: 'force-cache'\` 또는 \`next: { revalidate: N }\`을 명시적으로 설정해야 합니다.`;

    const newAnswer = data.answer.includes('Next.js 15')
      ? data.answer
      : data.answer + nextJs15Note;

    const { error: upErr } = await sbAdmin.from('questions').update({ answer: newAnswer }).eq('id', 'q-36');
    if (upErr) throw upErr;
    console.log('✅ q-36 updated: Next.js 15 fetch 기본 캐싱 no-store 변경 내용 추가');
    count++;
  }

  // 5. q-66: Observer pattern classification fix (구조 패턴 → 행위 패턴)
  {
    const { error } = await sbAdmin.from('questions').update({ sub_category: '행위 패턴' }).eq('id', 'q-66');
    if (error) throw error;
    console.log('✅ q-66 updated: sub_category 구조 패턴 → 행위 패턴 수정 (Observer는 GoF 행위 패턴)');
    count++;
  }

  // 6. q-3: HTML inline elements - img 대체 인라인 요소 설명 추가
  {
    const { data, error } = await sbAdmin.from('questions').select('answer').eq('id', 'q-3').single();
    if (error) throw error;

    const imgNote = `\n\n**대체 인라인 요소 (Replaced Inline Element)**\n\`<img>\`, \`<input>\`, \`<video>\` 등은 인라인 요소이지만 예외적으로 \`width\`·\`height\` 설정이 가능합니다. 외부 콘텐츠(이미지, 미디어)로 대체(replace)되는 특성 때문에 일반 인라인 요소와 달리 박스 크기를 가집니다.`;

    const newAnswer = data.answer.includes('대체 인라인')
      ? data.answer
      : data.answer + imgNote;

    const { error: upErr } = await sbAdmin.from('questions').update({ answer: newAnswer }).eq('id', 'q-3');
    if (upErr) throw upErr;
    console.log('✅ q-3 updated: <img> 대체 인라인 요소(replaced inline element) 설명 추가');
    count++;
  }

  console.log(`\n=== Part 1 완료: 기존 질문 ${count}건 수정 ===`);
} catch (err) {
  console.error('❌ 오류 발생:', err.message);
  process.exit(1);
}

// === Part 2: 새 질문 추가 ===
try {
  // 카테고리 ID 매핑
  const { data: cats, error: catErr } = await sbAdmin.from('categories').select('id, slug').order('order_num');
  if (catErr) throw catErr;
  const catMap = Object.fromEntries(cats.map(c => [c.slug, c.id]));

  // 각 카테고리의 현재 최대 order_num 조회
  const orderMap = {};
  for (const c of cats) {
    const { data } = await sbAdmin.from('questions')
      .select('order_num')
      .eq('category_id', c.id)
      .order('order_num', { ascending: false })
      .limit(1);
    orderMap[c.slug] = (data?.[0]?.order_num ?? 0) + 1;
  }

  function nextOrder(slug) {
    return orderMap[slug]++;
  }

  const newQuestions = [
    // === HTML (q-77 ~ q-79) ===
    {
      id: 'q-77', category_id: catMap['html'], difficulty: 'easy',
      sub_category: '폼', order_num: nextOrder('html'),
      question: 'HTML 폼 유효성 검사(Form Validation) 방법은?',
      tags: ['html', 'form', 'validation'],
      answer: `HTML5는 별도의 JavaScript 없이도 폼 유효성 검사를 지원합니다.

**주요 유효성 검사 속성:**
- \`required\`: 필수 입력 필드
- \`pattern\`: 정규식 패턴 매칭 (예: \`pattern="[0-9]{3}"\`)
- \`min\` / \`max\`: 숫자·날짜의 최솟값·최댓값
- \`minlength\` / \`maxlength\`: 문자열 길이 제한
- \`type\`: \`email\`, \`url\`, \`number\` 등 자동 형식 검사

**CSS 가상 클래스로 상태 표시:**
\`\`\`css
input:valid   { border-color: green; }
input:invalid { border-color: red; }
\`\`\`

**JavaScript Constraint Validation API:**
\`\`\`js
const input = document.querySelector('input');
input.checkValidity();          // 유효성 검사 실행
input.setCustomValidity('메시지'); // 커스텀 오류 메시지
input.reportValidity();          // 오류 메시지 표시
\`\`\`

HTML 네이티브 검사로 기본을 잡고, 복잡한 로직은 JavaScript로 보완하는 것이 일반적입니다.`
    },
    {
      id: 'q-78', category_id: catMap['html'], difficulty: 'medium',
      sub_category: 'HTML5', order_num: nextOrder('html'),
      question: 'data-* 속성의 용도와 사용법은?',
      tags: ['html', 'data-attribute', 'dataset'],
      answer: `\`data-*\` 속성은 HTML 요소에 사용자 정의 데이터를 저장하는 표준 방법입니다.

**HTML에서 사용:**
\`\`\`html
<article data-author="Kim" data-category="tech" data-created-at="2025-01-01">
  ...
</article>
\`\`\`

**JavaScript에서 접근 — dataset API:**
\`\`\`js
const el = document.querySelector('article');
el.dataset.author;     // "Kim"
el.dataset.category;   // "tech"
el.dataset.createdAt;  // "2025-01-01" (kebab → camelCase 변환)
\`\`\`

**CSS에서 활용:**
\`\`\`css
article[data-category="tech"] { border-left: 3px solid blue; }
article::before { content: attr(data-author); }
\`\`\`

**주의사항:**
- 민감한 데이터(비밀번호, 개인정보)는 저장하지 않아야 합니다 — 소스 보기로 노출됩니다.
- 대량의 데이터 저장에는 적합하지 않으며, 간단한 메타데이터 전달에 사용합니다.
- React에서는 \`data-testid\` 등 테스트 식별자로도 활용됩니다.`
    },
    {
      id: 'q-79', category_id: catMap['html'], difficulty: 'medium',
      sub_category: 'HTML5', order_num: nextOrder('html'),
      question: '<dialog> 요소를 이용한 네이티브 모달 구현 방법은?',
      tags: ['html', 'dialog', 'modal'],
      answer: `\`<dialog>\`는 HTML5에서 제공하는 네이티브 대화 상자 요소입니다.

**기본 사용법:**
\`\`\`html
<dialog id="myDialog">
  <h2>제목</h2>
  <p>내용</p>
  <button onclick="this.closest('dialog').close()">닫기</button>
</dialog>
<button onclick="document.getElementById('myDialog').showModal()">열기</button>
\`\`\`

**주요 메서드:**
- \`show()\`: 비모달(non-modal)로 열기 — 배경 상호작용 가능
- \`showModal()\`: 모달로 열기 — \`::backdrop\` 생성, ESC 키로 닫기 지원
- \`close(returnValue)\`: 닫기, 반환값 전달 가능

**::backdrop 스타일링:**
\`\`\`css
dialog::backdrop {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}
\`\`\`

**장점:**
- 포커스 트랩(focus trapping) 자동 처리
- ESC 키 닫기 기본 지원
- \`close\` 이벤트로 닫힘 감지 가능
- 접근성(ARIA role=dialog) 내장
- 별도 라이브러리 없이 모달 패턴 구현 가능`
    },
    // === CSS (q-80 ~ q-82) ===
    {
      id: 'q-80', category_id: catMap['css'], difficulty: 'medium',
      sub_category: 'CSS 변수', order_num: nextOrder('css'),
      question: 'CSS Custom Properties(변수)란 무엇이고 어떻게 사용하나요?',
      tags: ['css', 'custom-properties', 'variables'],
      answer: `CSS Custom Properties(CSS 변수)는 재사용 가능한 값을 정의하는 기능입니다.

**선언과 사용:**
\`\`\`css
:root {
  --primary-color: #3b82f6;
  --spacing-md: 16px;
  --font-body: 'Pretendard', sans-serif;
}

.button {
  background: var(--primary-color);
  padding: var(--spacing-md);
  font-family: var(--font-body);
}
\`\`\`

**폴백(fallback) 값:**
\`\`\`css
color: var(--undefined-var, #333); /* 변수가 없으면 #333 사용 */
\`\`\`

**Sass 변수와의 차이점:**
| | CSS 변수 | Sass 변수 |
|---|---|---|
| 런타임 | 브라우저에서 동적 변경 가능 | 빌드 시 정적 치환 |
| 스코프 | CSS 캐스케이드(상속) 기반 | 블록 스코프 |
| JavaScript 접근 | 가능 | 불가 |

**JavaScript에서 동적 변경:**
\`\`\`js
document.documentElement.style.setProperty('--primary-color', '#ef4444');
\`\`\`

**대표 활용 사례:** 다크모드 전환, 테마 시스템, 반응형 간격 조정 등.`
    },
    {
      id: 'q-81', category_id: catMap['css'], difficulty: 'medium',
      sub_category: '레이아웃', order_num: nextOrder('css'),
      question: 'z-index와 쌓임 맥락(Stacking Context)을 설명해주세요.',
      tags: ['css', 'z-index', 'stacking-context'],
      answer: `**z-index**는 요소의 쌓임 순서(z축 위치)를 지정하며, \`position\`이 \`static\`이 아닌 요소에서 동작합니다.

**쌓임 맥락(Stacking Context):**
독립적인 z축 레이어 그룹입니다. 새로운 쌓임 맥락이 생성되는 조건:
- \`position: absolute|relative|fixed\` + \`z-index\` 값이 \`auto\`가 아닐 때
- \`opacity\` < 1
- \`transform\`, \`filter\`, \`perspective\` 등이 \`none\`이 아닐 때
- \`isolation: isolate\`
- \`will-change\`에 위 속성 지정 시

**핵심 규칙:**
\`\`\`
같은 쌓임 맥락 내에서만 z-index 비교가 의미 있다.
\`\`\`

**흔한 실수:**
\`\`\`css
/* 부모 A: z-index: 1 → 새 쌓임 맥락 생성 */
/* 자식 A-1: z-index: 9999 */
/* 부모 B: z-index: 2 → 새 쌓임 맥락 생성 */
/* 결과: B가 A-1보다 위 (부모 맥락에서 B > A) */
\`\`\`

**디버깅 팁:**
- z-index가 안 먹힌다면 \`position\` 확인
- 원하는 순서가 안 된다면 부모의 쌓임 맥락 확인
- \`isolation: isolate\`로 의도적 맥락 분리 가능`
    },
    {
      id: 'q-82', category_id: catMap['css'], difficulty: 'medium',
      sub_category: '애니메이션', order_num: nextOrder('css'),
      question: 'CSS transition과 animation의 차이점은?',
      tags: ['css', 'transition', 'animation'],
      answer: `**transition** — 상태 변화를 부드럽게 전환:
\`\`\`css
.box {
  background: blue;
  transition: background 0.3s ease, transform 0.3s ease;
}
.box:hover {
  background: red;
  transform: scale(1.1);
}
\`\`\`
- 시작 상태 → 끝 상태의 단순 전환
- 트리거(hover, class 변경 등)가 필요

**animation** — 독립적이고 복잡한 동작:
\`\`\`css
@keyframes slide {
  0%   { transform: translateX(0); }
  50%  { transform: translateX(100px); }
  100% { transform: translateX(0); }
}
.box {
  animation: slide 2s ease infinite;
}
\`\`\`
- \`@keyframes\`로 다단계 정의 가능
- 트리거 없이 자동 실행 가능
- 반복(\`iteration-count\`), 방향(\`direction\`), 상태 유지(\`fill-mode\`) 제어

**비교:**
| | transition | animation |
|---|---|---|
| 트리거 | 필요 | 불필요 (자동 가능) |
| 중간 단계 | 불가 (시작↔끝) | 가능 (@keyframes) |
| 반복 | 불가 | 가능 (infinite) |
| 복잡도 | 단순 전환 | 복잡한 시퀀스 |

**성능 팁:** \`transform\`과 \`opacity\`만 애니메이션하면 GPU 가속으로 60fps 유지 가능합니다.`
    },
    // === JavaScript (q-83 ~ q-85) ===
    {
      id: 'q-83', category_id: catMap['javascript'], difficulty: 'medium',
      sub_category: '객체', order_num: nextOrder('javascript'),
      question: '깊은 복사(Deep Copy)와 얕은 복사(Shallow Copy)의 차이점은?',
      tags: ['javascript', 'deep-copy', 'shallow-copy', 'object'],
      answer: `**얕은 복사(Shallow Copy):**
1단계 프로퍼티만 복사합니다. 중첩 객체는 참조를 공유합니다.
\`\`\`js
const original = { a: 1, nested: { b: 2 } };
const shallow = { ...original };
shallow.nested.b = 99;
console.log(original.nested.b); // 99 — 참조 공유!
\`\`\`
- 방법: \`{ ...obj }\`, \`Object.assign()\`, \`Array.prototype.slice()\`

**깊은 복사(Deep Copy):**
모든 단계의 프로퍼티를 새로 생성합니다. 완전히 독립된 복사본입니다.
\`\`\`js
const original = { a: 1, nested: { b: 2 } };
const deep = structuredClone(original);
deep.nested.b = 99;
console.log(original.nested.b); // 2 — 독립!
\`\`\`

**깊은 복사 방법 비교:**
| 방법 | 장점 | 단점 |
|---|---|---|
| \`structuredClone()\` | 네이티브, 순환 참조 지원 | Date·RegExp 등도 복사 가능 |
| \`JSON.parse(JSON.stringify())\` | 간단 | 함수·undefined·순환 참조 불가 |
| lodash \`cloneDeep\` | 완벽 | 외부 라이브러리 의존 |

**권장:** 브라우저·Node.js 모두 지원하는 \`structuredClone()\`을 기본으로 사용합니다.`
    },
    {
      id: 'q-84', category_id: catMap['javascript'], difficulty: 'medium',
      sub_category: '모듈', order_num: nextOrder('javascript'),
      question: 'ES Modules과 CommonJS의 차이점은?',
      tags: ['javascript', 'esm', 'commonjs', 'modules'],
      answer: `**CommonJS (CJS):**
\`\`\`js
// 내보내기
module.exports = { add };
// 가져오기
const { add } = require('./math');
\`\`\`
- Node.js의 기본 모듈 시스템
- **동기적** 로딩 (런타임에 실행)
- \`require()\`는 어디서든 호출 가능 (조건부 로딩 가능)

**ES Modules (ESM):**
\`\`\`js
// 내보내기
export function add(a, b) { return a + b; }
// 가져오기
import { add } from './math.js';
\`\`\`
- ECMAScript 표준 모듈 시스템
- **비동기적** 로딩 가능
- \`import\`/\`export\`는 반드시 최상위에 위치

**핵심 차이:**
| | CommonJS | ES Modules |
|---|---|---|
| 로딩 시점 | 런타임 (동기) | 파싱 시점 (정적 분석) |
| Tree Shaking | 불가 | 가능 (정적 분석 덕분) |
| \`this\` | module 객체 | undefined |
| 순환 참조 | 부분 로딩 | 라이브 바인딩 |
| 브라우저 | 불가 (번들러 필요) | 네이티브 지원 |

**트렌드:** Node.js도 ESM을 기본으로 전환 중이며, 프론트엔드 빌드 도구(Vite 등)는 ESM 기반입니다.`
    },
    {
      id: 'q-85', category_id: catMap['javascript'], difficulty: 'medium',
      sub_category: '메모리', order_num: nextOrder('javascript'),
      question: 'WeakMap과 WeakSet은 무엇이고 언제 사용하나요?',
      tags: ['javascript', 'weakmap', 'weakset', 'memory'],
      answer: `**WeakMap**과 **WeakSet**은 키(WeakMap) 또는 값(WeakSet)이 **약한 참조(weak reference)**로 유지되어 가비지 컬렉션을 방해하지 않는 컬렉션입니다.

**WeakMap:**
\`\`\`js
const cache = new WeakMap();
function process(obj) {
  if (cache.has(obj)) return cache.get(obj);
  const result = /* 무거운 계산 */;
  cache.set(obj, result);
  return result;
}
// obj에 대한 다른 참조가 사라지면 캐시 항목도 자동 정리
\`\`\`

**Map과의 차이:**
| | Map | WeakMap |
|---|---|---|
| 키 타입 | 아무 값 | 객체만 |
| 열거 | 가능 (size, forEach) | 불가 |
| GC | 키 참조 유지 → 메모리 누수 가능 | 키가 GC 대상이면 자동 제거 |

**WeakSet:** 객체의 존재 여부만 추적할 때 사용합니다.
\`\`\`js
const visited = new WeakSet();
function track(node) {
  if (visited.has(node)) return; // 이미 방문
  visited.add(node);
}
\`\`\`

**주요 사용 사례:**
- DOM 노드에 메타데이터 연결 (노드 제거 시 자동 정리)
- 객체별 캐시 (메모리 누수 방지)
- 순환 참조 탐지 (방문한 객체 추적)`
    },
    // === TypeScript (q-86 ~ q-87) ===
    {
      id: 'q-86', category_id: catMap['typescript'], difficulty: 'medium',
      sub_category: '고급', order_num: nextOrder('typescript'),
      question: 'satisfies 연산자란 무엇이며 어떻게 활용하나요?',
      tags: ['typescript', 'satisfies', 'type-checking'],
      answer: `\`satisfies\`는 TypeScript 4.9에서 도입된 연산자로, 타입 호환성을 검증하면서도 **추론된 타입을 유지**합니다.

**as vs satisfies:**
\`\`\`ts
type Colors = Record<string, string | number[]>;

// as → 넓은 타입으로 단언 (구체적 타입 정보 손실)
const colorsAs = {
  red: '#ff0000',
  blue: [0, 0, 255],
} as Colors;
colorsAs.red.toUpperCase(); // ❌ 에러 — string | number[]로 추론

// satisfies → 검증하면서 구체적 타입 유지
const colorsSat = {
  red: '#ff0000',
  blue: [0, 0, 255],
} satisfies Colors;
colorsSat.red.toUpperCase(); // ✅ string으로 추론됨
colorsSat.blue.map(n => n);  // ✅ number[]로 추론됨
\`\`\`

**활용 사례:**
1. **설정 객체**: 타입 제약은 지키면서 각 필드의 구체적 타입을 보존
2. **라우트 정의**: \`Record<string, RouteConfig>\`를 만족하면서 자동 완성 유지
3. **상수 객체**: \`as const\`와 함께 사용하여 리터럴 타입 + 타입 검증 동시 달성

\`\`\`ts
const routes = {
  home: { path: '/', component: Home },
  about: { path: '/about', component: About },
} satisfies Record<string, RouteConfig>;
// routes.home.path는 '/'로 추론 (string이 아님)
\`\`\``
    },
    {
      id: 'q-87', category_id: catMap['typescript'], difficulty: 'medium',
      sub_category: '고급', order_num: nextOrder('typescript'),
      question: '템플릿 리터럴 타입(Template Literal Type)을 설명해주세요.',
      tags: ['typescript', 'template-literal', 'type-system'],
      answer: `템플릿 리터럴 타입은 문자열 리터럴 타입을 조합하여 새로운 문자열 타입을 생성합니다.

**기본 문법:**
\`\`\`ts
type EventName = 'click' | 'focus';
type Handler = \`on\${Capitalize<EventName>}\`;
// 결과: 'onClick' | 'onFocus'
\`\`\`

**내장 문자열 조작 타입:**
- \`Uppercase<T>\`: 대문자 변환
- \`Lowercase<T>\`: 소문자 변환
- \`Capitalize<T>\`: 첫 글자 대문자
- \`Uncapitalize<T>\`: 첫 글자 소문자

**실전 활용 — CSS 단위:**
\`\`\`ts
type CSSUnit = 'px' | 'rem' | 'em' | '%';
type CSSValue = \`\${number}\${CSSUnit}\`;
const width: CSSValue = '100px'; // ✅
const bad: CSSValue = '100vw';   // ❌ 컴파일 에러
\`\`\`

**패턴 추론 (infer):**
\`\`\`ts
type ExtractParam<T> = T extends \`/:\${infer Param}\` ? Param : never;
type Result = ExtractParam<'/:id'>; // 'id'
\`\`\`

**주의사항:**
- 유니온 타입 조합 시 경우의 수가 급격히 증가할 수 있어 컴파일 성능에 주의합니다.
- 너무 복잡한 템플릿 리터럴 타입은 가독성을 해칠 수 있으므로 적절한 수준에서 사용합니다.`
    },
    // === React (q-88 ~ q-90) ===
    {
      id: 'q-88', category_id: catMap['react'], difficulty: 'medium',
      sub_category: 'Hooks', order_num: nextOrder('react'),
      question: 'useRef의 다양한 용도와 사용법을 설명해주세요.',
      tags: ['react', 'useRef', 'hooks', 'dom'],
      answer: `\`useRef\`는 렌더링 간에 유지되지만 변경 시 리렌더를 일으키지 않는 값을 저장합니다.

**1. DOM 요소 접근:**
\`\`\`tsx
function TextInput() {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <input ref={inputRef} />
      <button onClick={() => inputRef.current?.focus()}>포커스</button>
    </>
  );
}
\`\`\`

**2. 이전 값 저장:**
\`\`\`tsx
function Counter({ count }: { count: number }) {
  const prevCount = useRef(count);
  useEffect(() => { prevCount.current = count; });
  return <p>현재: {count}, 이전: {prevCount.current}</p>;
}
\`\`\`

**3. 타이머·인터벌 ID 저장:**
\`\`\`tsx
const timerRef = useRef<NodeJS.Timeout>();
useEffect(() => {
  timerRef.current = setInterval(() => {}, 1000);
  return () => clearInterval(timerRef.current);
}, []);
\`\`\`

**useRef vs useState:**
| | useRef | useState |
|---|---|---|
| 변경 시 리렌더 | ❌ 없음 | ✅ 발생 |
| 값 접근 | \`.current\` | 직접 |
| 용도 | DOM 참조, 변경 추적 | UI에 반영할 데이터 |

**주의:** \`ref.current\` 변경은 렌더 결과에 반영되지 않으므로, 화면에 표시할 데이터는 \`useState\`를 사용해야 합니다.`
    },
    {
      id: 'q-89', category_id: catMap['react'], difficulty: 'easy',
      sub_category: '핵심 개념', order_num: nextOrder('react'),
      question: 'Controlled Component와 Uncontrolled Component의 차이점은?',
      tags: ['react', 'controlled', 'uncontrolled', 'form'],
      answer: `**Controlled Component:**
React 상태가 입력값의 "유일한 진실의 원천(single source of truth)"입니다.
\`\`\`tsx
function Form() {
  const [value, setValue] = useState('');
  return <input value={value} onChange={e => setValue(e.target.value)} />;
}
\`\`\`
- 모든 입력 변화를 React가 관리
- 실시간 유효성 검사, 조건부 제출 등 세밀한 제어 가능

**Uncontrolled Component:**
DOM 자체가 값을 관리하며, \`ref\`로 필요할 때 접근합니다.
\`\`\`tsx
function Form() {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleSubmit = () => console.log(inputRef.current?.value);
  return <input ref={inputRef} defaultValue="" />;
}
\`\`\`
- 간단한 폼에 적합
- 리렌더 최소화

**비교:**
| | Controlled | Uncontrolled |
|---|---|---|
| 값 관리 | React state | DOM 자체 |
| 실시간 검증 | ✅ | ❌ |
| 리렌더 | 입력마다 발생 | 최소 |
| 초기값 | \`value\` | \`defaultValue\` |
| 사용 시기 | 대부분의 폼 | 파일 입력, 간단한 폼 |

**권장:** React 공식 문서는 대부분의 경우 Controlled Component를 권장합니다.`
    },
    {
      id: 'q-90', category_id: catMap['react'], difficulty: 'medium',
      sub_category: '에러 처리', order_num: nextOrder('react'),
      question: 'React의 Error Boundary와 Suspense를 설명해주세요.',
      tags: ['react', 'error-boundary', 'suspense'],
      answer: `**Error Boundary:**
자식 컴포넌트의 렌더링 에러를 잡아 폴백 UI를 표시합니다.
\`\`\`tsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, info) { logError(error, info); }
  render() {
    if (this.state.hasError) return <p>문제가 발생했습니다.</p>;
    return this.props.children;
  }
}

// 사용
<ErrorBoundary>
  <RiskyComponent />
</ErrorBoundary>
\`\`\`

**Suspense:**
비동기 작업(데이터 패칭, lazy 로딩) 중 폴백 UI를 표시합니다.
\`\`\`tsx
const LazyPage = React.lazy(() => import('./HeavyPage'));

<Suspense fallback={<Spinner />}>
  <LazyPage />
</Suspense>
\`\`\`

**조합 사용:**
\`\`\`tsx
<ErrorBoundary fallback={<ErrorPage />}>
  <Suspense fallback={<Skeleton />}>
    <DataComponent />
  </Suspense>
</ErrorBoundary>
\`\`\`

**차이점:**
| | Error Boundary | Suspense |
|---|---|---|
| 처리 대상 | 렌더링 에러 | 비동기 로딩 상태 |
| 구현 | 클래스 컴포넌트 | 내장 컴포넌트 |
| 폴백 | 에러 UI | 로딩 UI |

**주의:** Error Boundary는 이벤트 핸들러, 비동기 코드(setTimeout 등)의 에러는 잡지 못합니다.`
    },
    // === Next.js (q-91 ~ q-92) ===
    {
      id: 'q-91', category_id: catMap['nextjs'], difficulty: 'hard',
      sub_category: 'App Router', order_num: nextOrder('nextjs'),
      question: 'Parallel Routes와 Intercepting Routes를 설명해주세요.',
      tags: ['nextjs', 'parallel-routes', 'intercepting-routes', 'app-router'],
      answer: `**Parallel Routes (@슬롯):**
하나의 레이아웃에서 여러 페이지를 동시에 렌더링합니다.

\`\`\`
app/
  layout.tsx        → { children, analytics, team }
  page.tsx
  @analytics/
    page.tsx
  @team/
    page.tsx
\`\`\`
\`\`\`tsx
// app/layout.tsx
export default function Layout({ children, analytics, team }) {
  return (
    <>
      {children}
      {analytics}
      {team}
    </>
  );
}
\`\`\`
- 각 슬롯은 독립적으로 로딩/에러 상태를 가질 수 있음
- 대시보드, 멀티 패널 UI에 적합
- \`default.tsx\`로 매칭되지 않는 슬롯의 폴백 정의

**Intercepting Routes ((..), (..)(..), (...)):**
현재 레이아웃 내에서 다른 경로의 콘텐츠를 가로채어 표시합니다.
\`\`\`
app/
  feed/
    page.tsx
    (..)photo/[id]/   → feed 내에서 photo를 모달로 표시
      page.tsx
  photo/[id]/
    page.tsx           → 직접 접근 시 전체 페이지
\`\`\`
- \`(.)\`: 같은 레벨, \`(..)\`: 한 레벨 위, \`(...)\`: 루트에서
- 모달 패턴 구현: 소프트 네비게이션 시 모달, 직접 URL 접근 시 전체 페이지
- Instagram 스타일 피드 → 사진 모달이 대표 사례`
    },
    {
      id: 'q-92', category_id: catMap['nextjs'], difficulty: 'medium',
      sub_category: '렌더링', order_num: nextOrder('nextjs'),
      question: 'Streaming SSR과 React Suspense의 관계를 설명해주세요.',
      tags: ['nextjs', 'streaming', 'ssr', 'suspense'],
      answer: `**Streaming SSR**은 HTML을 한 번에 보내지 않고 준비된 부분부터 점진적으로 전송하는 기법입니다. React 18의 \`Suspense\`가 이를 가능하게 합니다.

**기존 SSR의 문제:**
1. 서버에서 모든 데이터 fetch 완료 대기
2. 전체 HTML 렌더링
3. 클라이언트에 전체 HTML 전송
4. 전체 hydration → 가장 느린 컴포넌트가 전체를 지연

**Streaming SSR:**
\`\`\`tsx
// app/page.tsx (Next.js App Router)
export default function Page() {
  return (
    <>
      <Header />  {/* 즉시 전송 */}
      <Suspense fallback={<Skeleton />}>
        <SlowDataSection />  {/* 데이터 준비되면 스트리밍 */}
      </Suspense>
      <Footer />  {/* 즉시 전송 */}
    </>
  );
}
\`\`\`

**동작 원리:**
1. Suspense 바깥 콘텐츠 + fallback을 즉시 HTML로 전송
2. 브라우저가 즉시 렌더링 시작 (TTFB 개선)
3. 느린 데이터가 준비되면 해당 청크를 추가 전송
4. 브라우저가 fallback을 실제 콘텐츠로 교체 (선택적 hydration)

**장점:**
- TTFB / FCP 크게 개선
- 느린 API 하나가 전체 페이지를 블록하지 않음
- Next.js App Router에서는 \`loading.tsx\`가 자동으로 Suspense 경계 생성`
    },
    // === 브라우저 (q-93 ~ q-94) ===
    {
      id: 'q-93', category_id: catMap['browser'], difficulty: 'medium',
      sub_category: 'API', order_num: nextOrder('browser'),
      question: 'Intersection Observer API란 무엇이고 어떻게 사용하나요?',
      tags: ['browser', 'intersection-observer', 'lazy-loading', 'infinite-scroll'],
      answer: `**Intersection Observer API**는 대상 요소가 뷰포트(또는 특정 조상 요소)와 교차하는지를 비동기적으로 감시합니다.

**기본 사용법:**
\`\`\`js
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      console.log('요소가 화면에 보임:', entry.target);
    }
  });
}, {
  root: null,          // null = 뷰포트 기준
  rootMargin: '0px',   // 감지 영역 확장/축소
  threshold: 0.5       // 50% 이상 보일 때 콜백 (0~1, 배열 가능)
});

observer.observe(document.querySelector('.target'));
\`\`\`

**주요 활용 사례:**

1. **이미지 Lazy Loading:**
\`\`\`js
if (entry.isIntersecting) {
  img.src = img.dataset.src; // 실제 이미지 로드
  observer.unobserve(img);   // 로드 후 감시 해제
}
\`\`\`

2. **무한 스크롤:** 하단 센티널 요소 감지 → 추가 데이터 fetch

3. **애니메이션 트리거:** 요소가 보일 때 fade-in 클래스 추가

**scroll 이벤트 대비 장점:**
- 메인 스레드를 블록하지 않음 (비동기)
- \`getBoundingClientRect()\` 호출 불필요
- 브라우저가 최적화 (reflow 최소화)`
    },
    {
      id: 'q-94', category_id: catMap['browser'], difficulty: 'hard',
      sub_category: '동작 원리', order_num: nextOrder('browser'),
      question: 'Service Worker와 PWA(Progressive Web App)를 설명해주세요.',
      tags: ['browser', 'service-worker', 'pwa', 'offline'],
      answer: `**Service Worker:**
브라우저와 네트워크 사이에서 동작하는 프록시 스크립트입니다. 메인 스레드와 별도로 실행됩니다.

**라이프사이클:** install → activate → fetch 이벤트 처리
\`\`\`js
// sw.js
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('v1').then(cache => cache.addAll(['/index.html', '/style.css']))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
\`\`\`

**PWA (Progressive Web App):**
웹 기술로 네이티브 앱 수준의 경험을 제공합니다.

**PWA 핵심 요소:**
1. **Web App Manifest** (\`manifest.json\`): 앱 이름, 아이콘, 시작 URL 정의
2. **Service Worker**: 오프라인 지원, 캐싱, 백그라운드 동기화
3. **HTTPS**: 보안 연결 필수

**Service Worker 활용:**
- **오프라인 캐싱**: Cache-First, Network-First 등 전략 선택
- **푸시 알림**: Push API와 연동
- **백그라운드 동기화**: 오프라인 작업 → 온라인 시 자동 전송

**제한사항:**
- DOM 접근 불가 (별도 스레드)
- HTTPS 필수 (localhost 제외)
- iOS Safari에서 일부 기능 제한`
    },
    // === 네트워크 (q-95 ~ q-96) ===
    {
      id: 'q-95', category_id: catMap['network'], difficulty: 'medium',
      sub_category: 'HTTP', order_num: nextOrder('network'),
      question: 'HTTP/1.1, HTTP/2, HTTP/3의 차이점은 무엇인가요?',
      tags: ['network', 'http', 'http2', 'http3', 'protocol'],
      answer: `**HTTP/1.1 (1997):**
- 텍스트 기반 프로토콜
- 커넥션당 하나의 요청-응답 (Head-of-Line Blocking)
- \`Keep-Alive\`로 커넥션 재사용 가능
- 동시 요청을 위해 여러 TCP 커넥션 필요 (브라우저 제한: 도메인당 6개)

**HTTP/2 (2015):**
- 바이너리 프레이밍 (파싱 효율 향상)
- **멀티플렉싱**: 하나의 TCP 커넥션에서 여러 요청/응답 동시 처리
- **헤더 압축** (HPACK): 중복 헤더 제거
- **서버 푸시**: 요청 전에 리소스 전송 가능
- 단점: TCP 레벨 HOL Blocking은 여전히 존재

**HTTP/3 (2022):**
- **QUIC 프로토콜** 기반 (TCP 대신 UDP)
- 스트림 단위 독립 전송 → TCP HOL Blocking 해결
- **0-RTT 연결**: 재연결 시 즉시 데이터 전송 가능
- 내장 TLS 1.3 (보안 기본 제공)
- 연결 마이그레이션: Wi-Fi ↔ 셀룰러 전환 시 연결 유지

**프론트엔드 영향:**
- HTTP/2+ 환경에서는 도메인 샤딩, 스프라이트 이미지 등 기존 최적화가 불필요
- HTTP/3는 모바일 환경에서 큰 성능 이점`
    },
    {
      id: 'q-96', category_id: catMap['network'], difficulty: 'medium',
      sub_category: 'API', order_num: nextOrder('network'),
      question: 'GraphQL과 REST의 차이점을 설명해주세요.',
      tags: ['network', 'graphql', 'rest', 'api'],
      answer: `**REST:**
- 리소스 중심 URL 설계 (\`GET /users/1/posts\`)
- HTTP 메서드로 행위 표현 (GET, POST, PUT, DELETE)
- 응답 구조가 서버에서 결정됨

**GraphQL:**
- 단일 엔드포인트 (\`POST /graphql\`)
- 클라이언트가 필요한 데이터 구조를 쿼리로 명시
\`\`\`graphql
query {
  user(id: "1") {
    name
    posts { title, createdAt }
  }
}
\`\`\`

**핵심 차이:**
| | REST | GraphQL |
|---|---|---|
| Over-fetching | 발생 (불필요 필드 포함) | 없음 (필요 필드만 요청) |
| Under-fetching | 발생 (여러 엔드포인트 호출) | 없음 (한 쿼리로 해결) |
| 엔드포인트 | 리소스당 여러 개 | 단일 |
| 타입 시스템 | 별도 (OpenAPI 등) | 내장 스키마 |
| 캐싱 | HTTP 캐싱 용이 | 별도 캐싱 전략 필요 |
| 학습 곡선 | 낮음 | 높음 |

**GraphQL의 장점:** 복잡한 관계형 데이터, 다양한 클라이언트(웹/모바일)가 같은 API 사용 시
**REST의 장점:** 단순 CRUD, HTTP 캐싱 활용, 파일 업로드, 팀 러닝 커브 고려 시`
    },
    // === 성능 최적화 (q-97 ~ q-99) ===
    {
      id: 'q-97', category_id: catMap['performance'], difficulty: 'medium',
      sub_category: '최적화', order_num: nextOrder('performance'),
      question: 'Tree Shaking이란 무엇인가요?',
      tags: ['performance', 'tree-shaking', 'bundler', 'webpack'],
      answer: `**Tree Shaking**은 번들러가 사용되지 않는 코드(dead code)를 최종 번들에서 제거하는 최적화 기법입니다.

**동작 원리:**
1. ES Modules의 정적 \`import\`/\`export\` 구문을 분석
2. 실제로 사용(import)된 코드만 식별
3. 사용되지 않은 export를 번들에서 제거

**예시:**
\`\`\`js
// utils.js
export function used() { return 'used'; }
export function unused() { return 'unused'; }

// app.js
import { used } from './utils';
used();
// → 번들에 unused()는 포함되지 않음
\`\`\`

**Tree Shaking이 안 되는 경우:**
- CommonJS(\`require\`): 동적이라 정적 분석 불가
- 사이드 이펙트가 있는 모듈: \`import 'polyfill'\` 형태
- 동적 프로퍼티 접근: \`obj[dynamicKey]\`

**최적화 방법:**
- \`package.json\`의 \`"sideEffects": false\`로 사이드 이펙트 없음 명시
- 배럴 파일(\`index.ts\`) 사용 시 주의 — 전체 모듈이 포함될 수 있음
- named export 사용 (default export보다 Tree Shaking 친화적)
- lodash → \`lodash-es\`처럼 ESM 버전 사용`
    },
    {
      id: 'q-98', category_id: catMap['performance'], difficulty: 'medium',
      sub_category: '최적화', order_num: nextOrder('performance'),
      question: '리스트 가상화(Virtualization/Windowing)를 설명해주세요.',
      tags: ['performance', 'virtualization', 'windowing', 'list'],
      answer: `**리스트 가상화**는 화면에 보이는 항목만 렌더링하고 나머지는 DOM에서 제거하는 기법입니다.

**문제:** 10,000개 항목 리스트 → 10,000개 DOM 노드 → 메모리 과다, 렌더링 지연

**해결 — Windowing:**
\`\`\`
전체 리스트: [1] [2] [3] [4] [5] [6] ... [10000]
실제 렌더:           [3] [4] [5] [6]  ← 보이는 영역 + 버퍼
\`\`\`

**동작 원리:**
1. 컨테이너에 전체 높이를 가상으로 설정 (스크롤바 유지)
2. 스크롤 위치에 따라 보여야 할 항목 인덱스 계산
3. 해당 항목만 절대 위치로 렌더링
4. 스크롤 시 DOM 재사용 (항목 교체)

**주요 라이브러리:**
| 라이브러리 | 특징 |
|---|---|
| \`@tanstack/react-virtual\` | 경량, React 친화적, 유연한 API |
| \`react-window\` | 가볍고 간단 (react-virtualized 경량 버전) |
| \`react-virtuoso\` | 가변 높이 자동 측정, 그룹 헤더 지원 |

**고려사항:**
- 고정 높이 vs 가변 높이 항목
- 검색 엔진은 가상화된 항목을 크롤링하지 못함 → SEO 중요 시 SSR 초기 렌더 병행
- 키보드 네비게이션, 접근성 지원 확인 필요`
    },
    {
      id: 'q-99', category_id: catMap['performance'], difficulty: 'easy',
      sub_category: '최적화', order_num: nextOrder('performance'),
      question: 'preload, prefetch, preconnect의 차이점은?',
      tags: ['performance', 'preload', 'prefetch', 'preconnect', 'resource-hints'],
      answer: `브라우저에게 리소스 로딩 우선순위를 알려주는 리소스 힌트입니다.

**preload — 현재 페이지에 반드시 필요한 리소스:**
\`\`\`html
<link rel="preload" href="/font.woff2" as="font" crossorigin>
<link rel="preload" href="/hero.webp" as="image">
\`\`\`
- 높은 우선순위로 즉시 로드
- 현재 페이지 렌더링에 필수적인 리소스에 사용
- \`as\` 속성 필수 (font, image, script, style 등)

**prefetch — 다음 페이지에서 필요할 리소스:**
\`\`\`html
<link rel="prefetch" href="/next-page-data.json">
\`\`\`
- 낮은 우선순위로 유휴 시간에 로드
- 사용자가 이동할 가능성이 높은 페이지의 리소스
- 현재 페이지 성능에 영향 없음

**preconnect — 외부 도메인에 미리 연결:**
\`\`\`html
<link rel="preconnect" href="https://api.example.com">
<link rel="dns-prefetch" href="https://cdn.example.com">
\`\`\`
- DNS 조회 + TCP 핸드셰이크 + TLS 협상을 미리 수행
- \`dns-prefetch\`: DNS만 미리 조회 (더 가벼움, 폴백용)

**요약:**
| | 시점 | 우선순위 | 용도 |
|---|---|---|---|
| preload | 현재 | 높음 | 필수 리소스 조기 로딩 |
| prefetch | 미래 | 낮음 | 다음 내비게이션 준비 |
| preconnect | 현재 | 중간 | 외부 도메인 연결 준비 |`
    },
    // === 보안 (q-100 ~ q-101) ===
    {
      id: 'q-100', category_id: catMap['security'], difficulty: 'hard',
      sub_category: '보안 정책', order_num: nextOrder('security'),
      question: 'Content Security Policy(CSP)를 심층적으로 설명해주세요.',
      tags: ['security', 'csp', 'xss', 'policy'],
      answer: `**CSP(Content Security Policy)**는 XSS, 데이터 삽입 등의 공격을 방지하기 위한 보안 정책입니다. 브라우저에게 허용된 리소스 출처를 명시합니다.

**설정 방법:**
\`\`\`
// HTTP 헤더 (권장)
Content-Security-Policy: default-src 'self'; script-src 'self' https://cdn.example.com

// 또는 meta 태그
<meta http-equiv="Content-Security-Policy" content="default-src 'self'">
\`\`\`

**주요 디렉티브:**
| 디렉티브 | 대상 |
|---|---|
| \`default-src\` | 모든 리소스의 기본 정책 |
| \`script-src\` | JavaScript |
| \`style-src\` | CSS |
| \`img-src\` | 이미지 |
| \`connect-src\` | XHR, Fetch, WebSocket |
| \`font-src\` | 웹폰트 |
| \`frame-src\` | iframe 소스 |

**소스 값:**
- \`'self'\`: 같은 출처
- \`'none'\`: 모두 차단
- \`'unsafe-inline'\`: 인라인 스크립트/스타일 허용 (비권장)
- \`'nonce-<값>'\`: 특정 nonce를 가진 스크립트만 허용
- \`'strict-dynamic'\`: nonce/hash가 있는 스크립트가 로드하는 스크립트도 허용

**Next.js에서의 적용:**
\`next.config.js\`의 headers 설정이나 미들웨어에서 nonce 기반 CSP를 구성합니다.

**Report-Only 모드:**
\`Content-Security-Policy-Report-Only\` 헤더로 차단 없이 위반 사항만 보고하여 정책을 테스트할 수 있습니다.`
    },
    {
      id: 'q-101', category_id: catMap['security'], difficulty: 'medium',
      sub_category: '무결성', order_num: nextOrder('security'),
      question: 'Subresource Integrity(SRI)란 무엇인가요?',
      tags: ['security', 'sri', 'integrity', 'cdn'],
      answer: `**SRI(Subresource Integrity)**는 CDN 등 외부에서 로드하는 리소스가 변조되지 않았음을 검증하는 보안 기능입니다.

**사용법:**
\`\`\`html
<script
  src="https://cdn.example.com/lib.js"
  integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxDHf+lQAZxOAgZXkg=="
  crossorigin="anonymous">
</script>

<link
  rel="stylesheet"
  href="https://cdn.example.com/style.css"
  integrity="sha256-abcdef123456..."
  crossorigin="anonymous">
\`\`\`

**동작 원리:**
1. 브라우저가 외부 리소스를 다운로드
2. 다운로드된 파일의 해시를 계산
3. \`integrity\` 속성의 해시와 비교
4. 불일치 시 리소스 실행/적용을 차단

**해시 생성:**
\`\`\`bash
openssl dgst -sha384 -binary lib.js | openssl base64 -A
# 또는
shasum -b -a 384 lib.js | awk '{print $1}' | xxd -r -p | base64
\`\`\`

**왜 필요한가?**
- CDN이 해킹되어 악성 코드가 삽입된 경우 방어
- 중간자 공격(MITM)으로 리소스가 변조된 경우 탐지
- 공급망 공격(supply chain attack) 완화

**주의사항:**
- CDN 리소스 업데이트 시 해시도 함께 갱신해야 합니다.
- \`crossorigin="anonymous"\` 속성이 필요합니다.`
    },
    // === 자료구조 (q-102 ~ q-103) ===
    {
      id: 'q-102', category_id: catMap['data-structure'], difficulty: 'medium',
      sub_category: '해시', order_num: nextOrder('data-structure'),
      question: '해시 테이블(Hash Table)의 원리와 충돌 해결 방법은?',
      tags: ['data-structure', 'hash-table', 'collision'],
      answer: `**해시 테이블**은 키(key)를 해시 함수로 변환하여 값(value)을 저장·조회하는 자료구조입니다. 평균 O(1) 시간 복잡도로 접근합니다.

**동작 원리:**
\`\`\`
key → hash(key) → index → bucket[index]에 저장
"name" → 해시 함수 → 3 → bucket[3] = "Kim"
\`\`\`

**해시 충돌 (Hash Collision):**
서로 다른 키가 같은 인덱스에 매핑되는 현상입니다.

**해결 방법 1 — 체이닝 (Chaining):**
\`\`\`js
// 각 버킷을 연결 리스트로 관리
bucket[3] = [["name", "Kim"], ["age", 30]] // 같은 인덱스에 여러 항목
\`\`\`
- 구현 간단, 삭제 용이
- 최악: O(n) — 모든 키가 같은 버킷

**해결 방법 2 — 개방 주소법 (Open Addressing):**
\`\`\`
충돌 시 다른 빈 버킷을 탐사:
- 선형 탐사: index+1, index+2, ...
- 이차 탐사: index+1², index+2², ...
- 이중 해싱: 다른 해시 함수로 간격 결정
\`\`\`

**JavaScript에서의 해시 테이블:**
- \`Object\`: 문자열/심볼 키만 가능
- \`Map\`: 모든 타입의 키 가능, 삽입 순서 유지, 크기 확인 용이
\`\`\`js
const map = new Map();
map.set({ id: 1 }, 'value'); // 객체도 키로 사용 가능
map.size; // 1
\`\`\``
    },
    {
      id: 'q-103', category_id: catMap['data-structure'], difficulty: 'medium',
      sub_category: '연결 리스트', order_num: nextOrder('data-structure'),
      question: '연결 리스트(Linked List)를 JavaScript로 구현해주세요.',
      tags: ['data-structure', 'linked-list', 'implementation'],
      answer: `**연결 리스트**는 각 노드가 데이터와 다음 노드 포인터를 가지는 선형 자료구조입니다.

**구현:**
\`\`\`js
class Node {
  constructor(value) {
    this.value = value;
    this.next = null;
  }
}

class LinkedList {
  constructor() {
    this.head = null;
    this.size = 0;
  }

  // 끝에 추가 - O(n)
  append(value) {
    const node = new Node(value);
    if (!this.head) { this.head = node; }
    else {
      let curr = this.head;
      while (curr.next) curr = curr.next;
      curr.next = node;
    }
    this.size++;
  }

  // 앞에 추가 - O(1)
  prepend(value) {
    const node = new Node(value);
    node.next = this.head;
    this.head = node;
    this.size++;
  }

  // 삭제 - O(n)
  delete(value) {
    if (!this.head) return;
    if (this.head.value === value) { this.head = this.head.next; this.size--; return; }
    let curr = this.head;
    while (curr.next && curr.next.value !== value) curr = curr.next;
    if (curr.next) { curr.next = curr.next.next; this.size--; }
  }

  // 검색 - O(n)
  find(value) {
    let curr = this.head;
    while (curr) { if (curr.value === value) return curr; curr = curr.next; }
    return null;
  }
}
\`\`\`

**배열 vs 연결 리스트:**
| 연산 | 배열 | 연결 리스트 |
|---|---|---|
| 인덱스 접근 | O(1) | O(n) |
| 앞에 삽입 | O(n) | O(1) |
| 중간 삽입 | O(n) | O(1) (노드 알 때) |
| 메모리 | 연속 | 비연속 (포인터 추가) |`
    },
    // === 알고리즘 (q-104 ~ q-105) ===
    {
      id: 'q-104', category_id: catMap['algorithm'], difficulty: 'medium',
      sub_category: 'DP', order_num: nextOrder('algorithm'),
      question: '동적 프로그래밍(Dynamic Programming)의 기초를 설명해주세요.',
      tags: ['algorithm', 'dynamic-programming', 'memoization'],
      answer: `**동적 프로그래밍(DP)**은 큰 문제를 작은 부분 문제로 나누고, 결과를 저장(memoization)하여 중복 계산을 피하는 기법입니다.

**DP 적용 조건:**
1. **최적 부분 구조**: 작은 문제의 최적해로 큰 문제의 최적해를 구성 가능
2. **중복 부분 문제**: 같은 부분 문제가 여러 번 반복

**예시 — 피보나치:**
\`\`\`js
// ❌ 순수 재귀 — O(2^n)
function fib(n) {
  if (n <= 1) return n;
  return fib(n - 1) + fib(n - 2); // 중복 계산 발생
}

// ✅ Top-Down (메모이제이션) — O(n)
function fibMemo(n, memo = {}) {
  if (n <= 1) return n;
  if (memo[n]) return memo[n];
  memo[n] = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);
  return memo[n];
}

// ✅ Bottom-Up (타뷸레이션) — O(n), 공간 O(1)
function fibTab(n) {
  let [a, b] = [0, 1];
  for (let i = 2; i <= n; i++) [a, b] = [b, a + b];
  return b;
}
\`\`\`

**접근 방법:**
| | Top-Down | Bottom-Up |
|---|---|---|
| 방식 | 재귀 + 메모이제이션 | 반복문 + 테이블 |
| 장점 | 직관적 | 스택 오버플로 없음 |
| 단점 | 콜 스택 제한 | 점화식 도출 필요 |

**대표 DP 문제:** 배낭 문제, 최장 공통 부분 수열(LCS), 계단 오르기, 동전 교환`
    },
    {
      id: 'q-105', category_id: catMap['algorithm'], difficulty: 'easy',
      sub_category: '기법', order_num: nextOrder('algorithm'),
      question: '투 포인터(Two Pointer) 기법이란?',
      tags: ['algorithm', 'two-pointer', 'technique'],
      answer: `**투 포인터**는 배열에서 두 개의 포인터를 사용하여 조건을 만족하는 쌍이나 구간을 효율적으로 찾는 기법입니다.

**유형 1 — 양끝에서 좁혀오기:**
\`\`\`js
// 정렬된 배열에서 합이 target인 쌍 찾기
function twoSum(arr, target) {
  let left = 0, right = arr.length - 1;
  while (left < right) {
    const sum = arr[left] + arr[right];
    if (sum === target) return [left, right];
    if (sum < target) left++;
    else right--;
  }
  return null; // O(n)
}
\`\`\`

**유형 2 — 같은 방향 (슬라이딩 윈도우):**
\`\`\`js
// 중복 없는 가장 긴 부분 문자열 길이
function longestUnique(s) {
  const set = new Set();
  let left = 0, maxLen = 0;
  for (let right = 0; right < s.length; right++) {
    while (set.has(s[right])) set.delete(s[left++]);
    set.add(s[right]);
    maxLen = Math.max(maxLen, right - left + 1);
  }
  return maxLen; // O(n)
}
\`\`\`

**유형 3 — 빠른/느린 포인터:**
\`\`\`js
// 연결 리스트 사이클 탐지 (Floyd's Cycle Detection)
function hasCycle(head) {
  let slow = head, fast = head;
  while (fast?.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false; // O(n)
}
\`\`\`

**핵심:** 브루트포스 O(n²)를 O(n)으로 줄이는 것이 목표입니다.`
    },
    // === 디자인패턴 (q-106 ~ q-107) ===
    {
      id: 'q-106', category_id: catMap['design-pattern'], difficulty: 'medium',
      sub_category: '생성 패턴', order_num: nextOrder('design-pattern'),
      question: '팩토리 패턴(Factory Pattern)을 설명해주세요.',
      tags: ['design-pattern', 'factory', 'creational'],
      answer: `**팩토리 패턴**은 객체 생성 로직을 별도의 함수/클래스로 분리하여, 사용하는 쪽이 구체적인 생성 과정을 알 필요 없게 하는 생성 패턴입니다.

**Simple Factory:**
\`\`\`js
function createNotification(type, message) {
  switch (type) {
    case 'success': return { type, message, icon: '✅', color: 'green' };
    case 'error':   return { type, message, icon: '❌', color: 'red' };
    case 'warning': return { type, message, icon: '⚠️', color: 'yellow' };
    default: throw new Error('Unknown type');
  }
}

const noti = createNotification('success', '저장 완료');
\`\`\`

**프론트엔드 활용 사례:**

1. **API 클라이언트 팩토리:**
\`\`\`ts
function createApiClient(baseURL: string) {
  return {
    get: (path: string) => fetch(baseURL + path),
    post: (path: string, body: unknown) =>
      fetch(baseURL + path, { method: 'POST', body: JSON.stringify(body) }),
  };
}
const api = createApiClient('/api/v1');
\`\`\`

2. **컴포넌트 팩토리:**
\`\`\`tsx
function createField(config: FieldConfig) {
  switch (config.type) {
    case 'text':     return <TextField {...config} />;
    case 'select':   return <SelectField {...config} />;
    case 'checkbox': return <CheckboxField {...config} />;
  }
}
\`\`\`

**장점:**
- 생성 로직 중앙화 → 변경 시 한 곳만 수정
- 사용하는 쪽의 코드가 단순해짐
- 조건부 객체 생성을 깔끔하게 처리`
    },
    {
      id: 'q-107', category_id: catMap['design-pattern'], difficulty: 'medium',
      sub_category: '행위 패턴', order_num: nextOrder('design-pattern'),
      question: '전략 패턴(Strategy Pattern)과 프론트엔드 적용 사례는?',
      tags: ['design-pattern', 'strategy', 'behavioral'],
      answer: `**전략 패턴**은 알고리즘(전략)을 캡슐화하여 런타임에 교체할 수 있게 하는 행위 패턴입니다.

**핵심 구조:**
\`\`\`ts
// 전략 인터페이스
interface SortStrategy {
  sort(data: number[]): number[];
}

// 구체적 전략
const bubbleSort: SortStrategy = { sort: (data) => { /* ... */ } };
const quickSort: SortStrategy  = { sort: (data) => { /* ... */ } };

// 컨텍스트 (전략 사용자)
function processData(data: number[], strategy: SortStrategy) {
  return strategy.sort(data);
}
\`\`\`

**프론트엔드 적용 사례:**

1. **폼 유효성 검사:**
\`\`\`ts
const validators = {
  email: (v: string) => /^[^@]+@[^@]+$/.test(v),
  phone: (v: string) => /^\\d{10,11}$/.test(v),
  required: (v: string) => v.trim().length > 0,
};

function validate(value: string, rules: (keyof typeof validators)[]) {
  return rules.every(rule => validators[rule](value));
}
\`\`\`

2. **가격 할인 정책:**
\`\`\`ts
const discountStrategies = {
  none: (price: number) => price,
  percent10: (price: number) => price * 0.9,
  vip: (price: number) => price * 0.8,
  coupon: (price: number) => Math.max(0, price - 5000),
};

function calcPrice(price: number, type: keyof typeof discountStrategies) {
  return discountStrategies[type](price);
}
\`\`\`

3. **렌더링 전략:** 리스트/그리드/카드 뷰 전환
4. **인증 전략:** OAuth/이메일/SSO 로그인 방식 전환

**장점:** if-else/switch 분기 제거, 전략 추가가 기존 코드 변경 없이 가능 (개방-폐쇄 원칙)`
    },
    // === Git (q-108 ~ q-109) ===
    {
      id: 'q-108', category_id: catMap['git'], difficulty: 'medium',
      sub_category: '명령어', order_num: nextOrder('git'),
      question: 'git cherry-pick의 용도와 사용법은?',
      tags: ['git', 'cherry-pick', 'commit'],
      answer: `**git cherry-pick**은 다른 브랜치의 특정 커밋을 현재 브랜치에 복사(적용)하는 명령입니다.

**기본 사용법:**
\`\`\`bash
# 특정 커밋 하나 적용
git cherry-pick <commit-hash>

# 여러 커밋 적용
git cherry-pick <hash1> <hash2> <hash3>

# 범위 적용 (A 이후 ~ B까지)
git cherry-pick A..B
\`\`\`

**유용한 옵션:**
\`\`\`bash
# 커밋하지 않고 변경사항만 스테이징
git cherry-pick --no-commit <hash>

# 충돌 발생 시
git cherry-pick --continue  # 충돌 해결 후 계속
git cherry-pick --abort     # cherry-pick 취소
\`\`\`

**활용 시나리오:**
1. **핫픽스 백포트**: main의 버그 수정 커밋을 release 브랜치에 적용
2. **특정 기능만 가져오기**: feature 브랜치에서 일부 커밋만 선별
3. **잘못된 브랜치 복구**: 잘못된 브랜치에 커밋한 작업을 올바른 브랜치로 이동

**주의사항:**
- cherry-pick은 새로운 커밋을 생성합니다 (해시가 다름)
- 같은 변경을 여러 브랜치에 cherry-pick하면 나중에 merge 시 충돌 가능
- 의존성이 있는 커밋은 순서대로 cherry-pick해야 합니다`
    },
    {
      id: 'q-109', category_id: catMap['git'], difficulty: 'medium',
      sub_category: '도구', order_num: nextOrder('git'),
      question: 'Git Hooks와 Husky를 이용한 코드 품질 관리 방법은?',
      tags: ['git', 'hooks', 'husky', 'lint-staged'],
      answer: `**Git Hooks**는 Git 이벤트(commit, push 등) 발생 시 자동으로 실행되는 스크립트입니다.

**주요 Hook 종류:**
| Hook | 시점 | 용도 |
|---|---|---|
| \`pre-commit\` | 커밋 전 | 린트, 포맷팅 검사 |
| \`commit-msg\` | 커밋 메시지 작성 후 | 커밋 메시지 규칙 검증 |
| \`pre-push\` | 푸시 전 | 테스트 실행 |

**Husky 설정 (v9):**
\`\`\`bash
npm install -D husky
npx husky init
\`\`\`

**lint-staged — 스테이징된 파일만 검사:**
\`\`\`bash
npm install -D lint-staged
\`\`\`
\`\`\`json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.css": ["prettier --write"]
  }
}
\`\`\`

**.husky/pre-commit:**
\`\`\`bash
npx lint-staged
\`\`\`

**commitlint — 커밋 메시지 규칙:**
\`\`\`bash
npm install -D @commitlint/cli @commitlint/config-conventional
\`\`\`
\`\`\`js
// commitlint.config.js
export default { extends: ['@commitlint/config-conventional'] };
// feat: 새 기능, fix: 버그 수정, docs: 문서, refactor: 리팩토링, ...
\`\`\`

**.husky/commit-msg:**
\`\`\`bash
npx --no -- commitlint --edit $1
\`\`\`

이 조합으로 커밋 시점에 자동으로 코드 품질과 커밋 규칙을 강제할 수 있습니다.`
    },
    // === 테스트 (q-110 ~ q-111) ===
    {
      id: 'q-110', category_id: catMap['testing'], difficulty: 'medium',
      sub_category: '방법론', order_num: nextOrder('testing'),
      question: 'TDD(테스트 주도 개발)의 원칙과 프론트엔드 적용법은?',
      tags: ['testing', 'tdd', 'methodology'],
      answer: `**TDD(Test-Driven Development)**는 테스트를 먼저 작성하고, 테스트를 통과하는 최소한의 코드를 구현한 뒤 리팩토링하는 개발 방법론입니다.

**TDD 사이클 (Red-Green-Refactor):**
1. **Red**: 실패하는 테스트 작성
2. **Green**: 테스트를 통과하는 최소 코드 구현
3. **Refactor**: 중복 제거, 코드 정리 (테스트 유지)

**프론트엔드 TDD 예시:**
\`\`\`ts
// 1. Red — 실패하는 테스트
describe('formatPrice', () => {
  it('원 단위로 포맷팅한다', () => {
    expect(formatPrice(1000)).toBe('1,000원');
    expect(formatPrice(0)).toBe('0원');
  });
});

// 2. Green — 최소 구현
function formatPrice(price: number): string {
  return price.toLocaleString('ko-KR') + '원';
}

// 3. Refactor — 필요 시 개선
\`\`\`

**프론트엔드에서 TDD가 효과적인 영역:**
- 순수 함수 (유틸, 포맷터, 밸리데이터)
- 커스텀 훅 (상태 로직)
- 리듀서 / 상태 머신

**TDD가 비효율적인 영역:**
- 레이아웃/스타일링 (시각적 요소)
- 외부 API 통합 (모킹 과다)
- 탐색적 프로토타이핑 (요구사항 불확실)

**실천 팁:**
- 작은 단위로 빠르게 사이클을 반복 (5~10분)
- 한 번에 하나의 행동만 테스트
- 구현 세부사항이 아닌 동작(behavior)을 테스트`
    },
    {
      id: 'q-111', category_id: catMap['testing'], difficulty: 'medium',
      sub_category: '도구', order_num: nextOrder('testing'),
      question: 'MSW(Mock Service Worker)란 무엇이고 어떻게 사용하나요?',
      tags: ['testing', 'msw', 'mocking', 'api'],
      answer: `**MSW(Mock Service Worker)**는 Service Worker를 이용해 네트워크 요청을 가로채고 모의 응답을 반환하는 API 모킹 라이브러리입니다.

**설정:**
\`\`\`ts
// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/users', () => {
    return HttpResponse.json([
      { id: 1, name: 'Kim' },
      { id: 2, name: 'Lee' },
    ]);
  }),

  http.post('/api/login', async ({ request }) => {
    const { email } = await request.json();
    return HttpResponse.json({ token: 'mock-token', email });
  }),
];
\`\`\`

**테스트 환경 (Node.js):**
\`\`\`ts
// vitest.setup.ts
import { setupServer } from 'msw/node';
import { handlers } from './mocks/handlers';

const server = setupServer(...handlers);
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
\`\`\`

**브라우저 환경 (개발용):**
\`\`\`ts
// src/mocks/browser.ts
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';
export const worker = setupWorker(...handlers);
\`\`\`

**장점:**
- 실제 \`fetch\`/\`axios\` 코드를 변경하지 않고 모킹
- 테스트·개발·Storybook에서 동일한 핸들러 재사용
- 요청/응답 형태가 실제 API와 동일하여 신뢰도 높음
- 네트워크 수준 모킹으로 구현 세부사항에 의존하지 않음`
    },
    // === CS 기초 (q-112 ~ q-113) ===
    {
      id: 'q-112', category_id: catMap['cs-fundamentals'], difficulty: 'medium',
      sub_category: '메모리', order_num: nextOrder('cs-fundamentals'),
      question: '콜 스택(Call Stack)과 힙(Heap) 메모리를 설명해주세요.',
      tags: ['cs', 'call-stack', 'heap', 'memory'],
      answer: `JavaScript 엔진의 메모리는 크게 **콜 스택**과 **힙**으로 나뉩니다.

**콜 스택 (Call Stack):**
함수 호출을 추적하는 LIFO(후입선출) 자료구조입니다.
\`\`\`js
function a() { b(); }
function b() { c(); }
function c() { console.log('hello'); }
a();

// 콜 스택 변화:
// [a] → [a, b] → [a, b, c] → [a, b] → [a] → []
\`\`\`
- 원시 타입(number, string, boolean) 값이 저장됨
- 함수 실행 컨텍스트(매개변수, 지역 변수) 저장
- 크기 제한 있음 → 스택 오버플로 가능 (무한 재귀)

**힙 (Heap):**
객체, 배열, 함수 등 참조 타입이 저장되는 비정형 메모리 영역입니다.
\`\`\`js
const obj = { name: 'Kim' };
// 스택: obj → 힙 주소(참조)
// 힙: { name: 'Kim' } 실제 데이터
\`\`\`
- 동적으로 크기 결정
- 가비지 컬렉터(GC)가 미사용 객체 자동 해제

**스택 vs 힙:**
| | 콜 스택 | 힙 |
|---|---|---|
| 저장 대상 | 원시값, 실행 컨텍스트 | 객체, 배열, 함수 |
| 접근 속도 | 빠름 | 상대적 느림 |
| 관리 | 자동 (LIFO) | GC가 관리 |
| 크기 | 제한적 | 상대적 큼 |

**실무 관련:** 메모리 누수는 주로 힙에서 발생합니다 — 이벤트 리스너 미해제, 클로저의 의도치 않은 참조 유지 등.`
    },
    {
      id: 'q-113', category_id: catMap['cs-fundamentals'], difficulty: 'medium',
      sub_category: '동시성', order_num: nextOrder('cs-fundamentals'),
      question: '동시성(Concurrency)과 병렬성(Parallelism)의 차이점은?',
      tags: ['cs', 'concurrency', 'parallelism'],
      answer: `**동시성(Concurrency):**
여러 작업을 **논리적으로 동시에** 다루는 것입니다. 실제로는 하나의 실행 단위가 작업 간 전환하며 처리합니다.
\`\`\`
[작업 A ■■□□■■]
[작업 B □□■■□□]  ← 하나의 코어에서 번갈아 실행
\`\`\`

**병렬성(Parallelism):**
여러 작업을 **물리적으로 동시에** 실행하는 것입니다. 여러 CPU 코어가 각각 작업을 처리합니다.
\`\`\`
[코어 1: 작업 A ■■■■■■]
[코어 2: 작업 B ■■■■■■]  ← 실제로 동시 실행
\`\`\`

**JavaScript에서의 적용:**

**동시성 — 이벤트 루프 기반:**
\`\`\`js
// 싱글 스레드지만 여러 비동기 작업을 동시에 다룸
const [users, posts] = await Promise.all([
  fetch('/api/users'),
  fetch('/api/posts'),
]);
// 네트워크 요청은 동시에 발생, 결과 처리는 싱글 스레드
\`\`\`

**병렬성 — Web Workers:**
\`\`\`js
// 별도 스레드에서 CPU 집약적 작업 실행
const worker = new Worker('heavy-calc.js');
worker.postMessage(data);
worker.onmessage = (e) => console.log(e.data);
\`\`\`

**비교:**
| | 동시성 | 병렬성 |
|---|---|---|
| 핵심 | 작업 관리 (구조) | 작업 실행 (속도) |
| 스레드 | 싱글 가능 | 멀티 필수 |
| JS 예시 | async/await, Promise | Web Worker, Node Worker Threads |
| 적합 | I/O 바운드 작업 | CPU 바운드 작업 |

JavaScript는 싱글 스레드이므로 기본적으로 동시성 모델이며, 병렬성이 필요할 때 Web Worker를 활용합니다.`
    },
  ];

  const { data: inserted, error: insertErr } = await sbAdmin
    .from('questions')
    .upsert(newQuestions, { onConflict: 'id' })
    .select('id');

  if (insertErr) throw insertErr;
  console.log(`\n=== Part 2 완료: 새 질문 ${inserted.length}건 추가 ===`);
  console.log(`\n총 결과: 수정 ${count}건 + 추가 ${inserted.length}건`);

} catch (err) {
  console.error('❌ Part 2 오류:', err.message);
  process.exit(1);
}
