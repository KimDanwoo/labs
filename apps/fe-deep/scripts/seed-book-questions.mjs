import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env.local', 'utf-8');
for (const line of envContent.split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i > 0) process.env[t.slice(0, i)] = t.slice(i + 1);
}

const sbAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// ============================================================
// 신규 카테고리
// ============================================================

const NEW_CATEGORIES = [
  {
    id: 'cat-17',
    slug: 'build-tooling',
    title: '빌드·배포',
    order_num: 17,
    icon: '⚙️',
    description: '번들러, 패키지 매니저, 빌드 파이프라인과 배포',
  },
  {
    id: 'cat-18',
    slug: 'ai-frontend',
    title: 'AI 프론트엔드',
    order_num: 18,
    icon: '🤖',
    description: 'LLM 연동 UI, 스트리밍, 토큰·컨텍스트 관리',
  },
];

// ============================================================
// cat-1 HTML
// ============================================================

const HTML = [
  {
    id: 'q-169',
    question: 'HTML이란 무엇인가요?',
    answer: `HTML(HyperText Markup Language)은 웹 문서의 **구조와 의미**를 정의하는 마크업 언어입니다. 프로그래밍 언어가 아니라 "이 텍스트가 제목인지 문단인지 목록인지"를 태그로 표시하는 언어입니다.

**핵심 성격**
- **HyperText** — 문서 간 링크(\`<a href>\`)로 서로 연결되는 비선형 문서
- **Markup** — 콘텐츠를 태그로 감싸 역할을 부여
- **선언적** — "어떻게 그릴지"가 아니라 "무엇인지"를 기술. 렌더링 방법은 브라우저가 결정

**웹 3요소에서의 위치**

| 언어 | 역할 | 비유 |
| --- | --- | --- |
| HTML | 구조·의미 | 뼈대 |
| CSS | 표현 | 살·옷 |
| JavaScript | 동작 | 근육 |

**표준**
현재 표준은 **HTML Living Standard**(WHATWG)입니다. HTML5 이후 버전 번호를 붙이지 않고 지속적으로 갱신되는 방식으로 바뀌었으며, W3C가 관리하던 버전형 스펙은 2019년 WHATWG로 일원화됐습니다.

> 면접 포인트: "HTML은 프로그래밍 언어인가?" → 아니다. 제어 흐름·변수·연산이 없는 마크업 언어다.`,
    sub_category: 'HTML 기초',
    difficulty: 'easy',
    tags: ['HTML', '마크업', '웹표준'],
  },
  {
    id: 'q-170',
    question: '<head> 태그 안에는 어떤 태그를 사용하나요?',
    answer: `\`<head>\`는 **화면에 렌더링되지 않는 문서 메타데이터**를 담는 영역입니다.

**필수/핵심**
- \`<meta charset="UTF-8">\` — 인코딩 선언. **반드시 head 최상단**(바이트 기준 1024바이트 이내)에 둬야 브라우저가 파싱을 재시작하지 않음
- \`<title>\` — 문서 제목. 탭·북마크·검색결과 제목에 사용되며 접근성상 필수
- \`<meta name="viewport" content="width=device-width, initial-scale=1">\` — 모바일 반응형의 전제

**메타데이터**
- \`<meta name="description">\` — 검색결과 스니펫
- \`<meta property="og:*">\` — 오픈그래프(SNS 공유 카드)
- \`<link rel="canonical">\` — 중복 URL 정규화
- \`<meta name="robots">\` — 색인 정책

**리소스 연결**
- \`<link rel="stylesheet">\` — CSS. head에 두는 이유는 FOUC(스타일 미적용 깜빡임) 방지
- \`<link rel="icon">\` — 파비콘
- \`<link rel="preconnect" | "preload" | "prefetch">\` — 리소스 힌트
- \`<script>\` — head에 둘 경우 \`defer\`/\`async\` 권장. 없으면 파서를 블로킹
- \`<style>\`, \`<base>\`, \`<noscript>\`

**주의**
\`<head>\` 안에 \`<div>\`, \`<p>\` 같은 콘텐츠 태그를 넣으면 브라우저가 암묵적으로 \`<head>\`를 닫고 \`<body>\`를 시작해버립니다. 이후의 \`<meta>\`·\`<link>\`가 body로 밀려 의도대로 동작하지 않습니다.`,
    sub_category: 'HTML 기초',
    difficulty: 'easy',
    tags: ['HTML', 'head', 'meta', 'SEO'],
  },
  {
    id: 'q-171',
    question: '웹 표준과 웹 접근성이란 무엇인가요?',
    answer: `**웹 표준(Web Standards)**
W3C·WHATWG 등이 정한 웹 기술 규격(HTML·CSS·DOM·ECMAScript 등). 특정 브라우저나 플러그인에 의존하지 않고 **어떤 환경에서도 동일하게 동작**하도록 하는 합의입니다.

지키면 얻는 것:
- 크로스 브라우징 — 브라우저별 분기 코드 감소
- 유지보수성 — 구조(HTML)/표현(CSS)/동작(JS) 분리
- SEO — 검색 엔진이 구조를 해석 가능
- 접근성의 전제 — 표준 마크업이라야 보조기술이 해석함

**웹 접근성(Web Accessibility, a11y)**
장애 유무·기기·환경에 관계없이 누구나 웹 콘텐츠를 인식하고 사용할 수 있게 하는 것. 국내는 **KWCAG**, 국제는 **WCAG**(현행 2.2) 기준을 따릅니다.

WCAG의 4원칙 **POUR**:

| 원칙 | 의미 | 실무 예 |
| --- | --- | --- |
| **P**erceivable(인식의 용이성) | 콘텐츠를 인지할 수 있어야 | 이미지 alt, 자막, 명도 대비 4.5:1 |
| **O**perable(운용의 용이성) | 조작할 수 있어야 | 키보드만으로 전체 조작, 포커스 표시 |
| **U**nderstandable(이해의 용이성) | 내용·UI가 이해 가능해야 | 명확한 레이블, 오류 메시지 |
| **R**obust(견고성) | 보조기술이 해석 가능해야 | 유효한 마크업, 올바른 ARIA |

**둘의 관계**
웹 표준은 수단, 접근성은 목적에 가깝습니다. 표준을 지킨다고 접근성이 자동 보장되진 않지만(예: 유효한 HTML이어도 alt가 없을 수 있음), 표준을 어기면 접근성은 거의 확실히 깨집니다.

> 국내에서는 「장애인차별금지법」에 따라 공공기관·일정 규모 이상 민간 웹사이트에 접근성 준수 의무가 있습니다.`,
    sub_category: '접근성',
    difficulty: 'medium',
    tags: ['웹표준', '접근성', 'WCAG', 'a11y'],
  },
  {
    id: 'q-172',
    question: '모든 HTML 태그에는 종료 태그가 있나요?',
    answer: `아닙니다. HTML 요소는 종료 태그 유무에 따라 세 가지로 나뉩니다.

**1. Void element (빈 요소) — 종료 태그가 없음**
자식 콘텐츠를 가질 수 없는 요소입니다.

\`area, base, br, col, embed, hr, img, input, link, meta, source, track, wbr\`

\`\`\`html
<br>        <!-- HTML: 올바름 -->
<br />      <!-- XHTML/JSX 스타일. HTML에서도 파싱은 되지만 슬래시는 무시됨 -->
<br></br>   <!-- 잘못됨. 종료 태그 자체가 허용되지 않음 -->
\`\`\`

**2. 종료 태그 생략 가능 (Optional tag)**
브라우저가 다음 요소를 만나면 암묵적으로 닫습니다.

\`\`\`html
<ul>
  <li>하나
  <li>둘
</ul>
<p>문단 하나
<p>문단 둘
\`\`\`

\`html\`, \`head\`, \`body\`, \`p\`, \`li\`, \`tr\`, \`td\`, \`th\`, \`option\`, \`thead\`, \`tbody\` 등이 해당합니다. **파싱은 되지만 실무에서는 명시적으로 닫는 것을 권장**합니다 — 생략 규칙이 직관과 어긋나는 경우가 있고 diff·가독성이 나빠집니다.

**3. 필수 종료 태그**
\`div\`, \`span\`, \`a\`, \`script\`, \`textarea\` 등 나머지 대부분. 안 닫으면 이후 콘텐츠가 그 요소 안으로 빨려 들어갑니다.

**HTML vs XHTML/JSX**
- HTML — void 요소에 슬래시 불필요, 대소문자 무관, 일부 생략 허용
- XHTML/JSX — XML 규칙이라 **모든 요소를 닫아야 함**. \`<img />\`, \`<br />\` 필수

> JSX에서 \`<br>\`을 쓰면 컴파일 에러가 나는 이유가 이것입니다.`,
    sub_category: 'HTML 기초',
    difficulty: 'easy',
    tags: ['HTML', 'void element', '파싱'],
  },
  {
    id: 'q-173',
    question: '<a> 태그는 어떻게 사용하나요?',
    answer: `\`<a>\`(anchor)는 하이퍼링크를 만드는 요소로, 웹의 근간입니다.

**주요 속성**

| 속성 | 설명 |
| --- | --- |
| \`href\` | 이동 대상. URL, \`#id\`(페이지 내), \`mailto:\`, \`tel:\` |
| \`target\` | \`_self\`(기본), \`_blank\`(새 탭) |
| \`rel\` | 관계. \`noopener\`, \`noreferrer\`, \`nofollow\` |
| \`download\` | 이동 대신 다운로드. 값 지정 시 파일명 |
| \`hreflang\`, \`type\` | 대상 언어·MIME 힌트 |

**\`target="_blank"\`의 보안 이슈 — 반드시 알아야 함**

\`\`\`html
<a href="https://external.com" target="_blank" rel="noopener noreferrer">외부 링크</a>
\`\`\`

\`noopener\` 없이 새 탭을 열면 열린 페이지가 \`window.opener\`로 **원본 탭의 location을 조작**할 수 있습니다(reverse tabnabbing — 피싱 페이지로 바꿔치기). 최신 브라우저는 \`target="_blank"\`에 \`noopener\`를 암묵 적용하지만, 구형 브라우저 대응과 명시성을 위해 직접 쓰는 것이 안전합니다. \`noreferrer\`는 Referer 헤더까지 제거합니다.

**접근성**
- 링크 텍스트는 그 자체로 목적지를 설명해야 합니다. "여기를 클릭"(❌) → "요금제 안내 보기"(⭕). 스크린리더는 링크만 모아 읽는 기능이 있어 문맥 없는 텍스트는 무의미합니다
- 새 탭으로 열리면 그 사실을 알려야 합니다(아이콘 + \`aria-label\` 또는 시각적 텍스트)
- \`href\` 없는 \`<a>\`는 링크가 아니라 **placeholder**입니다. 포커스도 안 잡히고 Enter로 실행되지 않습니다

**\`<a>\` vs \`<button>\` — 가장 흔한 실수**

| | \`<a href>\` | \`<button>\` |
| --- | --- | --- |
| 용도 | **이동**(URL 변경) | **동작**(제출, 모달 열기) |
| 키보드 | Enter | Enter + Space |
| 우클릭 | 새 탭으로 열기 가능 | 불가 |

\`<a href="#" onclick="doSomething()">\`는 안티패턴입니다. 동작이면 \`<button type="button">\`을 쓰세요.

**Next.js에서는**
클라이언트 사이드 내비게이션을 위해 내부 링크에 \`<Link>\`를 사용합니다. 렌더링 결과는 \`<a>\`이며 prefetch가 붙습니다. 외부 링크는 그냥 \`<a>\`로 둡니다.`,
    sub_category: 'HTML 기초',
    difficulty: 'easy',
    tags: ['HTML', 'a 태그', '링크', '접근성', 'noopener'],
  },
  {
    id: 'q-174',
    question: '<iframe> 태그의 장점과 단점은 무엇인가요?',
    answer: `\`<iframe>\`은 현재 문서 안에 **다른 HTML 문서를 통째로 임베드**하는 요소입니다.

**장점**
- **격리(isolation)** — 별도 브라우징 컨텍스트라 CSS·JS 전역이 섞이지 않음. 서드파티 위젯(결제, 지도, 유튜브)에 적합
- **크로스 오리진 샌드박싱** — 다른 출처의 콘텐츠를 동일 출처 정책 보호 아래 표시
- **재사용** — 결제창처럼 규제 대상 UI를 제공사가 통째로 책임지고 배포 가능(PG사 결제창이 iframe인 이유)
- **레거시 통합** — 마이크로 프론트엔드에서 기술 스택이 다른 앱을 붙이는 가장 단순한 방법

**단점**
- **성능** — 별도 문서라 자체 렌더링 트리·JS 컨텍스트를 가짐. 메인 스레드·메모리 비용이 크고 LCP를 악화시킴
- **SEO** — iframe 내부 콘텐츠는 부모 문서의 콘텐츠로 취급되지 않음
- **반응형 어려움** — 내부 높이를 부모가 알 수 없어 \`postMessage\`로 높이를 주고받는 편법이 필요
- **접근성** — \`title\` 속성이 없으면 스크린리더가 "프레임"이라고만 읽음. 포커스 순서 관리도 까다로움
- **보안** — 클릭재킹의 매개가 되고, 반대로 내가 iframe에 갇힐 수도 있음
- **딥링크 불가** — iframe 내부 상태가 부모 URL에 반영되지 않아 뒤로가기·공유가 깨짐

**보안 통제**

\`\`\`html
<iframe
  src="https://widget.example.com"
  title="결제 위젯"
  sandbox="allow-scripts allow-forms"
  referrerpolicy="no-referrer"
  loading="lazy"
></iframe>
\`\`\`

- \`sandbox\` — **빈 값이면 모든 것을 차단**하고, \`allow-*\`로 필요한 것만 개방. \`allow-scripts\`와 \`allow-same-origin\`을 **동시에** 주면 샌드박스를 스스로 해제할 수 있으므로 위험
- 반대로 **내 사이트가 iframe에 임베드되는 것을 막으려면** 응답 헤더로 \`Content-Security-Policy: frame-ancestors 'none'\`(권장) 또는 \`X-Frame-Options: DENY\`를 보냅니다 — 클릭재킹 방어

**대안**
- 컴포넌트 격리 목적 → Shadow DOM
- 유튜브 등 무거운 임베드 → 썸네일 클릭 시 지연 삽입(facade 패턴)`,
    sub_category: '보안/성능',
    difficulty: 'medium',
    tags: ['iframe', 'sandbox', '클릭재킹', '성능'],
  },
  {
    id: 'q-175',
    question: '헤딩 태그란 무엇인가요?',
    answer: `\`<h1>\`~\`<h6>\`은 문서의 **제목 계층(outline)**을 표현하는 시맨틱 태그입니다. 글자 크기를 키우는 태그가 아닙니다 — 크기는 CSS의 몫이고, 헤딩이 전달하는 것은 **구조적 위계**입니다.

**왜 중요한가**
- **접근성** — 스크린리더 사용자의 상당수가 헤딩 목록으로 페이지를 훑고 이동합니다. 헤딩이 없거나 순서가 엉키면 페이지 전체 구조를 파악할 수 없습니다
- **SEO** — 검색 엔진이 문서 주제와 섹션 구조를 파악하는 주요 신호
- **유지보수** — 계층이 명확하면 마크업만 봐도 정보 구조가 읽힘

**규칙**
1. **레벨을 건너뛰지 않는다** — \`h2\` 다음에 \`h4\`(❌). 순차적으로 내려갑니다
2. **페이지당 \`h1\`은 1개** — 그 페이지가 무엇에 관한 문서인지. (HTML Living Standard상 복수 \`h1\`이 불법은 아니지만, 실제 보조기술 지원 상황을 고려하면 1개가 안전합니다)
3. **시각적 크기 때문에 레벨을 고르지 않는다** — 작게 보이고 싶으면 \`h3\`을 쓰는 게 아니라 \`h2\`에 CSS를 적용합니다
4. 장식용 큰 글자는 헤딩이 아니라 \`<p>\` + CSS

\`\`\`html
<h1>프론트엔드 면접 대비</h1>
  <h2>HTML</h2>
    <h3>시맨틱 태그</h3>
    <h3>폼</h3>
  <h2>CSS</h2>
    <h3>레이아웃</h3>
\`\`\`

**섹셔닝 요소와의 관계**
\`<section>\`, \`<article>\`, \`<nav>\`, \`<aside>\` 안의 헤딩은 그 섹션의 제목입니다. 한때 "섹셔닝 요소 안에서는 \`h1\`을 반복해도 브라우저가 알아서 레벨을 계산한다"는 HTML5 아웃라인 알고리즘이 제안됐지만 **어떤 브라우저도 구현하지 않았고 스펙에서 제거**됐습니다. 반드시 명시적 레벨을 쓰세요.

> 검증 팁: 브라우저 확장(HeadingsMap 등)이나 접근성 검사 도구로 헤딩 아웃라인을 시각화해 보면 계층 오류가 바로 드러납니다.`,
    sub_category: '시맨틱 HTML',
    difficulty: 'easy',
    tags: ['헤딩', '시맨틱', 'SEO', '접근성'],
  },
  {
    id: 'q-176',
    question: 'HTML 엔티티란 무엇인가요?',
    answer: `HTML 엔티티는 **마크업으로 해석될 수 있는 문자나 직접 입력하기 어려운 문자**를 안전하게 표기하는 이스케이프 표기법입니다. \`&이름;\` 또는 \`&#숫자;\` 형태입니다.

**필수 5종**

| 문자 | 엔티티 | 왜 필요한가 |
| --- | --- | --- |
| \`<\` | \`&lt;\` | 태그 시작으로 해석됨 |
| \`>\` | \`&gt;\` | 태그 종료로 해석됨 |
| \`&\` | \`&amp;\` | 엔티티 시작으로 해석됨 |
| \`"\` | \`&quot;\` | 속성값 구분자 |
| \`'\` | \`&#39;\` | 속성값 구분자 (\`&apos;\`는 HTML5부터 지원) |

**자주 쓰는 것**
- \`&nbsp;\` — 줄바꿈되지 않는 공백. 연속 공백 유지, 단어 붙임(\`10&nbsp;kg\`)
- \`&copy;\` ©, \`&reg;\` ®, \`&times;\` ×, \`&hellip;\` …, \`&mdash;\` —

**표기 방식 3가지**

\`\`\`html
&lt;      <!-- 이름 -->
&#60;     <!-- 10진 코드포인트 -->
&#x3C;    <!-- 16진 코드포인트 -->
\`\`\`

**보안 관점 — 여기가 핵심**

엔티티 인코딩은 **XSS 방어의 기본 수단**입니다. 사용자 입력을 그대로 HTML에 넣으면:

\`\`\`
입력: <script>alert(1)</script>
그대로 삽입 → 스크립트 실행
엔티티 인코딩 → &lt;script&gt;alert(1)&lt;/script&gt; → 화면에 글자로 표시
\`\`\`

React/Vue/Angular의 \`{}\` 보간은 **기본적으로 이 인코딩을 자동 수행**합니다. 그래서 \`dangerouslySetInnerHTML\`이나 \`v-html\`은 이 방어를 명시적으로 끄는 행위이며, 반드시 DOMPurify 같은 새니타이저를 통과시켜야 합니다.

> 주의: 엔티티 인코딩은 **HTML 컨텍스트** 방어입니다. 값이 URL(\`href\`)이나 JS 문자열, CSS 안에 들어간다면 각 컨텍스트에 맞는 별도 인코딩이 필요합니다. \`&lt;\`로 바꿔도 \`javascript:\` URL은 막히지 않습니다.`,
    sub_category: 'HTML 기초',
    difficulty: 'medium',
    tags: ['엔티티', '이스케이프', 'XSS', '보안'],
  },
  {
    id: 'q-177',
    question: '<img> 태그의 srcset 속성은 언제 사용하나요?',
    answer: `\`srcset\`은 브라우저가 **디바이스 환경(화면 밀도·뷰포트 너비)에 맞는 이미지를 스스로 고르게** 하는 반응형 이미지 속성입니다. 레티나 디스플레이에 저해상도 이미지를 주거나, 모바일에 2000px 이미지를 내려받게 하는 낭비를 막습니다.

**1. 밀도 서술자(x) — 같은 크기, 다른 해상도**

\`\`\`html
<img src="logo.png" srcset="logo.png 1x, logo@2x.png 2x, logo@3x.png 3x" alt="로고" width="200" height="50">
\`\`\`

로고·아이콘처럼 **표시 크기가 고정**된 이미지에 사용합니다.

**2. 너비 서술자(w) + sizes — 표시 크기가 뷰포트에 따라 변할 때**

\`\`\`html
<img
  src="photo-800.jpg"
  srcset="photo-400.jpg 400w, photo-800.jpg 800w, photo-1600.jpg 1600w"
  sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 600px"
  alt="풍경"
  width="800" height="600">
\`\`\`

- \`srcset\`의 \`w\`는 **이미지 파일의 실제 픽셀 너비**입니다(표시 너비가 아님)
- \`sizes\`는 "이 이미지가 화면에서 얼마나 넓게 표시될지"를 브라우저에 알려줍니다. **CSS보다 먼저 필요한 정보**라 브라우저가 알 수 없어 개발자가 선언해야 합니다
- 브라우저는 \`sizes\`로 필요한 CSS 픽셀 폭을 계산하고 DPR을 곱해 최적 후보를 고릅니다

**\`sizes\`를 빠뜨리면** 기본값 \`100vw\`로 간주되어 항상 과대한 이미지를 고릅니다 — 가장 흔한 실수입니다.

**\`<picture>\`와의 차이 — 판단 기준**

| | \`srcset\` | \`<picture>\` |
| --- | --- | --- |
| 결정 주체 | **브라우저**(힌트만 제공) | **개발자**(명시적 분기) |
| 용도 | 같은 이미지의 해상도 변형 | **아트 디렉션**(구도 자체가 다름), 포맷 폴백 |

\`\`\`html
<picture>
  <source srcset="hero.avif" type="image/avif">
  <source srcset="hero.webp" type="image/webp">
  <img src="hero.jpg" alt="히어로">
</picture>
\`\`\`

**실무 팁**
- \`width\`/\`height\`를 항상 명시하세요. 종횡비가 예약되어 **CLS**를 막습니다
- Next.js \`<Image>\`는 \`srcset\`·\`sizes\`·lazy loading·포맷 변환을 자동 생성합니다. 다만 \`fill\`이나 반응형 레이아웃에서는 \`sizes\`를 직접 지정해야 과대 이미지 다운로드를 피할 수 있습니다`,
    sub_category: '성능',
    difficulty: 'medium',
    tags: ['srcset', '반응형 이미지', 'picture', '성능', 'CLS'],
  },
  {
    id: 'q-178',
    question: 'HTML 인코딩이란 무엇인가요?',
    answer: `"HTML 인코딩"은 문맥에 따라 두 가지를 뜻합니다. 면접에서는 **어느 쪽을 묻는지 확인**하고 답하는 게 좋습니다.

## 1. 문자 인코딩(Character Encoding)

바이트 시퀀스를 문자로 해석하는 규칙입니다. 브라우저가 HTML 파일의 바이트를 어떤 문자로 읽을지 결정합니다.

\`\`\`html
<meta charset="UTF-8">
\`\`\`

- **UTF-8이 사실상 유일한 정답** — 유니코드 전체를 표현하고 ASCII와 하위 호환. HTML Living Standard도 UTF-8을 요구합니다
- **\`<head>\` 최상단**(문서 시작 1024바이트 이내)에 둬야 합니다. 늦게 선언되면 브라우저가 파싱을 중단하고 **재시작**합니다
- 선언이 없으면 브라우저가 추측하며, 잘못 추측하면 한글이 깨집니다(모지바케). EUC-KR로 저장된 파일에 UTF-8을 선언해도 깨집니다 — **파일 저장 인코딩과 선언이 일치**해야 합니다
- HTTP 응답 헤더 \`Content-Type: text/html; charset=utf-8\`이 \`<meta>\`보다 **우선**합니다

**URL 인코딩과 혼동 주의** — URL의 비ASCII·특수문자는 \`%\` 인코딩(퍼센트 인코딩)을 씁니다. \`encodeURIComponent()\`가 그 역할이며 HTML 인코딩과 별개입니다.

## 2. HTML 엔티티 인코딩(이스케이프)

\`<\`, \`>\`, \`&\`, \`"\` 같은 **마크업 특수문자를 엔티티로 치환**하는 것입니다. 사용자 입력을 HTML에 삽입할 때 XSS를 막는 기본 방어입니다.

\`\`\`
<script>  →  &lt;script&gt;
\`\`\`

**컨텍스트별로 인코딩이 다릅니다 — 이게 핵심**

| 삽입 위치 | 필요한 인코딩 |
| --- | --- |
| HTML 본문 | 엔티티 인코딩 |
| HTML 속성값 | 엔티티 인코딩 + 따옴표 처리 |
| URL(\`href\`, \`src\`) | 퍼센트 인코딩 + **스킴 검증**(\`javascript:\` 차단) |
| \`<script>\` 안 | JS 문자열 이스케이프 (\`JSON.stringify\`) |
| CSS 값 | CSS 이스케이프 |

엔티티 인코딩 하나로 모든 XSS가 막힌다고 답하면 감점 포인트입니다. \`href="javascript:alert(1)"\`은 엔티티 인코딩으로 막히지 않습니다.

> 프레임워크: React의 JSX 보간, Vue의 \`{{ }}\`는 HTML 컨텍스트 엔티티 인코딩을 자동 수행합니다. 하지만 \`href={userInput}\` 같은 URL 컨텍스트는 여전히 개발자 책임입니다.`,
    sub_category: 'HTML 기초',
    difficulty: 'medium',
    tags: ['인코딩', 'UTF-8', 'charset', 'XSS'],
  },
];

// ============================================================
// cat-2 CSS
// ============================================================

const CSS = [
  {
    id: 'q-179',
    question: 'CSS란 무엇인가요?',
    answer: `CSS(Cascading Style Sheets)는 HTML로 표현된 문서의 **표현(presentation)**을 기술하는 스타일 시트 언어입니다. 구조(HTML)와 표현(CSS)을 분리해 같은 마크업에 다른 디자인을 입힐 수 있게 합니다.

**이름의 "Cascading"이 핵심**
여러 출처에서 온 스타일 선언이 충돌할 때 **어떤 것을 적용할지 결정하는 폭포수 알고리즘**을 뜻합니다. 우선순위는 순서대로:

1. **출처와 중요도(Origin & Importance)** — 사용자 에이전트 < 사용자 < 작성자 스타일. \`!important\`가 붙으면 이 순서가 역전
2. **캐스케이드 레이어(\`@layer\`)** — 나중에 선언된 레이어가 우선
3. **명시도(Specificity)** — ID(1,0,0) > 클래스·속성·의사클래스(0,1,0) > 요소·의사요소(0,0,1)
4. **소스 순서** — 위 모두 같으면 **나중에 선언된 것**이 이김

**세 가지 기둥**

| 개념 | 내용 |
| --- | --- |
| **Cascade** | 충돌하는 선언 중 승자를 고름 |
| **Specificity** | 선택자의 구체성 점수 |
| **Inheritance** | \`color\`, \`font-*\` 등 일부 속성은 자식으로 전파. \`border\`, \`margin\` 등은 상속되지 않음 |

**적용 방법 3가지**
- 인라인 \`style=""\` — 명시도가 매우 높아(1,0,0,0) 재정의가 어려움. 지양
- \`<style>\` 내부 스타일
- \`<link rel="stylesheet">\` 외부 스타일 — 캐싱 가능. 실무 기본

**최신 CSS는 더 이상 "정적"이 아닙니다**
\`@supports\`(기능 질의), \`@container\`(컨테이너 질의), \`:has()\`(부모 선택), CSS 변수(\`--x\`), \`@layer\`, \`calc()\`, \`clamp()\` 등으로 과거 JS나 전처리기에 의존하던 상당 부분을 CSS 자체가 흡수했습니다.

> 면접 포인트: "CSS에서 우선순위는 어떻게 결정되나요?" → 명시도만 답하면 부족합니다. **출처/중요도 → 레이어 → 명시도 → 순서**의 4단계로 답하세요.`,
    sub_category: 'CSS 기초',
    difficulty: 'easy',
    tags: ['CSS', 'Cascade', '명시도', '상속'],
  },
  {
    id: 'q-180',
    question: '가상 클래스와 가상 요소의 차이점은 무엇인가요?',
    answer: `**한 줄 요약: 가상 클래스는 "존재하는 요소의 특정 상태"를 고르고, 가상 요소는 "존재하지 않는 가상의 요소"를 만들어냅니다.**

| | 가상 클래스 (Pseudo-class) | 가상 요소 (Pseudo-element) |
| --- | --- | --- |
| 표기 | 콜론 1개 \`:hover\` | 콜론 2개 \`::before\` |
| 대상 | **실제 DOM 요소**의 상태·위치 | DOM에 없는 **가상 박스** |
| 개수 | 선택자당 여러 개 가능 | 선택자당 원칙적으로 1개 |
| 접근성 | DOM 요소이므로 정상 인식 | 스크린리더 지원이 불균일 |

**가상 클래스 — 상태/위치 선택**

\`\`\`css
a:hover, a:focus-visible { }        /* 상호작용 상태 */
input:checked, input:disabled { }   /* 폼 상태 */
li:first-child, li:nth-child(2n) { }/* 구조적 위치 */
p:not(.excluded) { }                /* 부정 */
.card:has(> img) { }                /* 자식 조건 (부모 선택) */
\`\`\`

**가상 요소 — 콘텐츠 생성/부분 선택**

\`\`\`css
.badge::before { content: "★"; }    /* content 필수 */
.text::first-line { font-weight: 700; }
input::placeholder { color: #999; }
::selection { background: yellow; }
\`\`\`

**\`::before\`/\`::after\`의 필수 조건**
\`content\` 속성이 없으면 **아예 생성되지 않습니다**. 빈 장식이면 \`content: ""\`를 명시해야 합니다.

**콜론 개수**
CSS3부터 가상 요소는 \`::\`로 구분하도록 바뀌었습니다. \`:before\` 같은 단일 콜론은 하위 호환을 위해 여전히 파싱되지만, **새 코드는 \`::\`를 쓰세요**. \`::backdrop\`, \`::part()\` 같은 최신 가상 요소는 단일 콜론을 지원하지 않습니다.

**적용되지 않는 요소**
\`::before\`/\`::after\`는 **교체 요소(replaced element)**에 동작하지 않습니다 — \`<img>\`, \`<input>\`, \`<br>\`, \`<iframe>\` 등. 내용을 브라우저가 외부에서 가져와 대체하기 때문입니다. \`<img>::after\`가 안 먹는 이유가 이것입니다.

**접근성 주의**
\`content\`로 넣은 텍스트는 브라우저마다 스크린리더 노출이 다릅니다. **의미 있는 정보는 절대 \`::before\`로 넣지 마세요.** 장식은 \`content: ""\`로, 의미는 실제 DOM에.`,
    sub_category: 'CSS 기초',
    difficulty: 'medium',
    tags: ['가상클래스', '가상요소', 'before', 'after', '선택자'],
  },
  {
    id: 'q-181',
    question: '<img> 태그와 CSS background-image 속성은 각각 언제 사용해야 하나요?',
    answer: `**판단 기준은 하나입니다 — 그 이미지가 콘텐츠인가, 장식인가.**

## \`<img>\` — 콘텐츠 이미지

이미지가 사라지면 **정보가 손실되는** 경우.

- 상품 사진, 프로필 사진, 차트, 로고, 본문 삽화
- \`alt\`로 대체 텍스트 제공 → **접근성·SEO**
- 검색 엔진 이미지 색인 대상
- \`srcset\`/\`sizes\`로 반응형, \`loading="lazy"\`로 지연 로딩, \`fetchpriority="high"\`로 우선순위 조절
- \`width\`/\`height\` 명시로 **CLS 방지**
- 우클릭 저장, 이미지 전용 탭 열기 가능

## \`background-image\` — 장식 이미지

이미지가 사라져도 **정보가 온전한** 경우.

- 히어로 배경, 패턴, 그라디언트, 텍스처, 아이콘 스프라이트
- \`background-size: cover/contain\`, \`background-position\`으로 **크롭·정렬 제어가 자유로움**
- \`background-repeat\`로 타일링
- 미디어 쿼리로 브레이크포인트마다 다른 이미지 교체가 쉬움
- **접근성 트리에 노출되지 않음** → 장식용으로는 오히려 올바른 선택

## 비교표

| 항목 | \`<img>\` | \`background-image\` |
| --- | --- | --- |
| 의미 | 콘텐츠 | 장식 |
| 대체 텍스트 | \`alt\` 지원 | 불가 |
| SEO 색인 | ⭕ | ❌ |
| 인쇄 | 기본 출력 | 기본적으로 미출력(브라우저 설정) |
| 크롭·정렬 | \`object-fit\`/\`object-position\` 필요 | \`background-*\`로 내장 |
| 반응형 | \`srcset\`/\`sizes\` | 미디어 쿼리/\`image-set()\` |
| 로딩 우선순위 | 프리로드 스캐너가 조기 발견 → **빠름** | CSSOM 구축 후 발견 → **늦음** |
| 지연 로딩 | \`loading="lazy"\` 네이티브 | 수동 구현 필요 |

## 실무 판단 포인트

**LCP 요소라면 \`<img>\`를 쓰세요.** 브라우저의 프리로드 스캐너는 HTML을 훑으며 \`<img src>\`를 즉시 발견해 다운로드를 시작합니다. 반면 \`background-image\`는 CSS 파싱 → CSSOM 구축 → 해당 요소의 스타일 계산까지 끝나야 발견되므로 로딩이 눈에 띄게 늦습니다. 히어로 배경이 LCP인 사이트에서 흔한 병목입니다.

**두 방식의 장점을 합치려면** \`<img>\` + \`object-fit: cover\`를 쓰면 됩니다. 콘텐츠 이미지의 로딩·접근성 이점을 유지하면서 배경처럼 크롭할 수 있습니다.

\`\`\`css
.hero-img { width: 100%; height: 400px; object-fit: cover; object-position: center; }
\`\`\`

> 콘텐츠지만 alt가 불필요한 순수 장식 \`<img>\`는 \`alt=""\`(빈 문자열)을 주세요. \`alt\` 속성 자체를 생략하면 스크린리더가 파일명을 읽습니다.`,
    sub_category: 'CSS 기초',
    difficulty: 'medium',
    tags: ['img', 'background-image', '접근성', 'LCP', 'object-fit'],
  },
  {
    id: 'q-182',
    question: 'CSS 전처리기란 무엇인가요?',
    answer: `전처리기(Preprocessor)는 **CSS에 없던 문법으로 작성한 뒤 표준 CSS로 컴파일**하는 도구입니다. Sass/SCSS, Less, Stylus가 대표적이며 실무에서는 SCSS가 사실상 표준입니다.

**제공하는 기능**

\`\`\`scss
// 1. 변수
$primary: #3b82f6;

// 2. 중첩 (Nesting)
.card {
  padding: 16px;
  &__title { font-weight: 700; }   // BEM과 궁합
  &:hover { background: #f5f5f5; }
}

// 3. 믹스인 — 인자를 받는 스타일 묶음
@mixin flex-center($dir: row) {
  display: flex; align-items: center; justify-content: center; flex-direction: $dir;
}
.box { @include flex-center(column); }

// 4. 함수·연산
.col { width: math.div(100%, 3); }

// 5. 모듈 분리
@use "variables";
\`\`\`

**후처리기(PostCSS)와의 차이**
- **전처리기** — 비표준 문법 → CSS. *컴파일 전* 단계
- **후처리기(PostCSS)** — 표준 CSS를 입력받아 변환. Autoprefixer(벤더 프리픽스), cssnano(압축), Tailwind가 여기 속함

## 지금도 전처리기가 필요한가 — 실무 판단

**CSS가 흡수한 기능들:**

| 전처리기 기능 | 네이티브 대체 |
| --- | --- |
| 변수 | **CSS Custom Properties** (\`--x\`). 런타임 변경·상속 가능해 오히려 더 강력 |
| 중첩 | **CSS Nesting** (2023년 주요 브라우저 지원) |
| 연산 | \`calc()\`, \`clamp()\`, \`min()\`, \`max()\` |
| 조건 | \`@supports\`, \`@container\` |

**전처리기가 여전히 우위인 것:** 믹스인, 반복문(\`@each\`/\`@for\`), 컴파일 타임 함수, 파일 분할·모듈 시스템.

**결론 — 상황별 선택**
- 새 프로젝트에서 유틸리티 우선(Tailwind)이나 CSS-in-JS를 쓴다면 **전처리기는 불필요**합니다
- 디자인 토큰 기반 시스템이라면 CSS 변수 + PostCSS 조합이 더 적합합니다. 변수를 런타임에 바꿀 수 있어 다크 모드·테마 전환이 훨씬 간단합니다
- 레거시 SCSS 코드베이스거나 복잡한 컴파일 타임 생성(그리드 클래스 자동 생성 등)이 필요하면 SCSS가 유효합니다

> 이 저장소(Danwoo Lab)는 디자인 토큰(TS) → CSS 변수 생성 + Tailwind 방식이라 전처리기를 쓰지 않습니다. 토큰이 source of truth이고 런타임 테마 전환이 필요하기 때문입니다.`,
    sub_category: '방법론',
    difficulty: 'medium',
    tags: ['전처리기', 'Sass', 'SCSS', 'PostCSS', 'CSS 변수'],
  },
  {
    id: 'q-183',
    question: 'display: none, visibility: hidden, opacity: 0의 차이점은 무엇인가요?',
    answer: `셋 다 "안 보이게" 만들지만 **레이아웃·이벤트·접근성에서 전혀 다르게 동작**합니다.

| | \`display: none\` | \`visibility: hidden\` | \`opacity: 0\` |
| --- | --- | --- | --- |
| 공간 차지 | ❌ 레이아웃에서 제거 | ⭕ 공간 유지 | ⭕ 공간 유지 |
| 마우스 이벤트 | ❌ | ❌ | **⭕ 받음** |
| 키보드 포커스 | ❌ | ❌ | **⭕ 잡힘** |
| 스크린리더 | ❌ 읽지 않음 | ❌ 읽지 않음 | **⭕ 읽음** |
| 자식이 되살리기 | ❌ 불가 | ⭕ 자식에 \`visibility: visible\` 가능 | ❌ (누적됨) |
| transition | ❌ 불가(이산값) | ⭕ 가능 | ⭕ 가능 |
| 리렌더 비용 | **Reflow**(레이아웃 재계산) | **Reflow** | **Composite만**(가장 저렴) |

## 각각의 함정

**\`display: none\`**
- 완전히 제거되므로 애니메이션 불가. 페이드아웃 후 사라지게 하려면 \`transition-behavior: allow-discrete\` + \`@starting-style\`(최신) 또는 \`transitionend\` 이벤트에서 전환하는 전통적 방법을 씁니다
- 이미지가 \`display:none\`이어도 **다운로드는 됩니다**(브라우저 구현에 따라 다름). 성능 목적으로 쓸 수 없습니다
- 요소가 사라지므로 \`getBoundingClientRect()\`가 전부 0을 반환합니다

**\`opacity: 0\` — 가장 위험**
투명할 뿐 **여전히 거기 있습니다.** 클릭이 가로채지고, Tab으로 포커스가 들어가 "보이지 않는 곳에 포커스가 갇히는" 접근성 버그가 생깁니다. 숨김 목적이라면 \`pointer-events: none\`과 \`visibility: hidden\`을 함께 걸어야 합니다.

\`\`\`css
/* 페이드 인/아웃 + 접근성·이벤트까지 안전한 조합 */
.modal {
  opacity: 0;
  visibility: hidden;
  transition: opacity .2s ease, visibility 0s .2s;
}
.modal.is-open {
  opacity: 1;
  visibility: visible;
  transition: opacity .2s ease, visibility 0s;
}
\`\`\`

## 그 외 숨김 방법

**\`hidden\` 속성 / \`[hidden]\`** — HTML 네이티브. \`display: none\`과 동등하지만 의미가 명확합니다. 단 CSS \`display\`에 쉽게 덮어써집니다.

**시각적으로만 숨기기 (screen-reader only)** — 스크린리더에는 읽히되 화면에서만 감추는 패턴. 아이콘 버튼의 레이블에 필수입니다.

\`\`\`css
.sr-only {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}
\`\`\`

**\`aria-hidden="true"\`** — 반대 방향. 화면에는 보이되 스크린리더에서만 감춥니다. 장식 아이콘에 사용합니다. **포커스 가능한 요소에 걸면 안 됩니다**(보이는데 안 읽히는 상태가 되어 더 나쁨).

**\`content-visibility: hidden\`** — 렌더링을 건너뛰되 상태를 보존. 긴 목록의 오프스크린 영역 성능 최적화용.

> 면접 포인트: 성능을 물으면 **\`opacity\`/\`transform\`은 컴포지팅 단계만 거치므로 애니메이션에 적합**하고, \`display\`/\`visibility\` 변경은 레이아웃을 다시 계산한다고 답하세요.`,
    sub_category: 'CSS 기초',
    difficulty: 'medium',
    tags: ['display', 'visibility', 'opacity', '접근성', '성능'],
  },
  {
    id: 'q-184',
    question: '요소를 중앙 정렬하는 대표적인 방법은 무엇인가요? (인라인/블록 요소 포함)',
    answer: `대상이 **인라인인지 블록인지**, **수평만인지 수직까지인지**에 따라 방법이 갈립니다.

## 1. 인라인 요소 (텍스트, \`<span>\`, \`<img>\`)

부모에 \`text-align: center\`를 겁니다. 자식이 아니라 **부모에 거는 것**이 포인트입니다.

\`\`\`css
.parent { text-align: center; }   /* 자식 인라인 콘텐츠가 가운데로 */
\`\`\`

수직은 한 줄이면 \`line-height\`를 컨테이너 높이와 같게 주는 방법이 있습니다(단일 행 전용).

## 2. 블록 요소 — 수평만

**너비가 정해진** 블록에 좌우 마진 \`auto\`.

\`\`\`css
.child { width: 600px; margin-inline: auto; }
\`\`\`

너비가 없으면 블록은 부모 폭을 다 채우므로 \`margin: auto\`가 아무 효과가 없습니다. **가장 흔한 실수**입니다.

## 3. Flexbox — 실무 1순위

\`\`\`css
.parent { display: flex; justify-content: center; align-items: center; }
\`\`\`

- 자식 개수·크기 무관
- \`flex-direction\`을 바꿔도 \`justify-content\`(주축) / \`align-items\`(교차축) 관계만 이해하면 그대로 동작
- 자식 하나만 중앙에 두려면 그 자식에 \`margin: auto\` — flex 컨테이너 안에서는 수직으로도 동작합니다

## 4. Grid — 가장 짧음

\`\`\`css
.parent { display: grid; place-items: center; }   /* align-items + justify-items */
\`\`\`

자식이 여럿이면 \`place-content: center\`로 그룹 전체를 중앙에 둡니다.

## 5. absolute + transform — 부모 흐름에서 빼낼 때

\`\`\`css
.parent { position: relative; }
.child  { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); }
\`\`\`

자식 크기를 몰라도 되는 게 장점입니다(\`translate\` %는 **자기 자신 크기 기준**). 모달·오버레이처럼 문서 흐름에서 분리해야 할 때 씁니다.

## 선택 가이드

| 상황 | 방법 |
| --- | --- |
| 텍스트·인라인 수평 | \`text-align: center\` |
| 고정폭 블록 수평 | \`margin-inline: auto\` |
| 일반적인 수평+수직 | **Flexbox** |
| 한 줄로 끝내고 싶을 때 | \`display: grid; place-items: center\` |
| 흐름에서 뺀 오버레이 | \`absolute + translate(-50%,-50%)\` |
| 테이블 셀 내부 | \`vertical-align: middle\` |

> 논리적 속성을 쓰면 RTL 언어까지 대응됩니다: \`margin: 0 auto\` → \`margin-inline: auto\`.`,
    sub_category: '레이아웃',
    difficulty: 'easy',
    tags: ['중앙정렬', 'flexbox', 'grid', 'margin auto', 'transform'],
  },
  {
    id: 'q-185',
    question: 'vertical-align은 왜 수직 정렬이 잘 안 될까요?',
    answer: `**대부분의 사람이 기대하는 것과 실제 동작이 다르기 때문입니다.** \`vertical-align\`은 "블록 안에서 요소를 수직 중앙에 놓는" 속성이 **아닙니다**.

## 실제 적용 대상은 딱 두 가지

1. **인라인 레벨 요소** (\`inline\`, \`inline-block\`, \`inline-flex\`, 텍스트, 이미지) — **같은 줄 상자(line box) 안에서 형제들끼리의 상대적 정렬**
2. **테이블 셀** (\`display: table-cell\`, \`<td>\`) — 셀 박스 안에서 콘텐츠의 수직 정렬

블록 레벨 요소(\`display: block\`)에 걸면 **아무 일도 일어나지 않습니다.**

\`\`\`css
.box { height: 200px; }
.box > div { vertical-align: middle; }  /* ❌ 무시됨 — 자식이 블록 */
\`\`\`

## \`middle\`의 의미도 다릅니다

\`vertical-align: middle\`은 "줄의 정중앙"이 아니라 **"부모의 베이스라인 + 소문자 x 높이의 절반"** 위치에 요소의 수직 중앙을 맞춥니다. 폰트의 x-height에 의존하므로 폰트가 바뀌면 위치도 미묘하게 달라집니다. 딱 떨어지는 중앙이 나오지 않는 이유입니다.

## 이미지 아래 빈 공간 — 같은 원인의 고전 버그

\`\`\`html
<div style="border:1px solid red"><img src="a.png"></div>
<!-- 이미지 아래 4~5px 틈이 생김 -->
\`\`\`

\`<img>\`는 인라인 요소라 기본값 \`vertical-align: baseline\`으로 베이스라인에 앉습니다. 베이스라인 **아래에는 descender(g, y의 꼬리) 공간**이 예약되어 있어 그만큼 틈이 남습니다.

해결:
\`\`\`css
img { vertical-align: bottom; }  /* 또는 middle, top */
img { display: block; }          /* 인라인에서 빼버리기 */
\`\`\`

## 그래서 뭘 써야 하나

| 목적 | 올바른 방법 |
| --- | --- |
| 컨테이너 안 콘텐츠 수직 중앙 | \`display: flex; align-items: center\` |
| 한 줄로 | \`display: grid; place-items: center\` |
| 텍스트 한 줄만 | \`line-height\` = 컨테이너 높이 |
| 테이블 셀 | \`vertical-align: middle\` ← 여기서는 정상 동작 |
| 아이콘과 텍스트 나란히 정렬 | \`vertical-align: middle\` 또는 flex |

**\`vertical-align\`이 여전히 유용한 곳**은 인라인 컨텍스트입니다 — 텍스트 옆 아이콘 높이 맞추기, 위/아래 첨자(\`super\`/\`sub\`), 테이블 셀 정렬.

> 요약 답변: "\`vertical-align\`은 인라인 요소와 테이블 셀에만 적용되는 속성이고, 블록 요소의 수직 정렬용이 아닙니다. 블록 중앙 정렬은 Flexbox나 Grid를 씁니다."`,
    sub_category: 'CSS 기초',
    difficulty: 'medium',
    tags: ['vertical-align', '베이스라인', '인라인', '수직정렬'],
  },
  {
    id: 'q-186',
    question: 'BEM은 무엇이며, 사용하는 이유를 설명할 수 있나요?',
    answer: `BEM(**B**lock **E**lement **M**odifier)은 CSS 클래스 네이밍 방법론입니다. 전역 네임스페이스인 CSS에서 **이름 충돌과 명시도 전쟁을 규칙으로 해결**하려는 시도입니다.

## 구조

\`\`\`
.block {}                 /* 독립적으로 의미를 갖는 컴포넌트 */
.block__element {}        /* 블록에 종속된 구성 요소 (언더스코어 2개) */
.block--modifier {}       /* 블록/요소의 변형 상태 (하이픈 2개) */
\`\`\`

\`\`\`html
<div class="card card--featured">
  <img class="card__thumbnail" src="...">
  <h3 class="card__title">제목</h3>
  <button class="card__button card__button--disabled">담기</button>
</div>
\`\`\`

\`\`\`css
.card { }
.card--featured { }
.card__title { }
.card__button--disabled { }
\`\`\`

## 해결하는 문제

**1. 명시도 전쟁 종식**
모든 선택자가 **클래스 하나(0,1,0)**로 평평해집니다. \`.header .nav ul li a\` 같은 중첩 선택자가 사라지므로 \`!important\`가 필요 없어집니다.

**2. 이름 충돌 방지**
\`.title\`은 어디서나 충돌하지만 \`.card__title\`은 카드 안에서만 의미를 가집니다.

**3. 마크업만 봐도 구조가 읽힘**
클래스명만 보고 어느 컴포넌트 소속인지, 어떤 상태인지 알 수 있습니다.

**4. DOM 구조와 CSS의 결합 제거**
\`.card > div > p\`는 마크업을 바꾸면 깨지지만 \`.card__desc\`는 어디로 옮겨도 유지됩니다.

## 규칙과 주의점

- **Element의 Element는 만들지 않습니다.** \`.card__body__title\`(❌) → \`.card__title\`(⭕). 중첩 깊이를 클래스명에 반영하면 이름이 폭발합니다
- **Modifier는 단독으로 쓰지 않습니다.** \`class="card--featured"\`만 있으면 안 되고 \`class="card card--featured"\`처럼 기본 클래스와 함께 씁니다
- **Block은 다른 Block을 품을 수 있습니다.** 카드 안의 버튼이 독립 컴포넌트라면 \`.card__button\`이 아니라 \`.button\` Block으로 두고 위치만 \`.card__action\`이 잡습니다

## 단점

- 클래스명이 길고 HTML이 장황해집니다
- \`.block__element--modifier\` 조합이 늘면 관리 비용이 커집니다
- **컴파일 타임 보장이 없습니다** — 오타를 잡아주는 것은 사람뿐

## 오늘날의 대안

| 방식 | 격리 방법 |
| --- | --- |
| **BEM** | 사람이 지키는 네이밍 규칙 |
| **CSS Modules** | 빌드 시 해시 클래스명 자동 생성 → 충돌 원천 차단 |
| **CSS-in-JS** | 런타임/컴파일 타임 스코핑 |
| **Tailwind (Utility-first)** | 클래스 명명 자체를 없앰 |
| **Shadow DOM** | 브라우저 수준 스타일 격리 |

**결론:** 도구가 격리를 보장하는 환경(CSS Modules, Tailwind)에서는 BEM의 핵심 목적이 이미 달성됩니다. 다만 **BEM이 강제하는 "컴포넌트 단위 사고"와 "평평한 명시도"는 여전히 유효한 원칙**이며, SCSS의 \`&__\` 문법과 궁합이 좋아 레거시·디자인 시스템에서 자주 만납니다.

> 면접에서 "BEM을 쓰나요?"에 "안 씁니다"라고만 답하지 말고, **무엇으로 같은 문제를 해결하는지**(CSS Modules/Tailwind)를 함께 말하세요.`,
    sub_category: '방법론',
    difficulty: 'medium',
    tags: ['BEM', '네이밍', '명시도', 'CSS Modules'],
  },
  {
    id: 'q-187',
    question: '@supports 규칙은 언제 사용하나요?',
    answer: `\`@supports\`(Feature Query)는 **브라우저가 특정 CSS 속성·값을 지원하는지 CSS 안에서 직접 검사**하는 조건부 규칙입니다. JS 없이 점진적 향상(progressive enhancement)을 구현합니다.

\`\`\`css
/* 폴백을 먼저, 향상을 나중에 */
.layout { display: flex; flex-wrap: wrap; }

@supports (display: grid) {
  .layout { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
}
\`\`\`

## 문법

\`\`\`css
@supports (property: value) { }                       /* 지원하면 */
@supports not (property: value) { }                   /* 미지원이면 */
@supports (a: b) and (c: d) { }                       /* 둘 다 */
@supports (a: b) or (c: d) { }                        /* 하나라도 */
@supports selector(:has(a)) { }                       /* 선택자 지원 검사 */
@supports font-format(woff2) { }                      /* 폰트 포맷 */
@supports (backdrop-filter: blur(8px)) or (-webkit-backdrop-filter: blur(8px)) { }
\`\`\`

**괄호는 필수**입니다. \`@supports display: grid\`는 동작하지 않습니다.

## 언제 쓰는가

**1. 폴백과 향상이 서로 충돌할 때**
CSS는 원래 "모르는 선언은 무시"하므로 대부분의 폴백은 순서만으로 해결됩니다.

\`\`\`css
.box { background: #333; background: color-mix(in srgb, blue 50%, white); }
/* 미지원 브라우저는 두 번째 줄을 버리고 첫 줄 사용 — @supports 불필요 */
\`\`\`

**\`@supports\`가 필요한 경우는 "속성 하나가 아니라 레이아웃 전략 전체가 달라질 때"**입니다. Grid를 쓰면 자식 마진이 필요 없지만 Flex 폴백에서는 필요한 경우처럼, 여러 선언 묶음이 함께 바뀌어야 할 때입니다.

**2. 선택자 지원 검사**
\`:has()\`처럼 선택자 자체를 모르면 그 규칙 블록이 통째로 무시되는데, 이때 반대 스타일이 남아 깨지는 것을 막습니다.

\`\`\`css
.menu { padding-left: 0; }
@supports selector(:has(*)) {
  .menu:has(.submenu) { padding-left: 16px; }
}
\`\`\`

**3. 벤더 프리픽스 분기** — \`backdrop-filter\`처럼 Safari만 프리픽스가 필요한 경우.

## 주의점

- **\`@supports\`를 지원하지 않는 브라우저는 블록 전체를 무시합니다.** 그래서 **폴백을 밖에, 향상을 \`@supports\` 안에** 두는 순서가 중요합니다. 반대로 하면 구형 브라우저에 아무것도 남지 않습니다
- 문법 파싱만 검사하고 **실제 동작 품질은 보장하지 않습니다.** 속성을 인식하지만 버그가 있는 브라우저는 걸러내지 못합니다
- 오늘날 주요 브라우저의 CSS 지원 격차가 크게 줄어 사용 빈도는 낮아졌습니다. 대신 **신규 기능(\`@container\`, \`:has()\`, \`color-mix()\`, \`anchor-name\`) 도입 시점**에 여전히 유용합니다

**JS 대응**: \`CSS.supports('display', 'grid')\`로 같은 검사를 할 수 있습니다.

> 관련: \`@media\`는 환경(뷰포트·기기)을 묻고, \`@supports\`는 **브라우저 능력**을 묻고, \`@container\`는 부모 컨테이너 크기를 묻습니다.`,
    sub_category: '모던 CSS',
    difficulty: 'medium',
    tags: ['@supports', 'Feature Query', '점진적 향상', '폴백'],
  },
  {
    id: 'q-188',
    question: ':is()와 :where() 가상 클래스 선택자의 차이점은 무엇인가요?',
    answer: `둘 다 **선택자 목록을 받아 반복을 줄이는** 가상 클래스이고, 동작하는 매칭 결과는 완전히 같습니다. **차이는 명시도(specificity) 단 하나**입니다.

| | \`:is()\` | \`:where()\` |
| --- | --- | --- |
| 명시도 | **인자 중 가장 높은 것**을 채택 | **항상 0** |
| 용도 | 일반적인 선택자 그룹화 | 재정의되어야 할 기본 스타일 |

## 예시로 보는 차이

\`\`\`css
/* 인자에 #id가 섞이면 :is()는 그 명시도를 물려받음 */
:is(#main, .content) p { color: red; }    /* 명시도 (1,0,1) — ID 수준 */
:where(#main, .content) p { color: blue; }/* 명시도 (0,0,1) — 요소 하나 수준 */

.content p { color: green; }              /* 명시도 (0,1,1) */
\`\`\`

\`#main\` 안의 \`p\`는 → \`:is()\` 규칙이 이겨 **빨강**. \`:where()\` 규칙은 \`.content p\`에게 져서 파랑도 못 됩니다.

## 반복 제거 효과

\`\`\`css
/* Before */
header h1, header h2, header h3,
main h1, main h2, main h3 { margin-block: 0; }

/* After */
:is(header, main) :is(h1, h2, h3) { margin-block: 0; }
\`\`\`

## 관용 선택자 목록(forgiving selector list)

일반 선택자 목록은 **하나라도 파싱 실패하면 전체가 무효**가 됩니다.

\`\`\`css
h1, h2, :unknown-thing { color: red; }   /* ❌ 전부 무시됨 */
:is(h1, h2, :unknown-thing) { color: red; } /* ⭕ h1, h2는 적용됨 */
\`\`\`

브라우저 지원이 갈리는 신규 선택자를 섞을 때 안전합니다.

## \`:where()\`의 실전 용도 — 라이브러리·리셋 스타일

\`\`\`css
/* 사용자가 클래스 하나로 손쉽게 덮어쓸 수 있음 */
:where(.btn) { padding: 8px 16px; border-radius: 6px; background: #eee; }

.btn-primary { background: blue; }   /* 명시도 (0,1,0) > (0,0,0) → 이김 */
\`\`\`

기본 스타일을 \`:where()\`로 감싸면 **명시도 0이 되어 어떤 클래스로든 재정의 가능**합니다. 디자인 시스템·CSS 리셋에서 \`!important\` 남발을 없애는 정석 패턴입니다.

## 주의점

- **\`:where()\`는 인자가 아니라 규칙 전체의 명시도에 영향을 줍니다.** \`:where(.a) .b\`의 명시도는 \`(0,1,0)\` — \`.b\`의 명시도는 그대로 남습니다
- 둘 다 **의사 요소(\`::before\` 등)는 인자로 넣을 수 없습니다**
- \`:has()\`와 조합하면 강력하지만 성능을 고려하세요. \`:has()\`는 서브트리 전체를 검사하므로 넓은 범위에 남발하면 스타일 재계산 비용이 커집니다

**\`:not()\`과의 관계** — \`:not()\`도 인자 중 최고 명시도를 채택합니다(\`:is()\`와 동일). 명시도를 0으로 만들고 싶으면 \`:not(:where(.x))\` 트릭을 씁니다.`,
    sub_category: '모던 CSS',
    difficulty: 'medium',
    tags: [':is', ':where', '명시도', '선택자'],
  },
];

// ============================================================
// cat-3 JavaScript
// ============================================================

const JS = [
  {
    id: 'q-189',
    question: '자바스크립트란 무엇인가요?',
    answer: `JavaScript는 **싱글 스레드 · 인터프리터(JIT) · 동적 타입 · 프로토타입 기반**의 멀티 패러다임 프로그래밍 언어입니다. 1995년 브렌던 아이크가 넷스케이프에서 10일 만에 초안을 만들었고, 지금은 ECMAScript 표준(TC39)을 따릅니다.

## 핵심 특성

| 특성 | 의미 |
| --- | --- |
| **싱글 스레드** | 콜 스택이 하나. 동시에 한 작업만 실행 |
| **비동기 · 논블로킹** | 이벤트 루프 + 태스크 큐로 I/O를 기다리지 않음 |
| **동적 타입** | 변수 타입이 런타임에 결정, 재할당 시 변경 가능 |
| **프로토타입 기반** | 클래스가 아니라 객체가 다른 객체를 상속. \`class\`는 문법 설탕 |
| **일급 함수** | 함수를 값처럼 전달·반환·저장 가능 → 클로저, 고차 함수 |
| **멀티 패러다임** | 명령형 · 함수형 · 객체지향 모두 가능 |

## 이름의 오해

Java와는 **아무 관계가 없습니다.** 당시 Java의 인기에 편승한 마케팅 작명이었습니다. 문법적으로 C 계열이라는 점만 공유합니다.

## JavaScript ≠ ECMAScript ≠ 런타임

- **ECMAScript** — 언어 사양(문법, 타입, 내장 객체). ES2015(ES6) 이후 매년 갱신
- **JavaScript** — ECMAScript를 구현한 언어
- **런타임** — 실행 환경. 브라우저(V8/SpiderMonkey + DOM·BOM API), Node.js(V8 + fs·http API), Deno, Bun

\`setTimeout\`, \`fetch\`, \`document\`는 **ECMAScript 스펙이 아니라 런타임이 제공하는 API**입니다. Node에 \`document\`가 없는 이유입니다.

## 엔진 동작 개요

\`\`\`
소스 → 파싱(AST) → 인터프리터가 바이트코드로 즉시 실행
                 ↘ 자주 실행되는 코드는 JIT 컴파일러가 기계어로 최적화
\`\`\`

V8은 Ignition(인터프리터)과 TurboFan(최적화 컴파일러)을 함께 씁니다. "인터프리터 언어"라고만 답하면 절반만 맞습니다 — **JIT 컴파일이 들어간 하이브리드**입니다.

## 실행 모델 한 문장

싱글 스레드 콜 스택 위에서 동기 코드를 실행하고, 비동기 작업은 런타임(Web API/libuv)에 위임한 뒤 완료된 콜백을 **이벤트 루프**가 큐에서 꺼내 스택이 빌 때 밀어 넣습니다. 마이크로태스크(Promise)가 매크로태스크(\`setTimeout\`)보다 먼저 처리됩니다.`,
    sub_category: '기초',
    difficulty: 'easy',
    tags: ['JavaScript', 'ECMAScript', '싱글스레드', 'V8', 'JIT'],
  },
  {
    id: 'q-190',
    question: '자바스크립트는 어떤 데이터 타입을 가지고 있나요?',
    answer: `크게 **원시 타입(primitive) 7가지**와 **참조 타입(object)**으로 나뉩니다.

## 원시 타입 7가지

| 타입 | 설명 | \`typeof\` |
| --- | --- | --- |
| \`number\` | 64비트 부동소수점 **하나뿐**. 정수 타입이 없음 | \`"number"\` |
| \`string\` | UTF-16 문자열. 불변 | \`"string"\` |
| \`boolean\` | \`true\` / \`false\` | \`"boolean"\` |
| \`undefined\` | 값이 할당되지 않음 | \`"undefined"\` |
| \`null\` | 의도적인 "값 없음" | **\`"object"\`** ⚠️ |
| \`symbol\` | ES6. 유일한 식별자 | \`"symbol"\` |
| \`bigint\` | ES2020. 임의 정밀도 정수 (\`10n\`) | \`"bigint"\` |

**\`typeof null === "object"\`는 JS 초기 구현의 버그**입니다. 하위 호환 때문에 고치지 못하고 남았습니다. null 판별은 \`value === null\`로 하세요.

## 참조 타입

\`Object\`, \`Array\`, \`Function\`, \`Date\`, \`RegExp\`, \`Map\`, \`Set\`, \`WeakMap\`, \`Promise\` 등 — 모두 \`object\`의 하위입니다.

\`\`\`js
typeof []        // "object"  — 배열 판별은 Array.isArray()
typeof function(){} // "function" — 예외적으로 function
\`\`\`

## 원시 vs 참조 — 면접 핵심

| | 원시 | 참조 |
| --- | --- | --- |
| 저장 | 값 자체 | 힙의 **주소** |
| 복사 | 값 복사 (독립) | 주소 복사 (**공유**) |
| 비교 | 값 비교 | 참조(주소) 비교 |
| 불변성 | 불변 | 가변 |

\`\`\`js
let a = 1; let b = a; b = 2;        // a는 1 (독립)
let x = {n:1}; let y = x; y.n = 2;  // x.n도 2 (공유)
{a:1} === {a:1}                      // false — 주소가 다름
\`\`\`

## \`number\`의 함정

\`\`\`js
0.1 + 0.2 === 0.3        // false — IEEE 754 부동소수점 오차
0.1 + 0.2                // 0.30000000000000004
Number.MAX_SAFE_INTEGER  // 9007199254740991 (2^53-1) 초과 시 정밀도 손실
\`\`\`

금액 계산은 정수 단위(원)로 다루거나 \`BigInt\`/decimal 라이브러리를 씁니다.

## 래퍼 객체(Boxing)

원시값은 메서드가 없는데도 \`"abc".toUpperCase()\`가 동작합니다. 엔진이 접근 순간 임시로 \`String\` 래퍼 객체를 만들고 즉시 버리기 때문입니다. \`new String("a")\`처럼 명시적으로 만들면 \`typeof\`가 \`"object"\`가 되므로 **절대 쓰지 마세요**.

## 타입 판별 정리

\`\`\`js
typeof v === 'string'                                 // 원시 판별
Array.isArray(v)                                      // 배열
v === null                                            // null
Object.prototype.toString.call(v)                     // "[object Date]" — 가장 정확
Number.isNaN(v)                                       // NaN (전역 isNaN은 형변환하므로 위험)
\`\`\`

## Falsy 8가지

\`false\`, \`0\`, \`-0\`, \`0n\`, \`""\`, \`null\`, \`undefined\`, \`NaN\`. **나머지는 전부 truthy**이며 특히 \`[]\`, \`{}\`, \`"0"\`, \`"false"\`는 truthy입니다.`,
    sub_category: '타입',
    difficulty: 'easy',
    tags: ['데이터타입', '원시타입', 'typeof', 'falsy', 'NaN'],
  },
  {
    id: 'q-191',
    question: '자바스크립트에서 객체란 무엇인가요?',
    answer: `객체는 **키(문자열 또는 Symbol)와 값의 쌍(property)을 담는 컬렉션**이며, JavaScript에서 원시 타입이 아닌 모든 것이 객체입니다. 배열, 함수, 날짜, 정규식 모두 객체입니다.

## 생성 방법

\`\`\`js
const a = { name: '단우' };              // 객체 리터럴 (기본)
const b = Object.create(protoObj);        // 프로토타입 지정
const c = new Person('단우');             // 생성자 함수/클래스
\`\`\`

## 프로퍼티 접근

\`\`\`js
obj.name          // 점 표기 — 식별자 규칙을 따르는 키만
obj['first-name'] // 대괄호 — 동적 키, 특수문자 키
obj?.a?.b         // 옵셔널 체이닝 (ES2020)
\`\`\`

## 키의 타입 — 흔한 함정

객체 키는 **문자열 또는 Symbol만** 가능합니다. 다른 값을 넣으면 문자열로 강제 변환됩니다.

\`\`\`js
const o = {};
o[1] = 'a'; o['1'] = 'b';
o                     // { '1': 'b' } — 같은 키로 덮어씀
o[{x:1}] = 'c';       // 키가 "[object Object]"가 됨
\`\`\`

키를 임의 타입으로 쓰려면 **\`Map\`**을 사용하세요. \`Map\`은 객체·함수도 키로 쓸 수 있고, 삽입 순서를 보장하며, \`size\`가 있고, 프로토타입 오염 위험이 없습니다.

## 프로퍼티 어트리뷰트

각 프로퍼티는 값 외에 메타데이터를 가집니다.

\`\`\`js
Object.defineProperty(obj, 'id', {
  value: 1,
  writable: false,     // 값 변경 불가
  enumerable: false,   // for...in / Object.keys에서 제외
  configurable: false, // 삭제·재정의 불가
});
Object.getOwnPropertyDescriptor(obj, 'id');
\`\`\`

리터럴로 만든 프로퍼티는 세 가지 모두 \`true\`입니다.

## 순회 방법

| 방법 | 대상 | 프로토타입 체인 |
| --- | --- | --- |
| \`for...in\` | enumerable 문자열 키 | **포함** ⚠️ |
| \`Object.keys/values/entries\` | 자신의 enumerable 문자열 키 | 제외 |
| \`Object.getOwnPropertyNames\` | 자신의 모든 문자열 키 | 제외 |
| \`Reflect.ownKeys\` | 자신의 모든 키 (Symbol 포함) | 제외 |

\`for...in\`이 상속 프로퍼티까지 읽는 것이 버그의 원천이라, 실무에서는 \`Object.entries\`를 씁니다.

**키 순회 순서**: 정수 형태 키가 오름차순으로 먼저, 그다음 문자열 키가 삽입 순서로, 마지막에 Symbol 키입니다.

## 불변화 3단계

\`\`\`js
Object.preventExtensions(o); // 추가 금지
Object.seal(o);              // + 삭제 금지
Object.freeze(o);            // + 수정 금지 (얕은 동결)
\`\`\`

\`freeze\`는 **1단계만** 얼립니다. 중첩 객체까지 얼리려면 재귀적으로 순회해야 합니다.

## 복사

\`\`\`js
const shallow = { ...obj };              // 얕은 복사 (1단계)
const deep = structuredClone(obj);       // 깊은 복사 (네이티브, 순환참조 OK)
\`\`\`

\`JSON.parse(JSON.stringify(obj))\`는 \`undefined\`·함수·\`Date\`·\`Map\`·순환참조를 잃습니다. \`structuredClone\`을 쓰세요(함수는 여전히 복사 불가).

## 프로토타입

모든 객체는 \`[[Prototype]]\` 내부 슬롯으로 다른 객체를 참조합니다. 프로퍼티를 찾을 때 자신에게 없으면 이 체인을 따라 올라갑니다. 이것이 JS의 상속 메커니즘이며, \`class\` 문법은 이를 감싼 설탕입니다.

> 딕셔너리 용도로 순수한 객체가 필요하면 \`Object.create(null)\`을 쓰세요. 프로토타입이 없어 \`__proto__\`, \`constructor\` 같은 키 충돌과 프로토타입 오염 공격을 피할 수 있습니다.`,
    sub_category: '객체',
    difficulty: 'medium',
    tags: ['객체', '프로퍼티', 'Map', 'freeze', '프로토타입'],
  },
  {
    id: 'q-192',
    question: '호이스팅이란 무엇인가요?',
    answer: `호이스팅(Hoisting)은 **변수·함수 선언이 코드 실행 전에 스코프 최상단으로 끌어올려진 것처럼 동작하는 현상**입니다.

**실제로 코드가 이동하지는 않습니다.** 자바스크립트 엔진이 실행 컨텍스트를 생성하는 **평가 단계**에서 스코프 내 모든 선언을 먼저 스캔해 렉시컬 환경에 등록하기 때문에 그렇게 보이는 것입니다.

## 선언 방식별 동작

\`\`\`js
console.log(a);  // undefined  ← 선언은 끌어올려지고 undefined로 초기화
var a = 1;

console.log(b);  // ❌ ReferenceError: Cannot access 'b' before initialization
let b = 1;

foo();           // ⭕ "hi" — 함수 선언문은 전체가 호이스팅
function foo() { console.log('hi'); }

bar();           // ❌ TypeError: bar is not a function
var bar = function () {};  // var 규칙을 따름 → undefined에 호출
\`\`\`

| 선언 | 호이스팅 | 초기화 시점 | 접근 시 |
| --- | --- | --- | --- |
| \`var\` | ⭕ | 선언 시 즉시 \`undefined\` | \`undefined\` |
| \`let\`/\`const\` | **⭕ (된다)** | 실제 선언문 도달 시 | **TDZ → ReferenceError** |
| \`function\` 선언문 | ⭕ | 함수 객체까지 완성 | 호출 가능 |
| \`class\` | ⭕ | 실제 선언문 도달 시 | **TDZ → ReferenceError** |

## TDZ(Temporal Dead Zone) — 오해 정정

**"\`let\`/\`const\`는 호이스팅되지 않는다"는 흔한 오답입니다.** 호이스팅은 됩니다. 다만 스코프 시작부터 실제 선언문까지 구간에서 **초기화되지 않은 상태로 접근이 금지**되며, 이 구간을 TDZ라 부릅니다.

증거:
\`\`\`js
let x = 'outer';
{
  console.log(x);  // ReferenceError — 호이스팅이 안 됐다면 'outer'가 출력됐어야 함
  let x = 'inner';
}
\`\`\`

## 함수 선언문 vs 함수 표현식

\`\`\`js
// 선언문 — 전체 호이스팅. 조건문 안에 두면 브라우저별 동작이 달라 위험
function a() {}
// 표현식 — 변수 규칙을 따름. 정의 위에서 호출 불가 → 흐름이 명확
const b = function () {};
const c = () => {};
\`\`\`

## 실무 결론

- **\`var\`를 쓰지 않으면 호이스팅 문제의 대부분이 사라집니다.** \`const\` 기본, 재할당이 필요할 때만 \`let\`
- \`let\`/\`const\`의 TDZ는 "선언 전 사용"을 **에러로 잡아주는 안전장치**입니다. 버그가 아니라 기능입니다
- ESLint \`no-use-before-define\` 규칙으로 강제할 수 있습니다

> 면접 답변 요약: "선언이 실행 전 스코프에 등록되는 현상입니다. \`var\`는 \`undefined\`로 초기화까지 되지만 \`let\`/\`const\`는 등록만 되고 초기화가 안 돼 TDZ에 놓입니다. 즉 셋 다 호이스팅은 되고, 초기화 시점이 다릅니다."`,
    sub_category: '스코프/클로저',
    difficulty: 'medium',
    tags: ['호이스팅', 'TDZ', 'var', 'let', 'const'],
  },
  {
    id: 'q-193',
    question: '동등 연산자(==)와 일치 연산자(===)의 차이점은 무엇인가요?',
    answer: `- **\`===\` (일치, strict equality)** — 타입과 값을 **둘 다** 비교. 타입이 다르면 즉시 \`false\`
- **\`==\` (동등, loose equality)** — 타입이 다르면 **암묵적 형변환 후** 비교

\`\`\`js
1 === '1'   // false
1 ==  '1'   // true  — '1'이 1로 변환됨
\`\`\`

## \`==\`의 형변환 규칙 (요약)

1. 타입이 같으면 \`===\`와 동일
2. \`null == undefined\` → **true** (서로에게만, 다른 값과는 false)
3. number vs string → 문자열을 숫자로
4. boolean이 있으면 → boolean을 숫자로 (\`true\`→1, \`false\`→0)
5. object vs primitive → 객체를 \`ToPrimitive\`로 변환(\`valueOf\` → \`toString\`)

## 악명 높은 결과들

\`\`\`js
0 == ''            // true   ('' → 0)
0 == '0'           // true
'' == '0'          // false  (둘 다 문자열이라 형변환 없음) ← 추이성 붕괴
0 == false         // true
null == 0          // false  (null은 undefined하고만 같음)
null == undefined  // true
NaN == NaN         // false  (NaN은 자기 자신과도 다름)
[] == false        // true   ([] → '' → 0)
[] == ![]          // true   (![]는 false → 0, []는 0)
'0' == false       // true
\`\`\`

\`0 == ''\`와 \`0 == '0'\`은 참인데 \`'' == '0'\`은 거짓 — **동치 관계의 추이성이 깨집니다.** \`==\`를 쓰지 말아야 할 결정적 이유입니다.

## 실무 규칙

**항상 \`===\`를 쓰세요.** ESLint \`eqeqeq\` 규칙으로 강제하는 것이 표준입니다.

**유일한 예외 — \`== null\`**

\`\`\`js
if (value == null) { }   // null 또는 undefined 둘 다 체크
// 위와 동등:
if (value === null || value === undefined) { }
\`\`\`

ESLint의 \`eqeqeq: ['error', 'always', { null: 'ignore' }]\` 설정이 이 관용구를 허용합니다. 다만 요즘은 \`??\`와 옵셔널 체이닝으로 대체되는 경우가 많습니다.

## \`Object.is()\` — 세 번째 비교

\`===\`의 두 가지 예외를 바로잡은 버전입니다.

| 비교 | \`===\` | \`Object.is\` |
| --- | --- | --- |
| \`NaN, NaN\` | false | **true** |
| \`+0, -0\` | true | **false** |

React의 리렌더 판단(\`Object.is\` 기반)이 이것을 씁니다. \`useState\`에 \`NaN\`을 같은 값으로 다시 넣어도 리렌더가 안 되는 이유입니다.

## 참조 타입 비교

\`===\`도 객체는 **주소**를 비교합니다.

\`\`\`js
{a:1} === {a:1}   // false
[1,2] === [1,2]   // false
\`\`\`

값 비교가 필요하면 깊은 비교 함수(lodash \`isEqual\`)나 직렬화 비교를 써야 합니다. React의 의존성 배열이 얕은 비교(\`Object.is\`)를 쓰기 때문에 매 렌더마다 새로 만든 객체·배열이 항상 "변경됨"으로 판단되는 것도 같은 이유입니다.`,
    sub_category: '타입',
    difficulty: 'easy',
    tags: ['==', '===', '형변환', 'Object.is', 'NaN'],
  },
  {
    id: 'q-194',
    question: '스코프 체인이란 무엇인가요?',
    answer: `스코프 체인(Scope Chain)은 **식별자를 찾을 때 현재 스코프에서 시작해 상위 스코프로 거슬러 올라가는 단방향 연결 구조**입니다.

## 스코프의 종류

\`\`\`js
const global = 'G';                  // 전역 스코프

function outer() {
  const fn = 'F';                    // 함수 스코프
  if (true) {
    let block = 'B';                 // 블록 스코프 (let/const/class)
    var hoisted = 'V';               // ⚠️ var는 블록을 무시 → 함수 스코프
  }
  console.log(block);                // ReferenceError
  console.log(hoisted);              // 'V'
}
\`\`\`

- **함수 스코프** — \`var\`, 함수 선언
- **블록 스코프** — \`let\`, \`const\`, \`class\`, 함수 선언(strict mode)
- **모듈 스코프** — ESM 파일 최상위. 전역이 아님

## 렉시컬 스코프 — 핵심 개념

JavaScript는 **렉시컬(정적) 스코프**입니다. 스코프는 **함수가 어디서 호출됐는지가 아니라, 어디에 작성됐는지**로 결정됩니다.

\`\`\`js
const x = 'outer';

function foo() { console.log(x); }   // foo가 선언된 위치 기준
function bar() {
  const x = 'inner';
  foo();                              // 'outer' 출력 — 'inner'가 아님
}
bar();
\`\`\`

호출 위치를 따르는 것을 동적 스코프라 하는데, JS에서 동적으로 결정되는 것은 **\`this\`뿐**입니다. 이 대비가 면접 단골입니다.

## 탐색 규칙

1. 현재 스코프의 렉시컬 환경에서 찾음
2. 없으면 **외부 렉시컬 환경 참조**(\`[[OuterEnv]]\`)를 따라 한 단계 위로
3. 전역까지 가서도 없으면 → \`ReferenceError\`
4. **단방향**입니다. 상위에서 하위 스코프의 변수는 볼 수 없습니다

## 섀도잉(Shadowing)

안쪽 스코프가 같은 이름을 선언하면 바깥 것을 가립니다.

\`\`\`js
let v = 1;
{ let v = 2; console.log(v); }  // 2
console.log(v);                  // 1
\`\`\`

## 스코프 체인 = 클로저의 기반

함수는 생성될 때 **자신이 정의된 렉시컬 환경에 대한 참조**(\`[[Environment]]\`)를 내부 슬롯에 저장합니다. 외부 함수가 종료돼도 이 참조가 살아 있으면 해당 환경은 GC되지 않습니다 — **이것이 클로저**입니다.

\`\`\`js
function counter() {
  let count = 0;                 // outer 실행 종료 후에도 살아남음
  return () => ++count;
}
const inc = counter();
inc(); inc();                    // 2
\`\`\`

## 실무 관점

- **깊은 스코프 체인은 탐색 비용**입니다. 반복문 안에서 전역 변수를 계속 참조하면 매번 체인을 끝까지 탑니다. 지역 변수로 캐싱하면 유리합니다(다만 현대 엔진의 최적화로 체감 차이는 대개 미미합니다)
- **전역 오염**은 스코프 체인 최상단을 더럽히는 행위입니다. 모듈 스코프(ESM)와 IIFE가 이를 막습니다
- \`var\`가 블록을 무시하는 성질 때문에 \`for (var i...)\` + 비동기 콜백 조합에서 고전적 버그가 납니다. \`let\`은 **반복마다 새 바인딩**을 만들어 해결합니다

\`\`\`js
for (var i = 0; i < 3; i++) setTimeout(() => console.log(i));  // 3 3 3
for (let i = 0; i < 3; i++) setTimeout(() => console.log(i));  // 0 1 2
\`\`\``,
    sub_category: '스코프/클로저',
    difficulty: 'medium',
    tags: ['스코프체인', '렉시컬 스코프', '클로저', '섀도잉'],
  },
  {
    id: 'q-195',
    question: '실행 컨텍스트를 들어 본 적 있나요?',
    answer: `실행 컨텍스트(Execution Context)는 **JavaScript 코드가 실행되기 위해 필요한 환경 정보를 담은 객체**입니다. 호이스팅·스코프·클로저·\`this\`가 왜 그렇게 동작하는지를 하나로 설명하는 개념입니다.

## 종류 3가지

1. **전역 실행 컨텍스트(GEC)** — 프로그램 시작 시 1개 생성
2. **함수 실행 컨텍스트(FEC)** — 함수가 **호출될 때마다** 생성
3. **eval 실행 컨텍스트** — 실무에서는 사용하지 않음

## 콜 스택

실행 컨텍스트는 **스택(LIFO)**으로 관리됩니다.

\`\`\`js
function a() { b(); }
function b() { console.log('b'); }
a();
\`\`\`

\`\`\`
[ b EC ]  ← 실행 중
[ a EC ]
[ Global EC ]
\`\`\`

b가 끝나면 pop되고 a로 돌아갑니다. 재귀가 끝나지 않으면 이 스택이 넘쳐 \`RangeError: Maximum call stack size exceeded\`가 납니다.

## 구성 요소 (ES2015+ 기준)

\`\`\`
ExecutionContext
├─ LexicalEnvironment          ← let, const, class
│   ├─ EnvironmentRecord       (식별자-값 바인딩)
│   └─ [[OuterEnv]]            (상위 환경 참조 → 스코프 체인)
├─ VariableEnvironment         ← var, 함수 선언 (초기값은 LE와 동일)
└─ ThisBinding                 ← this가 가리킬 값
\`\`\`

\`let\`/\`const\`가 재할당되어도 \`var\` 스냅샷은 유지되도록 두 환경을 분리한 것입니다.

## 2단계 처리 — 여기가 핵심

**① 생성(평가) 단계**
- 스코프 내 모든 선언을 스캔해 EnvironmentRecord에 등록 → **호이스팅의 정체**
- \`var\`는 \`undefined\`로 초기화, \`let\`/\`const\`는 **미초기화 상태(TDZ)**로 등록
- 함수 선언문은 함수 객체까지 완성해 등록
- \`[[OuterEnv]]\`에 상위 환경 연결 → **스코프 체인 형성**
- \`this\` 바인딩 결정 → **호출 방식에 따라 달라지는 이유**

**② 실행 단계**
- 코드를 한 줄씩 실행하며 값을 할당하고 식별자를 참조

## 이 개념이 설명하는 것들

| 현상 | 실행 컨텍스트로 본 원인 |
| --- | --- |
| 호이스팅 | 생성 단계에서 선언이 먼저 등록됨 |
| TDZ | \`let\`/\`const\`가 등록만 되고 초기화가 안 된 구간 |
| 스코프 체인 | \`[[OuterEnv]]\` 참조의 연쇄 |
| 클로저 | 함수의 \`[[Environment]]\`가 외부 LexicalEnvironment를 붙잡고 있어 GC되지 않음 |
| \`this\`가 매번 다름 | 생성 단계에서 **호출 방식**을 보고 ThisBinding을 정하기 때문 |
| 화살표 함수의 \`this\` | 자체 ThisBinding을 만들지 않고 스코프 체인을 타고 올라가 찾음 |

## 비동기와의 관계

**이벤트 루프는 콜 스택이 빈 것을 확인한 뒤에만** 태스크 큐의 콜백을 스택에 올립니다. \`setTimeout(fn, 0)\`이 즉시 실행되지 않는 이유이고, 동기 코드가 오래 걸리면 UI가 멈추는 이유입니다.

> 면접 답변 요약: "코드 실행에 필요한 환경 정보를 담은 객체이고, 콜 스택으로 관리됩니다. 생성 단계에서 선언 등록·스코프 체인 연결·\`this\` 바인딩이 일어나고 실행 단계에서 코드가 돌아갑니다. 호이스팅·TDZ·클로저·\`this\`가 모두 여기서 나옵니다."`,
    sub_category: '실행 컨텍스트',
    difficulty: 'hard',
    tags: ['실행컨텍스트', '콜스택', '렉시컬 환경', '호이스팅', 'this'],
  },
  {
    id: 'q-196',
    question: 'JavaScript에서 클래스를 사용하는 이유는 무엇인가요?',
    answer: `\`class\`(ES6)는 **프로토타입 기반 상속을 감싼 문법 설탕(syntactic sugar)**입니다. 새로운 객체지향 모델을 추가한 것이 아니라, 기존 프로토타입 패턴을 더 명확하게 쓰도록 만든 것입니다.

## 사용하는 이유

**1. 가독성과 의도 표현**

\`\`\`js
// ES5 프로토타입 방식
function Person(name) { this.name = name; }
Person.prototype.greet = function () { return 'hi ' + this.name; };
function Student(name, school) { Person.call(this, name); this.school = school; }
Student.prototype = Object.create(Person.prototype);
Student.prototype.constructor = Student;

// class 방식
class Person {
  constructor(name) { this.name = name; }
  greet() { return \`hi \${this.name}\`; }
}
class Student extends Person {
  constructor(name, school) { super(name); this.school = school; }
}
\`\`\`

상속 관계가 \`extends\` 한 단어로 드러나고, \`prototype.constructor\` 재설정 같은 실수하기 쉬운 절차가 사라집니다.

**2. \`super\` 키워드** — 부모 메서드 호출이 \`Parent.prototype.m.call(this)\` 대신 \`super.m()\`

**3. 안전장치가 내장됨**
- \`new\` 없이 호출하면 **TypeError** (일반 생성자 함수는 조용히 전역을 오염시킴)
- 클래스 본문은 **항상 strict mode**
- 메서드는 \`enumerable: false\` → \`for...in\`에 노출되지 않음
- 클래스 선언은 호이스팅되지만 **TDZ**에 놓여 선언 전 사용이 에러

**4. 최신 기능**

\`\`\`js
class Counter {
  #count = 0;                      // private 필드 (진짜 은닉, 런타임 강제)
  static instances = 0;            // static 필드
  static #registry = new Map();    // static private
  get value() { return this.#count; }
  increment() { this.#count++; return this; }
  static { /* static 초기화 블록 */ }
}
\`\`\`

\`#\` private 필드는 클로저나 \`Symbol\` 트릭 없이 **언어 차원에서 접근을 막습니다**. 외부에서 접근하면 문법 에러입니다.

## 여전히 프로토타입이다 — 오해 방지

\`\`\`js
class A { m() {} }
typeof A                                   // "function"
Object.getOwnPropertyNames(A.prototype)    // ['constructor', 'm']
\`\`\`

메서드는 인스턴스가 아니라 \`A.prototype\`에 올라갑니다. 인스턴스 1만 개를 만들어도 메서드는 하나만 존재합니다 — 메모리 효율의 근거입니다.

## 함정 — \`this\` 바인딩

클래스 메서드는 **자동 바인딩되지 않습니다.**

\`\`\`js
class Btn {
  label = 'click';
  handle() { console.log(this.label); }
}
const b = new Btn();
element.addEventListener('click', b.handle);        // ❌ this === undefined
element.addEventListener('click', () => b.handle());// ⭕
// 또는 클래스 필드로 화살표 함수 정의
class Btn2 { handle = () => { /* this 고정 */ }; }
\`\`\`

단, 클래스 필드 화살표 함수는 **인스턴스마다 함수를 새로 만들므로** 프로토타입 공유 이점을 잃습니다.

## 언제 쓰고 언제 안 쓰는가

**쓰는 경우**
- 상태와 동작이 함께 묶이고 인스턴스가 여러 개 필요할 때 (도메인 모델, 에러 클래스, 상태 머신)
- \`extends Error\`로 커스텀 에러를 만들 때
- 라이브러리 공개 API (Map, Set 같은 명확한 객체 계약)

**안 쓰는 경우 — 프론트엔드 실무의 대세**
- React는 함수 컴포넌트 + 훅으로 전환했습니다. 클래스 컴포넌트는 레거시입니다
- 순수 데이터는 plain object + 타입, 로직은 순수 함수가 테스트·트리셰이킹·직렬화에 유리합니다
- 상속보다 **합성(composition)**이 대체로 낫습니다. 깊은 상속 계층은 변경에 취약합니다

> 면접 답변: "프로토타입 상속의 문법 설탕이고, 가독성·\`super\`·private 필드·strict mode 같은 이점 때문에 씁니다. 다만 프론트엔드에서는 함수형 접근이 주류라 도메인 모델이나 커스텀 에러처럼 인스턴스 개념이 명확한 곳에 제한적으로 사용합니다."`,
    sub_category: '객체',
    difficulty: 'medium',
    tags: ['class', '프로토타입', 'private 필드', '상속', 'this'],
  },
  {
    id: 'q-197',
    question: '일반 함수와 화살표 함수의 가장 큰 차이점은 무엇입니까?',
    answer: `**가장 큰 차이는 \`this\` 바인딩입니다.** 일반 함수는 **호출 시점**에 \`this\`가 동적으로 결정되지만, 화살표 함수는 **자신의 \`this\`를 갖지 않고** 선언된 위치의 상위 스코프에서 렉시컬하게 가져옵니다.

## 차이 전체 정리

| 항목 | 일반 함수 | 화살표 함수 |
| --- | --- | --- |
| \`this\` | 호출 방식에 따라 동적 결정 | **상위 스코프에서 렉시컬 참조** |
| \`arguments\` | ⭕ | ❌ (나머지 매개변수 \`...args\` 사용) |
| \`new\` 생성자 | ⭕ | ❌ TypeError |
| \`prototype\` 프로퍼티 | ⭕ | ❌ |
| \`super\` | 메서드에서 사용 가능 | 자체 없음 (상위에서 참조) |
| 호이스팅 | 선언문은 전체 호이스팅 | 변수 규칙(TDZ) |
| 제너레이터 | \`function*\` 가능 | ❌ |
| \`call/apply/bind\`로 \`this\` 변경 | ⭕ | **❌ 무시됨** |

## \`this\` 동작 비교

\`\`\`js
const obj = {
  name: '단우',
  regular() { console.log(this.name); },   // this = obj
  arrow: () => console.log(this?.name),    // this = 모듈/전역 → undefined
};
obj.regular();  // '단우'
obj.arrow();    // undefined  ← 객체 메서드에 화살표 함수를 쓰면 안 되는 이유
\`\`\`

**콜백에서는 반대로 화살표가 정답입니다.**

\`\`\`js
class Timer {
  seconds = 0;
  start() {
    setInterval(() => { this.seconds++; }, 1000);        // ⭕ this = 인스턴스
    setInterval(function () { this.seconds++; }, 1000);  // ❌ this = undefined/Window
  }
}
\`\`\`

과거 \`const self = this\`나 \`.bind(this)\`로 해결하던 문제를 화살표 함수가 언어 차원에서 없앴습니다.

## 그 외 함정

**\`addEventListener\`의 \`this\`**
\`\`\`js
btn.addEventListener('click', function () { console.log(this); });  // this = btn 요소
btn.addEventListener('click', () => console.log(this));             // this = 상위 스코프
\`\`\`
이벤트 대상 요소가 필요하면 일반 함수를 쓰거나 \`e.currentTarget\`을 쓰세요.

**객체를 반환할 때 괄호 필요**
\`\`\`js
const f = () => ({ a: 1 });   // ⭕ 중괄호를 블록이 아닌 객체로 인식시킴
const g = () => { a: 1 };     // ❌ undefined 반환 (블록 + 레이블로 해석)
\`\`\`

**프로토타입 메서드로 부적합** — \`Foo.prototype.m = () => {}\`는 \`this\`가 인스턴스를 가리키지 않습니다.

## 선택 기준

| 상황 | 선택 |
| --- | --- |
| 객체 메서드 | 축약 메서드 \`m() {}\` |
| 클래스 메서드 | 일반 메서드 |
| 콜백 (map, setTimeout, Promise then) | **화살표** |
| React 이벤트 핸들러 | **화살표** |
| 생성자 | 일반 함수 / class |
| \`arguments\`가 필요할 때 | 일반 함수 (또는 \`...args\`) |
| 이벤트 리스너에서 \`this\`로 요소 접근 | 일반 함수 |

> 한 줄 요약: **"화살표 함수는 \`this\`를 만들지 않는다."** \`this\`를 안 만들기 때문에 \`bind\`도 안 먹고, 생성자도 될 수 없고, 콜백에서는 오히려 편리합니다.`,
    sub_category: '함수',
    difficulty: 'medium',
    tags: ['화살표함수', 'this', 'arguments', '바인딩'],
  },
  {
    id: 'q-198',
    question: '스프레드 문법과 레스트 문법의 차이점은 무엇인가요?',
    answer: `**같은 \`...\` 기호지만 방향이 정반대입니다.**

- **스프레드(Spread)** — 이터러블/객체를 **펼쳐서 개별 요소로 흩뿌림** (묶음 → 낱개)
- **레스트(Rest)** — 흩어진 값들을 **하나로 모음** (낱개 → 묶음)

**구분법: 할당의 왼쪽(매개변수·구조분해 대상)에 있으면 레스트, 오른쪽(값·인자 자리)에 있으면 스프레드입니다.**

## 스프레드

\`\`\`js
// 배열 복사·병합
const merged = [...a, ...b];
const copy = [...arr];                   // 얕은 복사

// 함수 인자로 펼치기
Math.max(...[1, 5, 3]);                  // Math.max(1, 5, 3)

// 객체 병합 — 뒤에 오는 값이 이김
const next = { ...state, count: 1 };

// 이터러블 → 배열
[...'abc']                               // ['a','b','c']
[...new Set([1,1,2])]                    // [1,2]
[...document.querySelectorAll('li')]     // NodeList → Array
\`\`\`

## 레스트

\`\`\`js
// 나머지 매개변수 — 반드시 마지막
function sum(first, ...rest) { return rest.reduce((a, b) => a + b, first); }

// 배열 구조분해
const [head, ...tail] = [1, 2, 3];       // head=1, tail=[2,3]

// 객체 구조분해 — 특정 키 제외하기
const { password, ...safeUser } = user;  // password를 뺀 나머지
\`\`\`

## 실무에서 중요한 포인트

**1. 얕은 복사입니다**

\`\`\`js
const orig = { a: { b: 1 } };
const copy = { ...orig };
copy.a.b = 2;
orig.a.b;      // 2 — 중첩 객체는 참조 공유
\`\`\`

깊은 복사는 \`structuredClone(obj)\`를 쓰세요. React 상태에서 중첩 객체를 갱신할 때 스프레드만 쓰고 안심하다 생기는 버그가 흔합니다.

\`\`\`js
setState(prev => ({ ...prev, user: { ...prev.user, name } }));  // 단계마다 펼쳐야 함
\`\`\`

**2. \`arguments\`를 대체합니다**

\`\`\`js
function old() { const args = Array.prototype.slice.call(arguments); }  // ES5
function now(...args) { }   // 진짜 배열이고, 화살표 함수에서도 동작
\`\`\`

**3. 객체 스프레드는 자신의 enumerable 프로퍼티만 복사합니다.** 프로토타입, getter/setter(값만 복사됨), non-enumerable 프로퍼티는 넘어가지 않습니다. 클래스 인스턴스를 스프레드하면 메서드가 사라집니다.

**4. 성능** — 반복문 안에서 스프레드로 배열을 누적하면 매번 새 배열을 만들어 O(n²)가 됩니다.

\`\`\`js
items.reduce((acc, x) => [...acc, x], []);   // ❌ O(n²)
items.reduce((acc, x) => { acc.push(x); return acc; }, []);  // ⭕ O(n)
\`\`\`

**5. 스프레드는 이터러블만** 펼칩니다(객체 스프레드는 ES2018의 별도 문법). \`{...null}\`은 \`{}\`로 안전하지만 \`[...null]\`은 TypeError입니다.

> 정리: 같은 기호, 반대 방향. 스프레드는 **펼치고**, 레스트는 **모읍니다.**`,
    sub_category: '문법',
    difficulty: 'easy',
    tags: ['스프레드', '레스트', '구조분해', '얕은복사'],
  },
  {
    id: 'q-199',
    question: '불변성이란 무엇이고, 자바스크립트에서 중요한 이유는 무엇인가요?',
    answer: `불변성(Immutability)은 **생성된 데이터를 변경하지 않고, 변경이 필요하면 새 데이터를 만드는** 원칙입니다.

## JS에서 왜 문제가 되는가

원시 타입은 이미 불변이지만, **객체와 배열은 가변(mutable)이며 참조로 공유**됩니다.

\`\`\`js
const a = { n: 1 };
const b = a;
b.n = 2;
a.n;        // 2 — 의도치 않은 원격 변경(side effect)
a === b;    // true — 참조가 같아 "바뀐 걸 감지할 수 없음"
\`\`\`

## 중요한 이유 4가지

**1. 변경 감지가 O(1)이 됩니다 — 프론트엔드에서 가장 중요**

React·Redux·Zustand·Jotai는 모두 **얕은 비교(\`Object.is\`)**로 리렌더 여부를 판단합니다.

\`\`\`js
// ❌ 원본 변경 — 참조가 그대로라 React가 변화를 못 알아챔
state.items.push(newItem);
setState(state.items);        // 리렌더 안 됨

// ⭕ 새 참조 생성
setState(prev => [...prev.items, newItem]);
\`\`\`

객체 전체를 깊이 비교하면 O(n)이지만, 불변성을 지키면 **주소 비교 한 번**으로 끝납니다. 이 성질이 없으면 가상 DOM 최적화·메모이제이션이 성립하지 않습니다.

**2. 예측 가능성 · 디버깅**
함수가 인자를 변경하지 않으면 호출자는 안심할 수 있습니다. "어디선가 값이 바뀌었는데 범인을 못 찾는" 상황이 사라집니다.

**3. 시간 여행 · Undo/Redo**
과거 상태를 그대로 보관할 수 있어 Redux DevTools의 상태 되감기, 편집기 실행취소가 가능해집니다.

**4. 동시성 안전**
Web Worker와 값을 주고받을 때 공유 변경으로 인한 경합이 없습니다.

## 실천 방법

**배열 — 변경 메서드 vs 비변경 메서드**

| 변경(❌ 피하기) | 비변경(⭕ 사용) |
| --- | --- |
| \`push\`, \`pop\`, \`shift\`, \`unshift\` | \`[...arr, x]\`, \`arr.slice(0,-1)\`, \`arr.concat()\` |
| \`splice\` | \`filter\`, \`slice\`, \`toSpliced()\` |
| \`sort\`, \`reverse\` | \`toSorted()\`, \`toReversed()\` (ES2023) |
| \`arr[i] = v\` | \`with(i, v)\` (ES2023), \`map\` |

\`sort()\`와 \`reverse()\`가 **원본을 바꾼다**는 것이 대표적인 함정입니다. \`[...arr].sort()\`로 감싸거나 \`toSorted()\`를 쓰세요.

**객체**
\`\`\`js
const next = { ...prev, name };            // 갱신
const { removed, ...rest } = prev;         // 삭제
const deep = { ...prev, a: { ...prev.a, b } }; // 중첩은 단계마다
\`\`\`

**도구**
- \`Object.freeze()\` — 얕은 동결. 개발 환경에서 실수 감지용
- **Immer** — 변경하는 것처럼 쓰면 내부적으로 불변 업데이트를 생성. 중첩이 깊을 때 가독성이 크게 개선됩니다. Redux Toolkit에 내장
- \`structuredClone()\` — 네이티브 깊은 복사

\`\`\`js
// Immer — 겉보기엔 mutable, 결과는 immutable
setState(produce(draft => { draft.user.profile.name = '단우'; }));
\`\`\`

## 주의 — 맹목적 적용의 비용

- **대용량 배열을 매 프레임 복사하면 오히려 느립니다.** 지역 변수처럼 외부에 노출되지 않는 데이터는 변경해도 안전합니다
- \`reduce\` 안에서 스프레드로 누적하면 O(n²)입니다
- 불변성은 **공유되는 상태**에 적용할 원칙이지, 모든 변수에 적용할 교리가 아닙니다

> 면접 답변: "참조 비교만으로 변경을 감지할 수 있게 만들어 주기 때문입니다. React의 리렌더 판단, 메모이제이션, Redux의 상태 추적이 전부 이 전제 위에 있습니다."`,
    sub_category: '함수형',
    difficulty: 'medium',
    tags: ['불변성', 'immutable', 'React', 'Immer', '얕은비교'],
  },
];

// ============================================================
// cat-5 React
// ============================================================

const REACT = [
  {
    id: 'q-200',
    question: '클래스 컴포넌트와 함수형 컴포넌트의 차이점은 무엇인가요?',
    answer: `React 16.8의 Hooks 도입 이후 **함수형 컴포넌트가 사실상 표준**이 되었습니다. 클래스 컴포넌트는 레거시 유지보수용으로만 남아 있습니다.

## 코드 비교

\`\`\`jsx
// 클래스
class Counter extends React.Component {
  state = { count: 0 };
  componentDidMount() { document.title = this.state.count; }
  componentDidUpdate() { document.title = this.state.count; }
  render() {
    return <button onClick={() => this.setState(s => ({ count: s.count + 1 }))}>{this.state.count}</button>;
  }
}

// 함수형
function Counter() {
  const [count, setCount] = useState(0);
  useEffect(() => { document.title = count; }, [count]);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
\`\`\`

## 차이 정리

| 항목 | 클래스 | 함수형 |
| --- | --- | --- |
| 상태 | \`this.state\` / \`setState\` | \`useState\`, \`useReducer\` |
| 사이드 이펙트 | 생명주기 메서드 3개에 분산 | \`useEffect\` 하나로 통합 |
| \`this\` | 바인딩 필요 (버그 원천) | **없음** |
| 로직 재사용 | HOC, Render Props (래퍼 지옥) | **커스텀 훅** |
| 코드량 | 많음 | 적음 |
| 번들 크기 | 상대적으로 큼 | 작음 |
| 최적화 | \`shouldComponentUpdate\`, \`PureComponent\` | \`React.memo\`, \`useMemo\`, \`useCallback\` |
| 최신 기능 | ❌ Suspense·Concurrent·Server Component 미지원 | ⭕ 전부 지원 |

## 함수형이 이긴 진짜 이유

**1. 관심사가 생명주기가 아니라 "기능" 단위로 묶입니다**

클래스에서는 구독 설정이 \`componentDidMount\`에, 해제가 \`componentWillUnmount\`에 떨어져 있어 짝이 눈에 보이지 않습니다. \`useEffect\`는 설정과 정리(cleanup)를 **한 블록**에 씁니다.

\`\`\`jsx
useEffect(() => {
  const sub = source.subscribe();
  return () => sub.unsubscribe();   // 짝이 바로 옆에
}, [source]);
\`\`\`

**2. 로직 재사용이 커스텀 훅으로 평평해집니다**
HOC를 겹치면 \`<A><B><C><Component/></C></B></A>\` 래퍼 지옥이 되고 props 출처가 불투명해집니다. 커스텀 훅은 그냥 함수 호출입니다.

**3. \`this\`가 없습니다**
클래스의 \`this.handleClick\` 바인딩 누락은 React 초심자의 1순위 버그였습니다.

## 클래스만 할 수 있는 것 — 딱 하나

**Error Boundary**는 아직 클래스 컴포넌트로만 만들 수 있습니다(\`componentDidCatch\`, \`getDerivedStateFromError\`). 실무에서는 \`react-error-boundary\` 라이브러리로 감싸 쓰는 것이 일반적입니다.

## 중요한 개념 차이 — 클로저 캡처

클래스는 \`this.props\`가 **항상 최신**을 가리키지만, 함수형은 **각 렌더의 props/state가 그 렌더에 고정(캡처)**됩니다.

\`\`\`jsx
function Profile({ user }) {
  const show = () => setTimeout(() => alert(user.name), 3000);
  // 3초 안에 user가 바뀌어도 클릭 시점의 user를 보여줌 (대개 이게 올바른 동작)
}
\`\`\`

이 "렌더마다 독립된 스냅샷" 모델이 함수형의 정신 모델이며, 오래된 값을 참조하는 **stale closure** 문제의 원인이기도 합니다. 최신 값이 꼭 필요하면 \`useRef\`나 setter의 함수형 업데이트를 씁니다.

> 면접 답변: "문법 차이보다 중요한 건 사고방식 차이입니다. 클래스는 인스턴스가 계속 살아 있고, 함수형은 렌더마다 새 스냅샷이 만들어집니다. 그래서 로직 재사용이 훅으로 자연스럽고, Concurrent 기능도 함수형에서만 지원됩니다."`,
    sub_category: '핵심 개념',
    difficulty: 'medium',
    tags: ['클래스 컴포넌트', '함수형 컴포넌트', 'Hooks', 'stale closure'],
  },
  {
    id: 'q-201',
    question: '리액트에서 컴포넌트 간 통신을 위해 사용하는 다양한 방법을 설명할 수 있나요?',
    answer: `관계에 따라 방법이 달라집니다. **가장 단순한 것부터 올라가는 것**이 원칙입니다.

## 1. 부모 → 자식 : props

\`\`\`jsx
<Child name="단우" />
\`\`\`
React의 데이터 흐름은 단방향입니다. 기본이자 대부분의 경우 정답입니다.

## 2. 자식 → 부모 : 콜백 props

\`\`\`jsx
function Parent() {
  const [v, setV] = useState('');
  return <Input onChange={setV} />;
}
\`\`\`
"상태 끌어올리기(lifting state up)" 패턴입니다.

## 3. 형제 간 : 공통 부모로 상태 끌어올리기

가장 가까운 공통 조상이 상태를 갖고, 한쪽에는 값을, 다른 쪽에는 setter를 내려줍니다.

## 4. 깊은 트리 : Context API

\`\`\`jsx
const ThemeContext = createContext(null);
<ThemeContext value={theme}>{children}</ThemeContext>   // React 19: .Provider 생략 가능
const theme = use(ThemeContext);                         // 또는 useContext
\`\`\`

**주의 — 성능**: Context 값이 바뀌면 **구독하는 모든 컴포넌트가 리렌더**됩니다. 자주 바뀌는 값과 안 바뀌는 값은 Context를 **분리**하고, 객체 값은 \`useMemo\`로 감싸세요. Context는 "상태 관리 도구"가 아니라 **주입(injection) 도구**입니다.

## 5. 전역 상태 라이브러리

| 라이브러리 | 특징 |
| --- | --- |
| **Zustand** | 훅 기반, 셀렉터로 부분 구독 → 불필요한 리렌더 없음 |
| **Jotai** | atom 단위. 상향식 조합 |
| **Redux Toolkit** | 예측 가능한 흐름, DevTools 시간여행. 대규모 앱 |
| **Recoil/Valtio** | 각각 atom / proxy 기반 |

## 6. 서버 상태 : React Query / SWR

**서버에서 온 데이터는 전역 상태가 아닙니다.** 캐시입니다. 전역 스토어에 API 응답을 쌓는 대신 React Query를 쓰면 캐싱·재검증·로딩/에러 상태·중복 요청 제거를 전부 위임할 수 있습니다. 여러 컴포넌트가 같은 \`queryKey\`를 쓰면 자동으로 데이터를 공유합니다.

## 7. 자식 → 부모 명령형 호출 : ref

\`\`\`jsx
function Modal({ ref }) {           // React 19: ref를 props로 직접 받음
  useImperativeHandle(ref, () => ({ open: () => {}, close: () => {} }));
}
// 부모
const modalRef = useRef(null);
modalRef.current.open();
\`\`\`
포커스·스크롤·미디어 재생처럼 **선언적으로 표현하기 어려운 명령**에만 쓰세요.

## 8. 합성(Composition) — 과소평가된 방법

\`\`\`jsx
<Layout sidebar={<Nav />}>          // children/슬롯으로 넘기기
  <Content />
</Layout>
\`\`\`
prop drilling을 없애는 가장 가벼운 해법입니다. Context를 꺼내기 전에 먼저 검토하세요.

## 9. URL — 화면 상태의 정석

필터·탭·페이지·검색어는 **URL 쿼리스트링**에 두는 것이 맞습니다. 공유·북마크·뒤로가기가 공짜로 따라옵니다. 전역 atom으로 화면을 전환하지 마세요.

## 선택 가이드

\`\`\`
props로 충분한가 → 예: props
  ↓ 아니오
합성(children)으로 풀리는가 → 예: 합성
  ↓ 아니오
서버 데이터인가 → 예: React Query
  ↓ 아니오
URL에 있어야 할 상태인가 → 예: 쿼리스트링
  ↓ 아니오
자주 안 바뀌는 값인가 → 예: Context
  ↓ 아니오
Zustand / Jotai
\`\`\`

> 면접 포인트: "무조건 Redux"가 아니라 **문제 규모에 맞는 최소 도구를 고르는 판단**을 보여주세요. 특히 "서버 상태와 클라이언트 상태를 분리한다"는 관점이 중요합니다.`,
    sub_category: '상태관리',
    difficulty: 'medium',
    tags: ['props', 'Context', '상태끌어올리기', 'Zustand', 'React Query'],
  },
  {
    id: 'q-202',
    question: '리액트 18 버전에 도입된 동시성 기능을 설명할 수 있나요?',
    answer: `React 18의 동시성(Concurrency)은 **렌더링을 중단·재개·폐기할 수 있게 만든 렌더러의 근본적 변화**입니다. "여러 작업을 동시에 실행"하는 것이 아니라(JS는 여전히 싱글 스레드), **렌더링 작업에 우선순위를 두고 급한 일이 오면 하던 렌더를 양보(yield)**하는 것입니다.

## 이전과 무엇이 다른가

**Legacy 모드** — 렌더링은 한 번 시작하면 끝날 때까지 **중단 불가(blocking)**. 큰 트리를 렌더하는 동안 사용자 입력이 밀립니다.

**Concurrent 모드** — 렌더링이 중단 가능(interruptible). 렌더 도중 더 급한 업데이트가 들어오면 진행 중인 작업을 버리고 급한 것부터 처리합니다.

## 핵심 API

**1. \`useTransition\` — 급하지 않은 업데이트 표시**

\`\`\`jsx
const [isPending, startTransition] = useTransition();

function handleChange(e) {
  setQuery(e.target.value);                    // 긴급: 입력값은 즉시 반영
  startTransition(() => setResults(filter(e.target.value)));  // 비긴급: 양보 가능
}
\`\`\`

무거운 목록 필터링 때문에 입력이 버벅이는 문제를 해결합니다. \`isPending\`으로 로딩 표시를 할 수 있습니다.

**2. \`useDeferredValue\` — 값의 지연 사본**

\`\`\`jsx
const deferredQuery = useDeferredValue(query);
const list = useMemo(() => filter(deferredQuery), [deferredQuery]);
\`\`\`

\`useTransition\`은 **업데이트를 감쌀 수 있을 때**, \`useDeferredValue\`는 **값만 받고 setter에 접근할 수 없을 때**(props로 받은 값) 씁니다.

> 디바운스와 다릅니다. 디바운스는 고정 시간을 기다리지만, 이쪽은 **기기 성능에 적응**하고 새 입력이 오면 진행 중이던 렌더를 즉시 폐기합니다.

**3. Automatic Batching**

React 17까지는 이벤트 핸들러 안에서만 상태 업데이트가 묶였습니다. 18부터는 \`setTimeout\`, Promise, 네이티브 이벤트 안에서도 자동으로 묶여 **리렌더 횟수가 줄어듭니다.**

\`\`\`jsx
setTimeout(() => { setA(1); setB(2); }, 0);
// React 17: 2번 렌더 / React 18: 1번 렌더
\`\`\`

즉시 DOM 반영이 필요하면 \`flushSync\`로 배칭을 빠져나올 수 있습니다(성능상 최후의 수단).

**4. Streaming SSR + Suspense**

\`\`\`jsx
<Suspense fallback={<Skeleton />}>
  <SlowComponent />
</Suspense>
\`\`\`

서버에서 준비된 부분부터 HTML을 흘려보내고(\`renderToPipeableStream\`), 늦은 부분은 나중에 채웁니다. **선택적 하이드레이션**으로 사용자가 상호작용한 영역을 우선 hydrate합니다. Next.js App Router의 \`loading.tsx\`가 이 위에 올라가 있습니다.

**5. \`useSyncExternalStore\`** — 외부 스토어를 tearing(같은 렌더 안에서 서로 다른 값을 보는 현상) 없이 구독. Zustand·Redux 등 라이브러리 내부에서 사용합니다.

**6. \`useId\`** — 서버·클라이언트에서 일치하는 안정적 ID 생성. 하이드레이션 불일치 방지용.

## 활성화 방법

\`createRoot\`를 쓰면 동시성 기능이 켜집니다. 다만 **자동으로 빨라지지 않습니다** — \`startTransition\` 등으로 "무엇이 급하지 않은지" 개발자가 알려줘야 효과가 납니다.

\`\`\`jsx
createRoot(document.getElementById('root')).render(<App />);
\`\`\`

## 주의점

- 렌더가 **중단·폐기·재실행**될 수 있으므로 **렌더 함수는 순수해야 합니다.** 렌더 중 사이드 이펙트가 있으면 중복 실행됩니다. StrictMode가 개발 모드에서 이중 렌더를 하는 이유가 이것을 잡기 위함입니다
- 남용하면 오히려 지연이 늘어납니다. 실제로 버벅이는 지점에만 적용하세요

> 한 줄 요약: "동시성은 렌더링을 **중단 가능**하게 만들어 우선순위를 부여하는 것이고, \`useTransition\`/\`useDeferredValue\`로 '이건 급하지 않다'고 표시하는 방식입니다."`,
    sub_category: '렌더링',
    difficulty: 'hard',
    tags: ['React 18', '동시성', 'useTransition', 'Suspense', 'Automatic Batching'],
  },
  {
    id: 'q-203',
    question: 'CSR의 개념과 한계점은 무엇인가요?',
    answer: `CSR(Client Side Rendering)은 서버가 **빈 HTML 껍데기와 JS 번들만** 내려주고, **브라우저에서 JS가 실행되며 DOM을 그리는** 방식입니다. React·Vue의 기본 SPA 모델입니다.

## 동작 흐름

\`\`\`
1. HTML 요청 → <div id="root"></div> 만 있는 빈 문서 수신
2. JS 번들 다운로드 (수백 KB ~ MB)
3. JS 파싱 + 실행
4. API 호출 → 데이터 수신
5. 렌더링 → 화면 표시
\`\`\`

사용자는 2~5 동안 **흰 화면 또는 스피너**를 봅니다.

## 장점

- **부드러운 화면 전환** — 이후 내비게이션은 서버 왕복 없이 클라이언트에서 처리
- **서버 부하 감소** — 정적 파일만 서빙(CDN 배포 가능)
- **프론트/백 분리** — API 계약만 맞추면 독립 배포
- 앱처럼 상호작용이 많은 UI(대시보드, 에디터)에 적합

## 한계점 — 면접 핵심

**1. 초기 로딩이 느림 (FCP/LCP 악화)**
JS를 받고 실행하고 API를 부른 뒤에야 첫 픽셀이 나옵니다. 네트워크가 느리거나 저사양 기기일수록 격차가 커집니다.

**2. SEO 취약**
Googlebot은 JS를 실행하지만 **렌더링 큐에 들어가 지연**되고, 그 외 크롤러(네이버, 다음, SNS 미리보기 봇, 슬랙 언퍼얼)는 대부분 JS를 실행하지 않습니다. 오픈그래프 태그를 JS로 주입하면 공유 카드가 비어 보입니다.

**3. 번들 크기 = 진입 비용**
기능이 늘수록 번들이 커지고 초기 로딩이 선형적으로 나빠집니다.

**4. 워터폴(Waterfall)**
JS 다운로드 → 실행 → API 요청이 **순차적**입니다. 서버는 데이터를 미리 가져올 수 있는데 CSR은 브라우저가 JS를 실행할 때까지 요청조차 시작하지 못합니다.

**5. 저사양 기기에서 불리**
파싱·실행은 CPU 작업입니다. 네트워크는 빨라져도 저가 안드로이드의 JS 실행 속도는 크게 개선되지 않습니다.

**6. 백지 화면 리스크**
JS 로딩이 실패하면 **아무것도 안 보입니다.** SSR은 최소한 콘텐츠는 남습니다.

## 완화 방법

| 문제 | 대응 |
| --- | --- |
| 번들 크기 | 코드 스플리팅(\`React.lazy\`), 트리 셰이킹 |
| 흰 화면 | 스켈레톤 UI, 앱 셸 패턴 |
| 워터폴 | \`<link rel="preload">\`, prefetch, React Query prefetch |
| SEO | 프리렌더링(prerender.io), SSG 전환 |
| 재방문 | Service Worker 캐싱 |

## 다른 방식과 비교

| | CSR | SSR | SSG | RSC |
| --- | --- | --- | --- | --- |
| HTML 생성 | 브라우저 | 요청마다 서버 | 빌드 타임 | 서버(컴포넌트 단위) |
| FCP | 느림 | 빠름 | **가장 빠름** | 빠름 |
| SEO | 취약 | 좋음 | 좋음 | 좋음 |
| 서버 비용 | 낮음 | 높음 | 낮음 | 중간 |
| 실시간 데이터 | ⭕ | ⭕ | ❌(ISR 필요) | ⭕ |
| 적합 | 대시보드, 어드민 | 커머스, 커뮤니티 | 블로그, 문서 | 콘텐츠+상호작용 혼합 |

## 실무 결론

**전부 CSR / 전부 SSR의 이분법은 낡았습니다.** Next.js App Router는 페이지·컴포넌트 단위로 섞습니다 — 마케팅 페이지는 SSG, 상품 목록은 SSR/RSC, 로그인 후 대시보드는 CSR. 인증이 필요한 어드민처럼 SEO가 무의미하고 상호작용이 많은 화면은 CSR이 여전히 최선의 선택입니다.

> 면접 답변: "CSR의 본질적 한계는 **첫 화면까지 JS 실행이 필수 경로에 있다**는 점입니다. 이게 FCP·SEO·저사양 기기 문제의 공통 원인이고, SSR/SSG는 이 의존을 끊는 방식입니다."`,
    sub_category: '렌더링',
    difficulty: 'medium',
    tags: ['CSR', 'SPA', 'SEO', 'FCP', '번들'],
  },
  {
    id: 'q-204',
    question: 'key 속성의 중요성과 정확한 사용법을 설명할 수 있나요?',
    answer: `\`key\`는 React가 **재조정(reconciliation) 과정에서 리스트의 각 항목이 이전 렌더의 어느 항목과 같은 것인지 식별**하는 힌트입니다. DOM 재사용 여부와 컴포넌트 상태 보존 여부가 여기서 결정됩니다.

## 왜 필요한가

React는 형제 노드를 비교할 때 **기본적으로 순서(index)로 짝**을 짓습니다. 리스트 중간에 항목이 삽입되면 그 뒤 전부가 "변경된 것"으로 판단되어 불필요한 재생성이 일어납니다. \`key\`가 있으면 순서가 아니라 **정체성**으로 짝을 지어, 이동한 노드는 이동으로 처리합니다.

## index를 key로 쓰면 안 되는 이유 — 면접 단골

\`\`\`jsx
{items.map((item, i) => <Item key={i} {...item} />)}   // ❌
\`\`\`

\`\`\`
초기:  [A(key=0), B(key=1), C(key=2)]
앞에 Z 삽입 → [Z(key=0), A(key=1), B(key=2), C(key=3)]

React 판단: key=0의 내용이 A→Z로 바뀜, key=1이 B→A로 바뀜 ...
→ 전부 업데이트. 게다가 각 DOM에 붙어 있던 상태는 그 자리에 남음
\`\`\`

**구체적 버그:**

\`\`\`jsx
// 각 항목에 <input>이 있는 리스트
[A, B, C]에서 A의 input에 "hello" 입력
→ 맨 앞에 Z 삽입
→ Z의 input에 "hello"가 들어가 있음 (상태가 위치에 묶였기 때문)
\`\`\`

체크박스 상태, 포커스, 애니메이션, 비제어 input 값이 **엉뚱한 항목으로 옮겨 붙습니다.**

## 올바른 key

\`\`\`jsx
{items.map(item => <Item key={item.id} {...item} />)}   // ⭕ 데이터 고유 ID
\`\`\`

**규칙**
1. **안정적(stable)** — 리렌더 사이에 변하지 않을 것
2. **고유(unique)** — **형제 사이에서만** 고유하면 됨(전역 유일일 필요 없음)
3. **예측 가능(predictable)** — 같은 데이터면 같은 key

## 절대 하면 안 되는 것

\`\`\`jsx
<Item key={Math.random()} />        // ❌ 매 렌더 새 key → 전체 언마운트/재마운트
<Item key={uuid()} />               // ❌ 위와 동일
\`\`\`

DOM이 통째로 버려지고 다시 만들어져 성능·상태·포커스가 모두 깨집니다.

## index를 써도 되는 경우

**세 조건을 모두 만족할 때만**:
1. 목록이 정적이고 순서가 바뀌지 않음
2. 항목이 추가·삭제되지 않음
3. 각 항목에 내부 상태가 없음

정렬·필터·페이지네이션이 있다면 해당하지 않습니다.

## 고유 ID가 없을 때

- 여러 필드를 조합해 합성 key를 만듭니다

\`\`\`jsx
{items.map(item => <Item key={item.type + '-' + item.date} {...item} />)}
\`\`\`

- **데이터를 받는 시점에** ID를 부여(렌더 중이 아니라)
- 최후에 index — 위 3조건 확인 후

## key의 또 다른 용도 — 의도적 리마운트

\`key\`를 바꾸면 React는 다른 컴포넌트로 간주해 **상태를 초기화**합니다. 이를 역이용할 수 있습니다.

\`\`\`jsx
<UserProfile key={userId} userId={userId} />
// userId가 바뀌면 내부 상태(폼 입력 등)가 자동 초기화됨
\`\`\`

\`useEffect\`로 상태를 리셋하는 것보다 깔끔하고, React 공식 문서가 권장하는 패턴입니다.

## 자주 하는 실수

\`\`\`jsx
// ❌ key를 감싼 요소가 아니라 안쪽에 붙임
{items.map(item => <><Item key={item.id} /></>)}
// ⭕ map이 반환하는 최상위 요소에
{items.map(item => <Fragment key={item.id}><Item /></Fragment>)}
\`\`\`

**\`key\`는 props가 아닙니다.** 자식 컴포넌트에서 \`props.key\`로 읽을 수 없습니다. 값이 필요하면 \`id\` 같은 별도 prop으로 한 번 더 넘기세요.

> 면접 답변: "\`key\`는 성능 최적화 힌트를 넘어 **컴포넌트의 정체성**을 정의합니다. index를 쓰면 정체성이 '위치'가 되어 순서가 바뀔 때 상태가 엉뚱한 항목으로 옮겨 가는 버그가 납니다."`,
    sub_category: '렌더링',
    difficulty: 'medium',
    tags: ['key', '재조정', 'reconciliation', 'index', '리마운트'],
  },
];

// ============================================================
// cat-6 Next.js
// ============================================================

const NEXT = [
  {
    id: 'q-205',
    question: '넥스트.js를 사용하는 이유와 장점은 무엇인가요?',
    answer: `Next.js는 React 기반 **풀스택 프레임워크**입니다. React는 UI 라이브러리일 뿐이라 라우팅·데이터 패칭·번들링·SSR을 직접 조립해야 하는데, Next.js는 이를 **의견을 가진 기본값**으로 제공합니다.

## React만으로 직접 해야 하는 것들

라우팅(React Router), 번들러 설정(Vite/Webpack), SSR 파이프라인, 코드 스플리팅, 이미지 최적화, 환경변수 처리, API 서버 — Next.js는 이 전부를 통합 제공합니다.

## 핵심 장점

**1. 렌더링 전략을 페이지·컴포넌트 단위로 선택**

| 전략 | 시점 | 용도 |
| --- | --- | --- |
| SSG | 빌드 타임 | 블로그, 문서, 랜딩 |
| ISR | 빌드 + 주기적 재생성 | 상품 목록, 뉴스 |
| SSR | 요청마다 | 개인화 대시보드 |
| CSR | 브라우저 | 인증 후 인터랙션 화면 |
| RSC | 서버 컴포넌트 | 데이터 접근 + 번들 감소 |

**한 앱 안에서 섞을 수 있다는 것**이 핵심입니다.

**2. React Server Components (App Router)**
서버에서만 실행되는 컴포넌트로 DB·파일시스템에 직접 접근하고, **해당 코드는 클라이언트 번들에 포함되지 않습니다.** 무거운 마크다운 파서나 날짜 라이브러리를 서버에 두면 번들이 그만큼 줄어듭니다.

**3. 파일 기반 라우팅**
\`app/blog/[slug]/page.tsx\` → \`/blog/:slug\`. 설정 파일 없이 폴더 구조가 곧 URL이며, \`layout.tsx\`로 중첩 레이아웃이 상태를 유지한 채 공유됩니다.

**4. 내장 최적화**
- \`<Image>\` — 포맷 변환(WebP/AVIF), 반응형 \`srcset\`, lazy loading, CLS 방지
- \`next/font\` — 폰트 셀프 호스팅 + \`size-adjust\`로 레이아웃 시프트 제거
- 자동 코드 스플리팅, 스크립트 우선순위 제어(\`next/script\`)

**5. 백엔드 통합**
Route Handlers(\`app/api/*/route.ts\`)와 Server Actions로 별도 서버 없이 API·폼 처리·DB 접근이 가능합니다. **API 키를 서버에만 두는** 것도 자연스럽습니다.

**6. SEO**
서버 렌더링된 HTML + Metadata API로 메타 태그·오픈그래프·사이트맵·robots를 타입 안전하게 생성합니다.

**7. 배포 경험**
Vercel에 연결하면 프리뷰 배포·이미지 최적화·엣지 캐싱이 기본 제공됩니다. Docker·Node 서버·정적 export도 지원합니다.

## 단점 / 트레이드오프

- **서버 인프라 비용** — SSR/ISR은 순수 정적 호스팅보다 비쌉니다
- **학습 곡선** — App Router의 캐싱 계층(Request Memoization / Data Cache / Full Route Cache / Router Cache)이 복잡하고, 서버/클라이언트 경계 개념을 이해해야 합니다
- **버전 간 변화가 큼** — Pages → App Router 전환, 캐싱 기본값 변경 등 breaking change가 잦습니다
- **Vercel 종속 우려** — 핵심은 오픈소스지만 일부 최적화는 Vercel에서 가장 매끄럽게 동작합니다
- **오버킬 가능성** — 어드민 대시보드처럼 SEO가 무의미하고 전부 인증 뒤에 있는 앱은 Vite + React가 더 가볍고 빠릅니다

## 언제 쓰고 언제 안 쓰나

**쓴다**: SEO가 중요한 서비스, 콘텐츠 중심, 초기 로딩이 매출과 직결(커머스), 풀스택을 한 저장소에서.
**안 쓴다**: 사내 어드민·대시보드(→ Vite), 순수 정적 문서(→ Astro), 이미 별도 백엔드가 확고하고 SEO가 불필요한 SPA.

> 이 저장소의 hub·fe-deep은 포트폴리오·콘텐츠 성격이라 SEO와 초기 로딩이 중요해 Next.js를 선택했습니다.`,
    sub_category: '핵심 개념',
    difficulty: 'medium',
    tags: ['Next.js', 'RSC', 'SSG', 'SEO', '프레임워크 선택'],
  },
  {
    id: 'q-206',
    question: '앱 라우터와 페이지 라우터의 차이점은 무엇인가요?',
    answer: `Next.js 13에서 도입된 App Router(\`app/\`)는 **React Server Components 기반의 새 라우팅 모델**이고, Pages Router(\`pages/\`)는 기존 방식입니다. 두 라우터는 **한 프로젝트에 공존 가능**하며 점진적 마이그레이션을 지원합니다(같은 경로가 겹치면 App Router가 우선).

## 비교

| 항목 | Pages Router | App Router |
| --- | --- | --- |
| 디렉터리 | \`pages/\` | \`app/\` |
| 기본 컴포넌트 | 클라이언트 컴포넌트 | **서버 컴포넌트** |
| 라우트 정의 | \`pages/about.tsx\` | \`app/about/page.tsx\` |
| 레이아웃 | \`_app.tsx\` (전역 1개) | \`layout.tsx\` (**중첩 가능**) |
| 데이터 패칭 | \`getServerSideProps\`, \`getStaticProps\` | **컴포넌트 안에서 \`async/await\`** |
| 로딩 UI | 직접 구현 | \`loading.tsx\` (Suspense 자동) |
| 에러 처리 | \`_error.tsx\` | \`error.tsx\` (**세그먼트별**) |
| API | \`pages/api/*.ts\` | \`app/api/*/route.ts\` (Web Request/Response) |
| 메타데이터 | \`next/head\` | \`metadata\` export / \`generateMetadata\` |
| 스트리밍 | ❌ | ⭕ |
| 캐싱 | 단순 | 4계층(복잡) |

## 파일 규칙

**Pages Router** — \`pages/\` 안의 모든 \`.tsx\`가 라우트가 됩니다. 컴포넌트를 같이 두면 라우트로 노출되는 문제가 있었습니다.

**App Router** — **특수 파일명만** 라우트 역할을 하므로 폴더 안에 컴포넌트를 함께 둘 수 있습니다(colocation).

\`\`\`
app/blog/[slug]/
├─ page.tsx        ← 이 경로의 화면 (필수)
├─ layout.tsx      ← 중첩 레이아웃 (상태 유지)
├─ loading.tsx     ← Suspense fallback
├─ error.tsx       ← Error Boundary ('use client' 필수)
├─ not-found.tsx
└─ _components/    ← 언더스코어 = 라우트에서 제외
\`\`\`

## 데이터 패칭 차이 — 가장 큰 변화

\`\`\`tsx
// Pages Router — 페이지 최상단에서만, props로 내려보냄
export async function getServerSideProps() {
  const data = await fetchData();
  return { props: { data } };
}
export default function Page({ data }) {}

// App Router — 필요한 컴포넌트가 직접 가져옴
export default async function Page() {
  const data = await fetchData();   // 컴포넌트가 async
  return <View data={data} />;
}
\`\`\`

데이터가 필요한 곳에서 직접 가져오므로 **prop drilling이 사라집니다.** 같은 요청 내 중복 \`fetch\`는 자동으로 메모이제이션됩니다.

## App Router의 이점

- **중첩 레이아웃** — 사이드바가 페이지 이동 시 리렌더/스크롤 리셋 없이 유지
- **스트리밍** — 느린 부분만 Suspense로 감싸 나머지를 먼저 표시
- **번들 감소** — 서버 컴포넌트 코드는 클라이언트로 전송되지 않음
- **세그먼트별 에러 격리** — 한 위젯이 터져도 페이지 전체가 죽지 않음
- **Server Actions** — 폼 처리에 별도 API 라우트 불필요

## 주의점 / 마이그레이션 난점

- **\`'use client'\` 경계 이해가 필수**입니다. \`useState\`, \`useEffect\`, 이벤트 핸들러, 브라우저 API는 클라이언트 컴포넌트에서만 동작합니다
- 많은 라이브러리가 클라이언트 전용이라 \`'use client'\` 래퍼가 필요합니다
- **캐싱이 어렵습니다.** Next 15에서 \`fetch\`와 Route Handler의 기본 캐싱이 "캐시 안 함"으로 바뀌는 등 버전별 기본값 변화가 잦았습니다
- \`getServerSideProps\`/\`getStaticProps\`는 App Router에서 **동작하지 않습니다**

## 선택 기준

- **신규 프로젝트 → App Router.** Next.js의 모든 신규 기능이 여기에 들어갑니다
- **기존 Pages Router 대규모 앱** → 급하게 옮길 필요는 없습니다. Pages Router는 계속 지원되며, 라우트 단위로 점진 이전이 가능합니다

> 이 저장소의 앱들은 App Router를 쓰되 **Next 라우팅용 \`app/\`과 FSD의 \`src/app\` 레이어를 분리**합니다. \`app/\`은 진입점만 얇게 두고 화면은 \`views\`, 전역 setup은 \`src/app\`이 담당합니다.`,
    sub_category: 'App Router',
    difficulty: 'medium',
    tags: ['App Router', 'Pages Router', 'RSC', 'layout', '마이그레이션'],
  },
  {
    id: 'q-207',
    question: '넥스트.js의 하이드레이션 오류란 무엇인가요?',
    answer: `하이드레이션(Hydration)은 **서버가 만든 정적 HTML에 클라이언트 React가 이벤트 핸들러와 상태를 붙여 상호작용 가능하게 만드는 과정**입니다. 이때 서버 HTML과 클라이언트의 첫 렌더 결과가 **다르면** 하이드레이션 오류가 발생합니다.

\`\`\`
Error: Hydration failed because the server rendered HTML didn't match the client.
Text content does not match server-rendered HTML.
\`\`\`

## 왜 문제인가

React는 성능을 위해 "서버 HTML과 클라이언트 렌더 결과가 같다"고 **가정**합니다. 다르면 해당 트리를 버리고 클라이언트에서 다시 그리므로 **SSR의 이점이 사라지고**, 깜빡임(FOUC)·잘못된 UI·이벤트 미연결이 발생합니다.

## 주요 원인

**1. 서버/클라이언트에서 값이 다른 API**

\`\`\`jsx
<div>{new Date().toLocaleString()}</div>   // ❌ 서버 시각 ≠ 클라이언트 시각
<div>{Math.random()}</div>                  // ❌
\`\`\`

**2. 브라우저 전용 API를 렌더 중 사용**

\`\`\`jsx
const w = window.innerWidth;                // ❌ 서버에 window 없음
const t = localStorage.getItem('theme');    // ❌
\`\`\`

**3. 잘못된 HTML 중첩** — 브라우저가 파싱 중 DOM 구조를 교정해버립니다.

\`\`\`jsx
<p><div>내용</div></p>      // ❌ 브라우저가 p를 강제로 닫음
<a><a>중첩</a></a>          // ❌
<div>를 <tbody> 없이 <table> 직속에 배치  // ❌
\`\`\`

**4. 브라우저 확장 프로그램** — 다크리더, 번역기, 비밀번호 관리자가 DOM에 속성을 주입합니다. **개발자 잘못이 아닌 경우**이며 시크릿 모드에서 재현해 보면 구분됩니다.

**5. \`typeof window !== 'undefined'\` 분기**

\`\`\`jsx
{typeof window !== 'undefined' && <Widget />}   // ❌ 서버엔 없고 클라이언트엔 있음
\`\`\`

**6. 사용자 로케일 의존 포맷팅** — \`toLocaleString()\`, \`Intl.*\`가 서버(UTC/en-US)와 클라이언트(KST/ko-KR)에서 다른 문자열을 냅니다.

## 해결 방법

**① 마운트 후에만 렌더 (가장 일반적)**

\`\`\`jsx
'use client';
function ClientOnly({ children }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;      // 서버·첫 렌더 모두 null → 일치
  return children;
}
\`\`\`

**② \`dynamic\` + \`ssr: false\`**

\`\`\`jsx
const Chart = dynamic(() => import('./Chart'), { ssr: false, loading: () => <Skeleton /> });
\`\`\`

**③ \`suppressHydrationWarning\`** — 불일치가 **불가피하고 무해할 때만.** 해당 요소의 **자식 텍스트 한 단계**에만 적용되며, 근본 해결이 아니라 경고를 끄는 것입니다.

\`\`\`jsx
<time suppressHydrationWarning>{new Date().toISOString()}</time>
\`\`\`

테마 전환 스크립트(\`<html>\`에 클래스 주입)에서 \`<html suppressHydrationWarning>\`을 쓰는 것이 정당한 대표 사례입니다.

**④ 시간/숫자 포맷은 서버에서 확정** — 서버에서 이미 포맷된 문자열을 내려보내거나, 타임존을 명시적으로 고정합니다.

\`\`\`jsx
new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul' }).format(date)
\`\`\`

**⑤ 초기 상태를 서버 값과 맞추기** — \`localStorage\` 기반 상태는 초기값을 서버와 동일한 기본값으로 두고, \`useEffect\`에서 갱신합니다.

## 디버깅 팁

- Next.js 개발 모드 에러 오버레이가 **서버/클라이언트 diff를 직접 보여줍니다**. 여기부터 보세요
- 시크릿 모드로 확장 프로그램을 배제
- 컴포넌트를 반씩 주석 처리하며 이분 탐색
- HTML 중첩은 \`pnpm lint\`(jsx-a11y/react 규칙)와 W3C validator로 사전에 걸러집니다

> 면접 답변: "SSR HTML과 클라이언트 첫 렌더가 달라서 나는 오류입니다. 원인은 대부분 **비결정적 값**(시간·랜덤), **브라우저 전용 API**, **잘못된 HTML 중첩** 셋 중 하나이고, 근본 해결은 '서버와 클라이언트의 첫 렌더 결과를 같게 만드는 것'입니다. \`suppressHydrationWarning\`은 마지막 수단입니다."`,
    sub_category: '렌더링',
    difficulty: 'medium',
    tags: ['하이드레이션', 'SSR', 'Hydration Error', 'dynamic', 'RSC'],
  },
  {
    id: 'q-208',
    question: '넥스트.js 앱을 배포할 때 고려해야 할 사항은 무엇이고, 어떤 플랫폼을 주로 사용하나요?',
    answer: `## 배포 방식 3가지 — 먼저 이것부터 정합니다

| 출력 모드 | 설정 | 지원 기능 | 호스팅 |
| --- | --- | --- | --- |
| **Node 서버** (기본) | 없음 | SSR, ISR, Route Handlers, Server Actions, Middleware 전부 | Vercel, AWS, Railway, 자체 서버 |
| **Standalone** | \`output: 'standalone'\` | 위와 동일. 의존성 최소 번들 | **Docker**, Cloud Run, ECS |
| **Static Export** | \`output: 'export'\` | SSG만. **SSR·ISR·Middleware·Image 최적화 불가** | S3+CloudFront, GitHub Pages, Netlify |

\`output: 'export'\`를 골랐다가 나중에 SSR이 필요해지는 것이 흔한 실수입니다. 기능 요구사항을 먼저 확정하세요.

## 체크리스트

**1. 환경변수 — 보안 직결**

\`\`\`
NEXT_PUBLIC_*  → 빌드 시 클라이언트 번들에 인라인됨. 브라우저에 그대로 노출
그 외          → 서버에서만 접근 가능
\`\`\`

**\`NEXT_PUBLIC_\` 접두사를 API 시크릿에 붙이면 그대로 유출됩니다.** Supabase의 anon key처럼 공개가 전제된 값만 붙이고, service role key는 절대 붙이지 마세요. 또한 \`NEXT_PUBLIC_\` 값은 **빌드 타임에 고정**되므로 환경별로 재빌드가 필요합니다.

**2. 캐싱 전략 확정**
App Router의 4계층(Request Memoization / Data Cache / Full Route Cache / Router Cache)이 각각 언제 무효화되는지 정하고, \`revalidatePath\`·\`revalidateTag\`로 갱신 경로를 마련하세요. 배포 후 "데이터가 안 바뀐다"는 문제의 대부분이 여기서 나옵니다.

**3. 이미지 최적화**
\`next/image\`의 최적화는 서버 런타임을 요구합니다. 정적 export나 최적화 미지원 호스팅에서는 \`unoptimized: true\`를 켜거나 외부 이미지 CDN(Cloudinary, imgix)을 붙입니다. 외부 도메인 이미지는 \`images.remotePatterns\`에 허용 목록을 등록해야 합니다.

**4. 런타임 선택 (Node vs Edge)**
Edge는 콜드 스타트가 거의 없고 사용자 가까이서 실행되지만 **Node API·대부분의 DB 드라이버를 쓸 수 없습니다.** Middleware는 Edge에서 도는 경우가 많으므로 무거운 로직을 넣지 마세요.

**5. 보안 헤더**
\`next.config.ts\`의 \`headers()\`로 CSP, \`Strict-Transport-Security\`, \`X-Content-Type-Options\`, \`Referrer-Policy\`, \`frame-ancestors\`를 설정합니다.

**6. 관측 가능성**
에러 추적(Sentry), 로그 수집, Core Web Vitals 실사용자 측정(\`useReportWebVitals\`)을 붙이세요. 배포 후 문제를 모르는 것이 가장 큰 리스크입니다.

**7. 빌드 재현성**
Node 버전 고정(\`.nvmrc\`, \`engines\`), 락파일 커밋, CI에서 \`lint\` + \`tsc --noEmit\` + \`build\`를 게이트로 두기.

## 플랫폼 비교

| 플랫폼 | 장점 | 단점 |
| --- | --- | --- |
| **Vercel** | Next.js 제작사. ISR·Image·Edge·프리뷰 배포가 무설정으로 동작 | 트래픽·함수 실행량 기준 과금이 급증할 수 있음. 벤더 종속 |
| **Cloudflare Pages/Workers** | 저렴, 글로벌 엣지 | Node 호환 제약, 어댑터 필요 |
| **AWS (Amplify / SST / OpenNext)** | 기존 AWS 인프라와 통합, 비용 통제 | 설정 복잡도 높음 |
| **Docker + Cloud Run / ECS** | 이식성, 벤더 중립, 비용 예측 가능 | ISR·이미지 최적화를 직접 챙겨야 함 |
| **Netlify** | 간편, 어댑터 성숙 | 일부 최신 기능 지연 지원 |
| **정적 호스팅(S3/GH Pages)** | 가장 저렴 | SSG 전용 |

## 실무 판단

- **팀이 작고 빠르게 가야 한다 → Vercel.** 설정에 쓸 시간을 제품에 쓰는 것이 대체로 이깁니다
- **비용이 예측 가능해야 하거나 사내 인프라 정책이 있다 → Docker(standalone) + Cloud Run/ECS.** \`output: 'standalone'\`이 이 시나리오를 위해 존재합니다
- **완전 정적 사이트 → export + CDN**

> 이 저장소는 \`vercel.json\`이 있는 것으로 보아 Vercel 배포를 전제로 합니다. 모노레포이므로 프로젝트별 Root Directory 설정과 Turborepo 원격 캐시를 함께 확인하세요.`,
    sub_category: '배포',
    difficulty: 'medium',
    tags: ['배포', 'Vercel', 'standalone', '환경변수', '캐싱'],
  },
];

// ============================================================
// cat-7 브라우저
// ============================================================

const BROWSER = [
  {
    id: 'q-209',
    question: 'Base64 인코딩이란 무엇인가요?',
    answer: `Base64는 **바이너리 데이터를 ASCII 문자 64개(A–Z, a–z, 0–9, +, /)로만 표현하는 인코딩 방식**입니다. 텍스트만 안전하게 통과하는 채널(이메일, JSON, URL, HTML 속성)로 바이너리를 실어 나르기 위해 만들어졌습니다.

## 동작 원리

3바이트(24비트)를 6비트씩 4조각으로 쪼개고, 각 6비트(0~63)를 문자표에 매핑합니다.

\`\`\`
"Man" → 01001101 01100001 01101110
      → 010011 010110 000101 101110
      → 19     22     5      46
      → M      W      F      u        →  "TWFu"
\`\`\`

3의 배수가 아니면 \`=\`로 패딩합니다.

**핵심 특성: 크기가 약 33% 증가합니다** (3바이트 → 4문자). 이것이 성능 판단의 기준점입니다.

## 암호화가 아닙니다 — 가장 중요한 포인트

Base64는 **누구나 즉시 되돌릴 수 있는 인코딩**입니다. 보안 기능이 전혀 없습니다.

\`\`\`js
atob('cGFzc3dvcmQ=')   // 'password'
\`\`\`

JWT의 헤더·페이로드도 Base64URL 인코딩일 뿐이라 **누구나 내용을 읽을 수 있습니다.** JWT의 보안은 서명(signature)에서 나오지 인코딩에서 나오지 않습니다. **JWT 페이로드에 민감 정보를 넣으면 안 되는 이유**입니다.

## JS에서 사용

\`\`\`js
btoa('hello')       // 'aGVsbG8='   binary → ASCII
atob('aGVsbG8=')    // 'hello'
\`\`\`

**한글은 그대로 넣으면 에러가 납니다.** \`btoa\`는 Latin-1(0~255)만 받습니다.

\`\`\`js
btoa('한글')   // ❌ InvalidCharacterError

// UTF-8을 거쳐야 함
const encode = (s) => btoa(String.fromCharCode(...new TextEncoder().encode(s)));
const decode = (b) => new TextDecoder().decode(Uint8Array.from(atob(b), c => c.charCodeAt(0)));
\`\`\`

## Base64URL

표준 Base64의 \`+\`, \`/\`, \`=\`는 URL에서 의미를 가지므로 치환한 변형입니다.

\`\`\`
+ → -    / → _    = → 제거
\`\`\`

JWT, OAuth state, URL 파라미터에 쓰입니다.

## 프론트엔드 실무 사용처

**1. Data URI — 작은 이미지·아이콘 인라인**

\`\`\`css
.icon { background-image: url('data:image/svg+xml;base64,PHN2Zy...'); }
\`\`\`

HTTP 요청 1회를 아끼지만 33% 커지고 **캐싱되지 않으며** CSS 파싱을 지연시킵니다. **판단 기준: 1~2KB 미만의 아이콘 정도만.** SVG라면 Base64보다 URL 인코딩이 더 작습니다.

**2. 파일 업로드 미리보기**

\`\`\`js
const reader = new FileReader();
reader.onload = () => setPreview(reader.result);   // data:image/png;base64,...
reader.readAsDataURL(file);
\`\`\`

**3. Basic 인증 헤더** — \`Authorization: Basic <base64(user:pass)>\`. 평문과 다름없으므로 반드시 HTTPS 위에서만.

**4. LLM 멀티모달 이미지 전송** — API가 Base64 입력을 받는 경우가 많습니다. 다만 33% 페이로드 증가와 토큰 비용을 고려해야 합니다.

## 성능 판단

| | Base64 인라인 | 별도 파일 |
| --- | --- | --- |
| 요청 수 | 0 | 1 |
| 크기 | +33% | 원본 |
| 캐싱 | ❌ (부모 문서와 함께) | ⭕ 독립 캐싱 |
| 병렬 다운로드 | ❌ | ⭕ |
| 렌더 블로킹 | CSS에 넣으면 ⭕ | ❌ |

**HTTP/2 이후 요청 다중화가 저렴해져 Base64 인라인의 이점이 크게 줄었습니다.** 큰 이미지를 Base64로 넣는 것은 대부분 안티패턴입니다.

> 면접 답변: "바이너리를 텍스트 채널로 안전하게 옮기는 인코딩이고, 크기가 33% 늘어납니다. **암호화가 아니라는 점**과, 그래서 JWT 페이로드가 공개 정보라는 점이 핵심입니다."`,
    sub_category: '인코딩',
    difficulty: 'easy',
    tags: ['Base64', 'Data URI', 'JWT', 'btoa', '인코딩'],
  },
  {
    id: 'q-210',
    question: '하이브리드 앱 개발에서 웹뷰와 앱이 소통할 수 있는 방법은 무엇인가요?',
    answer: `하이브리드 앱은 네이티브 셸 안에 **WebView**를 띄워 웹 콘텐츠를 보여주는 구조입니다. 웹은 카메라·푸시·생체인증 같은 네이티브 기능이 필요하고, 네이티브는 웹의 상태 변화를 알아야 하므로 **양방향 통신(브릿지)**이 필요합니다.

## 웹 → 네이티브

**Android (\`@JavascriptInterface\`)**

\`\`\`kotlin
class Bridge(val ctx: Context) {
  @JavascriptInterface
  fun openCamera(payload: String) { /* ... */ }
}
webView.addJavascriptInterface(Bridge(this), "AndroidBridge")
\`\`\`

\`\`\`js
window.AndroidBridge.openCamera(JSON.stringify({ maxSize: 5 }));
\`\`\`

**iOS (\`WKScriptMessageHandler\`)**

\`\`\`swift
config.userContentController.add(self, name: "iosBridge")
func userContentController(_ uc: WKUserContentController, didReceive message: WKScriptMessage) { }
\`\`\`

\`\`\`js
window.webkit.messageHandlers.iosBridge.postMessage({ type: 'OPEN_CAMERA' });
\`\`\`

**플랫폼 차이를 흡수하는 래퍼가 필수입니다.**

\`\`\`ts
type BridgeMessage = { type: string; payload?: unknown; requestId?: string };

function postToNative(msg: BridgeMessage) {
  const json = JSON.stringify(msg);
  if (window.AndroidBridge?.postMessage) window.AndroidBridge.postMessage(json);
  else if (window.webkit?.messageHandlers?.iosBridge) window.webkit.messageHandlers.iosBridge.postMessage(json);
  else console.warn('네이티브 브릿지 없음 — 웹 폴백 실행');
}
\`\`\`

## 네이티브 → 웹

**JS 직접 실행**

\`\`\`kotlin
webView.evaluateJavascript("window.onNativeEvent('\\{\"type\":\"PUSH\"}')", null)   // Android
\`\`\`
\`\`\`swift
webView.evaluateJavaScript("window.onNativeEvent(...)")                            // iOS
\`\`\`

웹은 전역 콜백이나 커스텀 이벤트를 노출해 둡니다.

\`\`\`ts
window.onNativeEvent = (json: string) => {
  window.dispatchEvent(new CustomEvent('native', { detail: JSON.parse(json) }));
};
\`\`\`

**React Native WebView**는 \`postMessage\` / \`onMessage\` / \`injectedJavaScript\`로 이 과정을 표준화해 줍니다.

## 요청-응답(Promise) 패턴 — 실무 필수

브릿지는 기본적으로 단방향 fire-and-forget입니다. 응답을 받으려면 **requestId로 짝을 맞춰야** 합니다.

\`\`\`ts
const pending = new Map<string, (v: unknown) => void>();
let seq = 0;

export function callNative<T>(type: string, payload?: unknown, timeout = 10_000): Promise<T> {
  const requestId = \`req-\${++seq}\`;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(requestId); reject(new Error('브릿지 타임아웃')); }, timeout);
    pending.set(requestId, (v) => { clearTimeout(timer); resolve(v as T); });
    postToNative({ type, payload, requestId });
  });
}

window.onNativeResponse = (json: string) => {
  const { requestId, data } = JSON.parse(json);
  pending.get(requestId)?.(data);
  pending.delete(requestId);
};
\`\`\`

**타임아웃은 반드시 넣으세요.** 네이티브가 응답하지 않으면 Promise가 영원히 대기합니다.

## 그 외 통신 수단

- **URL Scheme / Deep Link** — \`myapp://action?param=1\`. 레거시 방식이며 응답을 받을 수 없고 iOS에서 제약이 많습니다
- **User-Agent 커스터마이징** — 웹이 "앱 안인지" 판별하는 용도. 기능 분기에 유용
- **쿠키 / localStorage 공유** — 인증 토큰 전달에 쓰이지만 만료·동기화 문제가 있습니다

## 보안 — 여기가 핵심 위험 지점

**1. \`@JavascriptInterface\`는 웹에게 네이티브 권한을 주는 통로입니다.** XSS가 발생하면 공격자가 네이티브 API를 호출할 수 있습니다.

**2. 반드시 지킬 것**
- **오리진 검증** — 신뢰하는 도메인에서만 브릿지를 주입. \`shouldOverrideUrlLoading\`으로 외부 URL은 시스템 브라우저로 보내기
- **화이트리스트 방식** — 브릿지 메서드를 최소한으로. 범용 \`eval\`이나 파일 접근 API를 노출하지 말 것
- **입력 검증** — 웹에서 온 payload를 네이티브에서 zod급으로 검증
- **HTTPS 전용** — \`setAllowFileAccess(false)\`, mixed content 차단
- **민감 정보는 웹에 내려보내지 않기** — 토큰은 네이티브 보안 저장소(Keystore/Keychain)에 두고, 웹에는 필요한 순간만 짧게

**3. Android 하위 버전 취약점** — API 16 이하의 \`addJavascriptInterface\` 원격 코드 실행 이슈. \`minSdkVersion\`을 올려 회피합니다.

## 실무 팁

- **웹 폴백을 항상 두세요.** 같은 웹 페이지가 브라우저에서도 열릴 수 있어야 개발·테스트가 쉽습니다
- **브릿지 스펙을 타입으로 공유**하고 버전 필드를 넣으세요. 앱 스토어 심사 때문에 네이티브와 웹의 배포 주기가 다르므로, 구버전 앱에서 신규 브릿지를 호출하면 조용히 실패합니다
- **기능 감지 후 호출** — \`if (hasNativeFeature('camera'))\` 형태로 버전 협상

> 면접 답변: "Android는 \`@JavascriptInterface\`, iOS는 \`WKScriptMessageHandler\`, 반대 방향은 \`evaluateJavascript\`입니다. 실무에서 중요한 건 **플랫폼 차이를 흡수하는 래퍼**, **requestId 기반 Promise화**, **타임아웃**, 그리고 **브릿지가 XSS의 공격 표면이 된다는 보안 인식**입니다."`,
    sub_category: '하이브리드',
    difficulty: 'hard',
    tags: ['웹뷰', '하이브리드', '브릿지', 'postMessage', '보안'],
  },
  {
    id: 'q-211',
    question: '크로스 브라우징이란 무엇인가요?',
    answer: `크로스 브라우징(Cross Browsing)은 **브라우저·기기·OS가 달라도 동일하거나 동등한 사용자 경험을 제공하도록 만드는 작업**입니다. "모든 브라우저에서 픽셀까지 똑같이"가 아니라 **"어디서든 핵심 기능이 동작한다"**가 목표입니다.

## 차이가 생기는 원인

- **렌더링 엔진** — Blink(Chrome, Edge, 삼성브라우저), WebKit(Safari), Gecko(Firefox)
- **기본 스타일(UA stylesheet)** — 브라우저마다 \`margin\`, 폼 요소 외형이 다름
- **기능 지원 격차** — 신규 CSS·JS API의 도입 시점 차이
- **iOS의 특수성** — iOS의 모든 브라우저는 **내부적으로 WebKit**입니다. iOS Chrome은 Chrome이 아닙니다
- **모바일 고유 이슈** — 100vh와 주소창, 터치 이벤트, 안전영역(notch)

## 대응 전략

**1. 표준 준수 + 기능 감지**

\`\`\`js
// ❌ User-Agent 스니핑 — 위조 가능하고 유지보수 지옥
if (navigator.userAgent.includes('Safari')) { }

// ⭕ 기능 감지
if ('IntersectionObserver' in window) { }
if (CSS.supports('display', 'grid')) { }
\`\`\`

\`\`\`css
@supports (backdrop-filter: blur(8px)) { }
\`\`\`

**2. 리셋 / 노멀라이즈 CSS** — UA 기본 스타일의 차이를 제거하는 출발점.

**3. 자동 프리픽스** — Autoprefixer(PostCSS)가 \`browserslist\` 설정을 읽어 필요한 벤더 프리픽스만 붙입니다. 손으로 쓰지 마세요.

\`\`\`json
"browserslist": ["> 0.5%", "last 2 versions", "not dead"]
\`\`\`

이 설정 하나가 Babel 트랜스파일 타깃, Autoprefixer, Next.js 빌드에 동시에 적용됩니다.

**4. 트랜스파일 + 폴리필**
- **Babel/SWC** — 최신 문법을 구형 문법으로 변환
- **core-js** — 없는 API를 구현으로 채움
- 문법은 트랜스파일로, **API는 폴리필로** 해결된다는 구분이 중요합니다

**5. 점진적 향상 / 우아한 저하**
- **Progressive Enhancement** — 기본 기능을 먼저 보장하고 지원되는 환경에 향상 추가 (권장)
- **Graceful Degradation** — 최신 기준으로 만들고 구형에서 기능을 덜어냄

## 자주 만나는 실전 이슈

| 이슈 | 대응 |
| --- | --- |
| iOS Safari \`100vh\`가 주소창을 포함해 넘침 | \`100dvh\`(dynamic viewport) 사용 |
| iOS 입력 시 화면 자동 확대 | input \`font-size: 16px\` 이상 |
| Safari의 \`gap\` in flexbox (구버전) | 폴백 마진 |
| 날짜 파싱 차이 | \`new Date('2026-08-07')\` ISO 포맷만 사용 |
| 스크롤 동작 | \`-webkit-overflow-scrolling\`, \`scroll-behavior\` |
| 노치 영역 | \`env(safe-area-inset-*)\` |
| 폼 요소 외형 | \`appearance: none\` 후 직접 스타일링 |

## 검증 방법

- **caniuse.com** — 기능별 지원 현황 확인. 코드 쓰기 전에
- **BrowserStack / Sauce Labs** — 실제 기기·브라우저 원격 테스트
- **Playwright** — Chromium/WebKit/Firefox 3엔진에서 E2E 자동 실행. CI에 붙이기 가장 현실적인 방법
- **실기기 테스트** — 에뮬레이터가 못 잡는 iOS 이슈가 많습니다

## 지원 범위를 먼저 정하세요

기술 문제가 아니라 **비즈니스 판단**입니다. GA·서버 로그로 실사용자 브라우저 분포를 확인하고, 점유율 1% 미만 브라우저에 들일 비용을 계산하세요. IE는 2022년 지원 종료되어 대부분의 프로젝트에서 대상이 아닙니다.

> 면접 답변: "핵심은 **UA 스니핑이 아니라 기능 감지**, **browserslist 기반 자동화**(Autoprefixer/Babel), **점진적 향상**입니다. 그리고 '모든 브라우저에서 똑같이'가 아니라 '지원 범위를 정하고 그 안에서 동등한 경험'을 목표로 잡는 게 실무적입니다."`,
    sub_category: '호환성',
    difficulty: 'medium',
    tags: ['크로스브라우징', '폴리필', 'browserslist', '기능감지', 'Playwright'],
  },
];

// ============================================================
// cat-10 보안
// ============================================================

const SECURITY = [
  {
    id: 'q-212',
    question: '서버리스 함수로 API 키와 같은 민감한 정보를 어떻게 관리할까요?',
    answer: `## 대전제 — 클라이언트에 보낸 순간 비밀이 아닙니다

번들 난독화, 환경변수 주입, localStorage 저장 모두 **비밀 유지 수단이 아닙니다.** 브라우저 개발자도구 Network 탭과 소스맵으로 전부 드러납니다. 유일한 해법은 **비밀을 클라이언트에 보내지 않는 것**입니다.

## 프록시 패턴 — 기본 구조

\`\`\`
브라우저 → (키 없음) → 서버리스 함수 → (키 첨부) → 외부 API
\`\`\`

\`\`\`ts
// app/api/weather/route.ts  (서버에서만 실행)
export async function GET(req: Request) {
  const city = new URL(req.url).searchParams.get('city');
  if (!city) return Response.json({ error: 'city 필요' }, { status: 400 });

  const res = await fetch(\`https://api.weather.com?q=\${encodeURIComponent(city)}&key=\${process.env.WEATHER_API_KEY}\`);
  if (!res.ok) return Response.json({ error: '조회 실패' }, { status: 502 });

  const data = await res.json();
  return Response.json({ temp: data.temp, desc: data.desc });   // 필요한 필드만 반환
}
\`\`\`

브라우저는 \`/api/weather?city=seoul\`만 호출하며 키를 알 수 없습니다.

## Next.js 환경변수 규칙 — 사고의 단골 원인

\`\`\`
NEXT_PUBLIC_*  → 빌드 시 클라이언트 번들에 문자열로 인라인됨 (완전 공개)
그 외          → 서버 런타임에서만 접근 가능
\`\`\`

**\`NEXT_PUBLIC_\`을 시크릿에 붙이는 순간 유출입니다.** Supabase의 \`anon key\`처럼 **공개가 설계 전제인 값**만 붙이고(이 경우 RLS가 실제 방어선), \`SUPABASE_SERVICE_ROLE_KEY\`는 절대 붙이면 안 됩니다.

## 반드시 지킬 것들

**1. 저장 위치**
- \`.env.local\`은 **\`.gitignore\`에 등록**하고 절대 커밋하지 않습니다
- 실제 값은 플랫폼 시크릿 스토어에 둡니다(Vercel Environment Variables, AWS Secrets Manager, GitHub Actions Secrets)
- 저장소에는 \`.env.local.example\`에 **키 이름만** 남깁니다

**2. 프록시를 오픈 프록시로 만들지 말 것**
키를 숨겨도 **엔드포인트 자체가 무료 API 게이트웨이가 되면** 요금 폭탄을 맞습니다. 반드시 함께 구현하세요:
- **인증·인가** — 로그인 사용자만, 그리고 본인 리소스만
- **레이트 리밋** — IP·사용자 단위 (Upstash Redis 등)
- **입력 검증** — zod로 파라미터 화이트리스트
- **응답 최소화** — 외부 API 응답을 그대로 흘려보내지 말고 필요한 필드만
- **CORS 제한** — 허용 오리진 명시

**3. 로그에 비밀을 남기지 말 것**
\`console.log(process.env)\`, 에러 객체에 담긴 요청 URL(쿼리에 키가 있으면), Sentry 컨텍스트 모두 유출 경로입니다. 키는 **쿼리스트링이 아니라 헤더**로 보내세요.

**4. 유출 시 대응 — 순서**
1. **즉시 키 폐기(revoke) 후 재발급.** 커밋을 지우는 것이 먼저가 아닙니다
2. Git 히스토리 정리(\`git filter-repo\`, BFG). 단 이미 클론된 사본은 회수 불가
3. 해당 키의 접근 로그 확인
4. 재발 방지 — pre-commit 시크릿 스캐너(gitleaks, trufflehog), GitHub Secret Scanning 활성화

**5. 회전(rotation)과 최소 권한**
- 키에 **필요한 스코프만** 부여하고 가능하면 IP·도메인 제한을 겁니다
- 주기적으로 회전하고, 회전이 가능하도록 코드에서 키를 한 곳에서만 읽게 만듭니다
- 장기 정적 키보다 **단기 토큰 발급**(STS, OIDC)이 가능하면 그쪽이 낫습니다

## 특수 케이스

**클라이언트가 외부 서비스에 직접 연결해야 할 때** (S3 업로드, 실시간 스트리밍)
→ 서버가 **단기 유효 자격증명**을 발급합니다: presigned URL, 짧은 TTL의 임시 토큰. 영구 키를 내려보내지 않습니다.

**서드파티 SDK가 공개 키를 요구할 때** (Stripe publishable key, Google Maps key)
→ 설계상 공개 키입니다. 대신 **서비스 콘솔에서 도메인·리퍼러 제한**을 반드시 걸어 남용을 막습니다.

**LLM API 호출** — 특히 위험합니다. 키가 유출되면 즉시 비용이 발생합니다. 반드시 서버 프록시 + 사용자별 쿼터 + 스트리밍 릴레이 구조로 만드세요.

> 면접 답변: "비밀은 서버 경계 안에만 둡니다. 서버리스 함수를 프록시로 두고 클라이언트는 키 없는 자체 엔드포인트만 호출하게 합니다. 다만 **프록시가 오픈 게이트웨이가 되지 않도록 인증·레이트 리밋·입력 검증이 세트**로 들어가야 하고, \`NEXT_PUBLIC_\` 접두사의 의미를 정확히 아는 게 중요합니다."`,
    sub_category: '시크릿 관리',
    difficulty: 'medium',
    tags: ['API 키', '서버리스', '환경변수', '프록시', '레이트리밋'],
  },
  {
    id: 'q-213',
    question: '프런트엔드 영역에서 발생할 수 있는 웹 사이트의 보안 위협은 어떤 것이 있을까요?',
    answer: `## 1. XSS (Cross-Site Scripting) — 프론트엔드 최대 위협

공격자의 스크립트가 피해자 브라우저에서 **우리 오리진의 권한으로** 실행됩니다. 쿠키·토큰 탈취, 화면 위조, 요청 위조가 모두 가능합니다.

- **Stored** — DB에 저장된 스크립트가 다른 사용자에게 전달 (게시글, 댓글, 프로필)
- **Reflected** — URL 파라미터가 그대로 화면에 출력
- **DOM-based** — 서버를 거치지 않고 클라이언트 JS가 위험한 싱크에 값을 넣음

**방어**
- 출력 시 컨텍스트에 맞는 이스케이프 (React/Vue의 기본 보간이 HTML 컨텍스트를 처리)
- \`dangerouslySetInnerHTML\`·\`v-html\`·\`innerHTML\` 사용 시 **DOMPurify** 통과
- **CSP** 헤더로 인라인 스크립트 차단 (nonce 기반)
- 쿠키에 **HttpOnly** → JS가 토큰을 읽지 못하게

## 2. CSRF (Cross-Site Request Forgery)

사용자가 로그인된 상태를 이용해 다른 사이트에서 요청을 위조합니다.

**방어**: \`SameSite=Lax|Strict\` 쿠키(기본 방어), CSRF 토큰, \`Origin\`/\`Referer\` 검증. **Authorization 헤더 기반 인증은 자동 전송되지 않아 구조적으로 CSRF에 강합니다.**

## 3. 민감 정보 노출

- **번들에 시크릿 포함** — \`NEXT_PUBLIC_\` 오용, 하드코딩된 키
- **소스맵을 프로덕션에 배포** — 원본 코드와 주석 노출
- **API 과다 응답** — 사용자 목록에 이메일·전화번호·해시가 함께 내려옴 (프론트에서 안 보여줘도 Network 탭에는 보임)
- **에러 메시지에 스택 트레이스·내부 경로**

## 4. 안전하지 않은 토큰 저장

| 저장소 | XSS | CSRF | 평가 |
| --- | --- | --- | --- |
| \`localStorage\` | ❌ 취약 | 안전 | JS로 읽히므로 XSS 한 번에 전부 탈취 |
| \`sessionStorage\` | ❌ 취약 | 안전 | 동일 |
| **HttpOnly 쿠키** | ⭕ 안전 | SameSite로 방어 | **권장** |
| 메모리(변수) | 비교적 안전 | 안전 | 새로고침 시 소실 |

**권장 조합**: Access Token은 메모리, Refresh Token은 \`HttpOnly; Secure; SameSite=Lax\` 쿠키.

## 5. 클릭재킹 (Clickjacking)

투명 iframe으로 우리 사이트를 덮어 사용자가 의도치 않은 버튼을 누르게 합니다.
**방어**: \`Content-Security-Policy: frame-ancestors 'none'\` (또는 \`X-Frame-Options: DENY\`).

## 6. 공급망 공격 (Supply Chain)

- **악성 npm 패키지** — 타이포스쿼팅(\`reakt\`), 계정 탈취된 인기 패키지에 악성 코드 삽입
- **CDN 변조** — 서드파티 스크립트가 바뀜
- **의존성 취약점** — 오래된 패키지의 알려진 CVE

**방어**: 락파일 커밋, \`npm audit\`/Dependabot, CDN 스크립트에 **SRI(Subresource Integrity)**, 새 의존성 추가 전 실재·유지보수 상태 확인.

## 7. 오픈 리다이렉트

\`\`\`js
// ❌ ?next=https://evil.com 으로 피싱 사이트 이동
router.push(searchParams.get('next'));
\`\`\`
**방어**: 리다이렉트 대상을 화이트리스트 검증하거나 **상대 경로만 허용**.

## 8. 프로토타입 오염 (Prototype Pollution)

사용자 입력으로 \`__proto__\`를 조작해 모든 객체의 동작을 바꿉니다. 깊은 병합(deep merge) 유틸이 주요 진입점입니다.
**방어**: \`Object.create(null)\`, 키 검증, 검증된 라이브러리 사용.

## 9. 정규식 DoS (ReDoS)

백트래킹이 폭발하는 정규식에 긴 입력을 주면 메인 스레드가 멈춥니다. 사용자 입력 검증 정규식에 중첩 수량자(\`(a+)+\`)를 쓰지 마세요.

## 10. 그 외

- **CORS 설정 오류** — \`Access-Control-Allow-Origin: *\` + \`credentials\` 조합
- **HTTPS 미적용 / Mixed Content** — 중간자 공격, 스크립트 주입
- **postMessage 오리진 미검증** — \`event.origin\` 확인 필수
- **취약한 CSP** — \`unsafe-inline\`, \`unsafe-eval\`이 있으면 CSP가 사실상 무력

## 방어 우선순위 (실무)

1. **HTTPS + 보안 헤더** (CSP, HSTS, X-Content-Type-Options, frame-ancestors) — 설정 한 번으로 광범위 방어
2. **HttpOnly + SameSite 쿠키** — 토큰 저장 전략 확정
3. **출력 이스케이프 + 입력 검증(zod)** — XSS/인젝션 근본 대응
4. **의존성 관리 자동화** — Dependabot + audit을 CI 게이트로
5. **최소 권한 응답 설계** — 서버가 필요한 필드만 내려보내기

> 중요한 관점: **프론트엔드 검증은 UX이지 보안이 아닙니다.** 클라이언트 코드는 사용자가 전부 통제할 수 있으므로 모든 검증은 **서버에서 다시** 해야 합니다. 프론트엔드의 보안 책임은 "브라우저 안에서 벌어지는 공격(XSS·클릭재킹·토큰 탈취)"과 "비밀을 클라이언트에 보내지 않는 것"에 집중됩니다.`,
    sub_category: '보안 개요',
    difficulty: 'medium',
    tags: ['XSS', 'CSRF', '클릭재킹', '공급망', '보안헤더', '토큰저장'],
  },
  {
    id: 'q-214',
    question: '서드 파티 스크립트를 추가할 때 발생할 수 있는 성능과 보안 위험은 무엇일까요?',
    answer: `분석 도구(GA, Amplitude), 광고, 챗봇, A/B 테스트, 태그 매니저 — 대부분의 서비스가 붙이지만 **우리 오리진의 전권을 남에게 주는 행위**입니다.

## 보안 위험

**1. 우리 오리진의 모든 권한을 갖습니다**
서드파티 스크립트는 우리 페이지에서 실행되므로:
- DOM 전체 읽기·조작 (입력 폼 값, 결제 정보)
- **HttpOnly가 아닌 쿠키**와 \`localStorage\` 접근
- 우리 오리진 이름으로 API 호출 (세션 쿠키 자동 첨부)
- 사용자 몰래 다른 스크립트 추가 로드

**2. 공급망 공격 (Magecart)**
공격자가 서드파티 CDN이나 벤더 계정을 침해해 스크립트를 변조하면, **우리는 코드를 한 줄도 안 바꿨는데** 결제 정보가 유출됩니다. 실제로 브리티시 에어웨이·티켓마스터 등의 대형 유출 사고가 이 방식이었습니다(공개된 사건 사례 기준).

**3. 태그 매니저의 위험**
GTM은 **개발자 배포 없이 마케터가 임의 JS를 프로덕션에 주입**할 수 있는 통로입니다. 편의성이 곧 리스크이며, 코드 리뷰·CI를 우회합니다.

**4. 개인정보·규제 리스크**
서드파티가 수집하는 데이터가 개인정보처리방침에 없거나, 국외 이전 동의가 없으면 문제가 됩니다. **국내는 개인정보보호법상 수집·이용 동의와 국외이전 고지 의무가 있으므로, 도입 전 법무·개인정보 담당 검토가 필요합니다.** (이 부분은 실제 서비스 성격·수집 항목에 따라 판단이 달라지므로 단정하기 어렵습니다.)

## 성능 위험

**1. 메인 스레드 점유**
서드파티 JS 파싱·실행은 우리 코드와 같은 스레드를 씁니다. **INP·TBT가 직접 악화**됩니다.

**2. 렌더 블로킹**
\`<head>\`에 일반 \`<script>\`로 넣으면 HTML 파싱이 멈춥니다.

**3. 네트워크 워터폴**
스크립트가 또 다른 스크립트를 부르는 연쇄가 흔합니다. 태그 매니저 하나가 10개 스크립트를 끌어오는 경우도 있습니다.

**4. 통제 불가능한 가용성**
서드파티 서버가 느리거나 죽으면 우리 페이지가 함께 느려집니다. **SLA가 없습니다.**

**5. 레이아웃 시프트(CLS)**
광고·챗봇 위젯이 나중에 삽입되며 콘텐츠를 밀어냅니다.

## 대응 방법

**로딩 전략 — Next.js \`next/script\`**

\`\`\`tsx
import Script from 'next/script';

<Script src="https://analytics.example.com/a.js" strategy="afterInteractive" />
<Script src="https://chat.example.com/w.js" strategy="lazyOnload" />
\`\`\`

| strategy | 시점 | 용도 |
| --- | --- | --- |
| \`beforeInteractive\` | 하이드레이션 전 | 봇 탐지, 폴리필 (꼭 필요할 때만) |
| \`afterInteractive\` | 하이드레이션 직후 (기본) | 분석 도구 |
| \`lazyOnload\` | 유휴 시간 | 챗봇, 위젯 |
| \`worker\` (실험적) | Web Worker | Partytown 기반 |

**보안 통제**

\`\`\`html
<!-- SRI: 파일이 변조되면 실행 거부 -->
<script src="https://cdn.example.com/lib.js"
        integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC"
        crossorigin="anonymous"></script>
\`\`\`

**주의**: SRI는 **버전 고정된 파일**에만 유효합니다. GA처럼 내용이 계속 바뀌는 스크립트에는 쓸 수 없습니다 — 그런 스크립트는 애초에 SRI로 보호가 안 된다는 뜻이고, 그만큼 신뢰에 의존한다는 의미입니다.

\`\`\`
Content-Security-Policy:
  script-src 'self' https://trusted-cdn.com;
  connect-src 'self' https://api.trusted.com;
\`\`\`

CSP로 **허용된 출처만** 스크립트를 로드·통신하게 제한합니다. \`connect-src\`까지 걸어야 데이터 유출 채널을 막을 수 있습니다.

**격리**
- **Partytown** — 서드파티 스크립트를 Web Worker로 옮겨 메인 스레드를 비웁니다. GA 같은 분석 도구에 효과적
- **iframe + sandbox** — 위젯을 별도 오리진으로 격리. 가장 강한 격리이지만 통합이 어려움
- **서버사이드 태깅** — 브라우저 대신 서버가 분석 데이터를 전송. 스크립트를 아예 없앰

## 도입 체크리스트

1. **정말 필요한가** — 이미 있는 도구와 중복되지 않는가
2. **자체 구현으로 대체 가능한가** — 간단한 이벤트 수집이라면 직접 만드는 것이 가볍고 안전
3. 벤더의 보안·가용성 이력, 스크립트 크기
4. **CSP·SRI 적용 가능 여부**
5. 로딩 전략 결정 (\`lazyOnload\`가 기본, 예외를 정당화)
6. **도입 전후 Lighthouse·RUM 지표 비교** — 숫자로 비용을 확인
7. 수집 데이터와 개인정보처리방침 정합성
8. **제거 조건과 담당자 지정** — 안 쓰는 스크립트가 몇 년째 남아 있는 것이 가장 흔한 문제

> 면접 답변: "서드파티 스크립트는 **우리 오리진의 전권을 주는 것**이라 XSS와 동등한 위험을 상시 안고 가는 셈입니다. 성능은 \`next/script\` 전략과 Partytown으로, 보안은 **CSP + SRI + 최소 도입 원칙**으로 관리하고, 도입 전후를 RUM으로 측정해 비용을 숫자로 확인하는 게 실무 방식입니다."`,
    sub_category: '서드파티',
    difficulty: 'medium',
    tags: ['서드파티', 'CSP', 'SRI', 'Partytown', '공급망', '성능'],
  },
];

// ============================================================
// cat-13 디자인패턴
// ============================================================

const PATTERN = [
  {
    id: 'q-215',
    question: '마이크로 프런트엔드 아키텍처가 무엇이고 도입했을 때의 장점과 단점을 설명할 수 있나요?',
    answer: `마이크로 프론트엔드(MFE)는 **마이크로서비스 개념을 프론트엔드에 적용해, 하나의 웹 애플리케이션을 독립적으로 개발·배포 가능한 여러 조각으로 나누는 아키텍처**입니다.

\`\`\`
[Shell / Host]
 ├─ 검색 팀   → search-app   (React)
 ├─ 상품 팀   → catalog-app  (React)
 ├─ 결제 팀   → checkout-app (Vue)
 └─ 계정 팀   → account-app
\`\`\`

핵심 원칙은 **"팀 단위의 독립 배포"**입니다. 기술적 분할이 아니라 **조직 구조(Conway의 법칙)에 코드를 맞추는 것**이 목적입니다.

## 구현 방식

| 방식 | 설명 | 특징 |
| --- | --- | --- |
| **Module Federation** (Webpack 5 / Rspack) | 런타임에 다른 앱의 모듈을 동적 로드 | 가장 널리 쓰임. 의존성 공유 가능 |
| **iframe** | 완전 격리 | 가장 단순·안전하지만 UX·통신 제약 큼 |
| **Web Components** | 커스텀 엘리먼트로 캡슐화 | 프레임워크 중립 |
| **빌드 타임 통합** | npm 패키지로 조합 | 독립 배포 불가 → MFE의 본래 목적 상실 |
| **서버 사이드 조합 (ESI/SSI)** | 서버에서 HTML 조각 합성 | SEO·초기 로딩 유리 |
| **라우팅 기반** (single-spa) | 경로별로 다른 앱 마운트 | 전환이 명확 |

## 장점

- **독립 배포** — 팀별로 배포 주기를 가짐. 결제 팀 배포가 검색 팀을 막지 않음
- **팀 자율성** — 코드 소유권이 명확하고 리뷰·온보딩 범위가 좁아짐
- **점진적 마이그레이션** — 레거시(Angular.js)를 한 번에 갈아엎지 않고 화면 단위로 교체 가능. **MFE의 가장 설득력 있는 도입 명분**
- **장애 격리** — 한 조각이 죽어도 나머지가 살아 있게 설계 가능
- **기술 스택 선택 자유** — 다만 이건 대체로 **함정**입니다(아래 참조)

## 단점 — 훨씬 무겁습니다

**1. 번들 중복**
각 앱이 React를 따로 번들하면 사용자가 React를 여러 번 내려받습니다. Module Federation의 \`shared\` 설정으로 완화하지만 **버전이 다르면 결국 중복**됩니다. 전체 번들 크기가 모놀리식보다 커지는 경우가 흔합니다.

**2. 운영 복잡도 폭증**
저장소·CI/CD·모니터링·에러 추적이 앱 수만큼 늘어납니다. 통합 환경에서만 재현되는 버그의 디버깅이 어렵습니다.

**3. UI 일관성 붕괴**
팀마다 만들면 버튼이 5종류가 됩니다. **강력한 디자인 시스템이 전제 조건**이며, 그 자체가 별도의 조직적 투자입니다.

**4. 앱 간 통신·상태 공유**
전역 상태를 공유하려면 커스텀 이벤트, 공유 스토어, URL 등 별도 계약이 필요합니다. 결합을 줄이려 나눴는데 통신 레이어에서 다시 결합됩니다.

**5. 성능 저하**
런타임 조합에 따른 추가 네트워크 요청, 늦은 로딩, 중복 실행. 초기 로딩(LCP)이 나빠지기 쉽습니다.

**6. "기술 스택 자유"는 대체로 함정**
React와 Vue를 섞으면 공통 컴포넌트를 재사용할 수 없고 인력 이동도 막힙니다. 실무에서 성공한 MFE는 대부분 **스택을 하나로 통일**하고 배포만 분리합니다.

**7. 버전 스큐(skew)**
독립 배포이므로 사용자의 브라우저에 서로 다른 시점의 조각이 공존할 수 있습니다. 공유 계약의 하위 호환을 항상 지켜야 합니다.

## 언제 도입하나

**적합**
- 팀이 **여러 개**이고 배포 병목이 실제로 발생하고 있을 때
- 대규모 레거시를 점진적으로 교체해야 할 때
- 도메인 경계가 화면상으로도 뚜렷할 때 (커머스의 검색/상품/결제)
- 인수합병 등으로 이미 별개인 시스템을 한 화면에 합쳐야 할 때

**부적합**
- **팀이 하나이거나 개발자가 10명 미만** — 얻는 것보다 잃는 것이 큽니다
- 화면 간 상태 결합이 강한 앱 (에디터, 대시보드)
- 초기 로딩 성능이 매출과 직결되는 서비스
- "모놀리식이 답답해서" 같은 감각적 이유

## 더 가벼운 대안 먼저 검토

| 문제 | MFE보다 가벼운 해법 |
| --- | --- |
| 빌드가 느리다 | **모노레포 + Turborepo/Nx** (증분 빌드·원격 캐시) |
| 코드 소유권이 불명확 | CODEOWNERS + 모듈 경계 lint (이 저장소의 FSD 경계 강제처럼) |
| 배포가 서로를 막는다 | 트렁크 기반 개발 + **피처 플래그** |
| 컴포넌트 재사용 | 공유 UI 패키지 |

**MFE는 기술 문제가 아니라 조직 문제의 해법입니다.** 조직이 나뉘어 있지 않은데 코드만 나누면 복잡도만 남습니다.

> 면접 답변: "독립 배포 가능한 단위로 프론트엔드를 나누는 아키텍처입니다. 다만 **조직이 실제로 나뉘어 있고 배포 병목이 측정 가능할 때**만 이득이고, 그 전에는 모노레포·피처 플래그 같은 가벼운 수단을 먼저 씁니다. 도입한다면 스택은 통일하고 배포만 분리하는 쪽이 현실적입니다."`,
    sub_category: '아키텍처',
    difficulty: 'hard',
    tags: ['마이크로 프론트엔드', 'Module Federation', '모노레포', '아키텍처'],
  },
];

// ============================================================
// cat-17 빌드·배포
// ============================================================

const BUILD = [
  {
    id: 'q-216',
    question: '프로젝트 빌드와 배포가 무엇인가요?',
    answer: `## 빌드(Build)

**개발용 소스 코드를 브라우저(또는 런타임)가 실행할 수 있는 최적화된 산출물로 변환하는 과정**입니다.

\`\`\`
소스 (TS, JSX, SCSS, 이미지, 다수 모듈)
  ↓ 트랜스파일 — TS/JSX → JS, 최신 문법 → 타깃 문법 (SWC, Babel, esbuild)
  ↓ 번들링 — 모듈 의존성 그래프를 따라 파일 병합 (Turbopack, Webpack, Vite/Rollup)
  ↓ 트리 셰이킹 — 사용하지 않는 export 제거
  ↓ 코드 스플리팅 — 라우트·동적 import 단위로 청크 분리
  ↓ 최소화(Minify) — 공백·주석 제거, 변수명 축약
  ↓ 에셋 처리 — 이미지 최적화, CSS 추출, 폰트 서브셋
  ↓ 해싱 — main.a3f9c2.js (콘텐츠 해시 → 장기 캐싱 + 즉시 무효화)
  ↓ 소스맵 생성
산출물 (.next/, dist/)
\`\`\`

**해싱이 중요한 이유**: 파일명에 콘텐츠 해시가 들어가면 \`Cache-Control: max-age=31536000, immutable\`로 1년 캐싱해도 안전합니다. 내용이 바뀌면 파일명이 바뀌어 자동으로 새로 받습니다.

## 배포(Deploy)

**빌드 산출물을 사용자가 접근 가능한 환경에 올려 서비스하는 과정**입니다.

\`\`\`
빌드 산출물
  ↓ 아티팩트 저장 (레지스트리, S3, 컨테이너 이미지)
  ↓ 환경 설정 주입 (환경변수, 시크릿)
  ↓ 배포 실행
  ↓ 헬스체크
  ↓ 트래픽 전환
  ↓ 모니터링 / 필요 시 롤백
\`\`\`

## 배포 전략

| 전략 | 방식 | 특징 |
| --- | --- | --- |
| **Rolling** | 인스턴스를 순차 교체 | 무중단, 두 버전 공존 |
| **Blue-Green** | 새 환경 구축 후 트래픽 일괄 전환 | 롤백이 즉시. 인프라 2배 |
| **Canary** | 5% → 25% → 100% 점진 노출 | 위험 최소화. 모니터링 필수 |
| **Feature Flag** | 배포와 릴리스를 분리 | 코드는 나가되 기능은 꺼둠. 가장 유연 |

**배포(deploy)와 릴리스(release)는 다릅니다.** 피처 플래그를 쓰면 코드를 프로덕션에 올려두고도 기능은 나중에 켤 수 있어, 배포 리스크가 크게 줄어듭니다.

## CI/CD

- **CI (지속적 통합)** — 커밋마다 자동으로 lint → 타입체크 → 테스트 → 빌드. **깨진 코드가 main에 들어가는 것을 막는 게이트**
- **CD (지속적 배포/전달)** — 통과한 산출물을 자동으로 배포

\`\`\`yaml
# 전형적인 게이트
- pnpm lint
- pnpm tsc --noEmit
- pnpm test
- pnpm build
- deploy (main 브랜치만)
\`\`\`

## 환경 분리

\`\`\`
local → development → staging → production
\`\`\`

**staging은 production과 최대한 동일해야** 의미가 있습니다. 환경별 차이는 환경변수로만 두고 코드 분기를 최소화하세요.

## 개발 빌드 vs 프로덕션 빌드

| | 개발 | 프로덕션 |
| --- | --- | --- |
| 속도 | 빠른 HMR 우선 | 최적화 우선 |
| 소스맵 | 전체 | 없음 또는 **비공개 업로드**(Sentry) |
| 최소화 | ❌ | ⭕ |
| 경고 코드 | 포함 (React dev warnings) | 제거 |

**프로덕션에 소스맵을 공개 배포하면 원본 코드가 그대로 노출됩니다.** 에러 추적이 필요하면 Sentry 등에 업로드만 하고 공개 경로에는 두지 마세요.

## 모노레포에서의 빌드

이 저장소처럼 Turborepo를 쓰면 **의존성 그래프 기반 증분 빌드 + 캐시**가 적용됩니다. 바뀌지 않은 패키지는 캐시에서 꺼내므로 CI 시간이 크게 줄어듭니다.

\`\`\`bash
pnpm build              # turbo run build — 전체
pnpm --filter hub build # 특정 앱만
\`\`\`

> 면접 답변: "빌드는 **소스를 실행 가능한 최적화 산출물로 바꾸는 것**, 배포는 **그 산출물을 사용자에게 도달시키는 것**입니다. 실무에서 중요한 건 CI 게이트로 품질을 강제하는 것, 콘텐츠 해싱으로 캐싱 전략을 세우는 것, 그리고 **배포와 릴리스를 분리**해 롤백 가능성을 확보하는 것입니다."`,
    sub_category: '빌드',
    difficulty: 'easy',
    tags: ['빌드', '배포', 'CI/CD', '번들링', '피처플래그'],
  },
  {
    id: 'q-217',
    question: '번들러를 사용하는 이유는 무엇인가요?',
    answer: `번들러는 **여러 모듈과 에셋을 의존성 그래프로 분석해 최적화된 소수의 파일로 묶는 도구**입니다. Webpack, Vite(Rollup), esbuild, Turbopack, Rspack, Parcel이 대표적입니다.

## 왜 필요한가

**1. 모듈 시스템 해결 (역사적 출발점)**
브라우저에 모듈 개념이 없던 시절, 전역 스코프 오염과 스크립트 로딩 순서 문제가 심각했습니다. 번들러가 CommonJS/AMD/ESM을 하나로 합쳐 이를 해결했습니다.

**2. 네트워크 요청 수 감소**
수백 개 모듈을 개별 파일로 내려받으면 HTTP/1.1에서는 치명적이었습니다. HTTP/2의 다중화로 완화됐지만, **요청마다 오버헤드(헤더·우선순위 협상)는 여전히** 있고 수천 개 단위에서는 문제가 됩니다.

**3. 트랜스파일 통합** — TS/JSX/최신 문법을 타깃 브라우저용으로 변환

**4. 트리 셰이킹** — 사용하지 않는 export 제거. ESM의 정적 구조 덕분에 가능합니다. CommonJS는 동적이라 트리 셰이킹이 어렵습니다

**5. 코드 스플리팅** — 라우트·동적 \`import()\` 단위로 청크를 나눠 **필요한 것만** 로드

\`\`\`js
const Chart = lazy(() => import('./Chart'));   // 이 컴포넌트가 필요할 때만 다운로드
\`\`\`

**6. 에셋 처리** — 이미지·폰트·CSS를 모듈처럼 import하고, 최적화·해싱까지 파이프라인에 포함

**7. 개발 경험(DX)** — HMR(상태를 유지한 채 모듈 교체), 소스맵, 개발 서버

**8. 프로덕션 최적화** — 최소화, 압축(gzip/brotli), 청크 이름 해싱, 환경변수 치환(dead code elimination)

## 브라우저가 ESM을 지원하는데 왜 아직 필요한가

\`<script type="module">\`로 번들 없이 실행할 수는 있지만:
- **네트워크 폭포** — 모듈이 다른 모듈을 import하는 연쇄가 요청 라운드트립으로 이어짐. 깊이가 깊으면 치명적
- **트리 셰이킹·최소화 없음**
- **npm 패키지 대부분이 CommonJS**이거나 bare import(\`import x from 'react'\`)를 씁니다. 브라우저는 이를 해석하지 못합니다(import map으로 일부 해결 가능)
- TS/JSX 변환 필요

**Vite의 접근**: 개발 중에는 네이티브 ESM으로 번들 없이 즉시 서빙(빠른 시작), **프로덕션은 Rollup으로 번들**합니다. 두 요구를 분리한 것입니다.

## 도구 비교

| 도구 | 언어 | 특징 |
| --- | --- | --- |
| **Webpack** | JS | 가장 성숙, 플러그인 생태계 최대. 느림 |
| **Vite** | JS + esbuild/Rollup | 개발 서버가 매우 빠름. 현재 SPA 기본 선택 |
| **esbuild** | Go | 압도적으로 빠름. 기능은 제한적 |
| **SWC** | Rust | Babel 대체 트랜스파일러. Next.js 기본 |
| **Turbopack** | Rust | Next.js용. 증분 계산 기반 |
| **Rspack** | Rust | Webpack 호환 API + 속도 |
| **Rollup** | JS | 라이브러리 배포에 강함(깔끔한 출력) |

**라이브러리를 만든다면 Rollup/tsup**, **앱을 만든다면 Vite/Next(Turbopack)**가 일반적인 선택입니다.

## 실무에서 신경 쓸 것

**번들 분석 습관화**
\`\`\`bash
ANALYZE=true pnpm build   # @next/bundle-analyzer
npx vite-bundle-visualizer
\`\`\`
"왜 이 페이지가 800KB인가"를 시각적으로 확인하면 대개 특정 라이브러리 하나가 범인입니다(moment, lodash 전체 import, 아이콘 팩 전체).

**흔한 번들 비대화 원인**
\`\`\`js
import _ from 'lodash';           // ❌ 전체
import debounce from 'lodash-es/debounce';  // ⭕
import * as Icons from 'react-icons';       // ❌
\`\`\`

**\`sideEffects: false\`** — package.json에 선언하면 번들러가 더 공격적으로 트리 셰이킹합니다. 단 CSS import 같은 부수효과가 있으면 배열로 예외를 명시해야 합니다.

> 면접 답변: "출발점은 모듈 시스템과 요청 수 문제였지만, 지금은 **트리 셰이킹·코드 스플리팅·에셋 최적화·DX**가 더 큰 이유입니다. 브라우저가 ESM을 지원해도 npm 생태계의 CommonJS·bare import와 네트워크 폭포 때문에 프로덕션 번들은 여전히 필요합니다."`,
    sub_category: '번들러',
    difficulty: 'medium',
    tags: ['번들러', 'Webpack', 'Vite', '트리셰이킹', '코드스플리팅'],
  },
  {
    id: 'q-218',
    question: 'package.json 파일의 주요 필드와 역할을 설명할 수 있나요?',
    answer: `\`package.json\`은 Node.js 프로젝트의 **매니페스트**로, 메타데이터·의존성·스크립트·모듈 해석 규칙을 담습니다.

## 기본 메타데이터

\`\`\`jsonc
{
  "name": "@scope/pkg",        // npm 배포 시 유일해야 함
  "version": "1.2.3",          // SemVer: MAJOR.MINOR.PATCH
  "private": true,             // ⭐ 실수로 npm에 배포되는 것을 막음. 앱은 반드시 true
  "type": "module",            // "module" = ESM 기본, 없거나 "commonjs" = CJS
  "license": "MIT",
  "packageManager": "pnpm@9.12.1"  // Corepack이 이 버전을 강제
}
\`\`\`

## 의존성 4종 — 구분이 면접 포인트

| 필드 | 설치 시점 | 용도 |
| --- | --- | --- |
| \`dependencies\` | 프로덕션 포함 | 런타임에 필요 (react, zod) |
| \`devDependencies\` | 개발만 | 빌드·테스트 도구 (typescript, vitest, eslint) |
| \`peerDependencies\` | **설치 안 함**. 호스트가 제공 | 라이브러리가 "react 18 이상 필요" 선언 |
| \`optionalDependencies\` | 실패해도 설치 진행 | 플랫폼별 바이너리 |

**\`peerDependencies\`가 중요한 이유**: 라이브러리가 React를 \`dependencies\`에 넣으면 앱과 **React 인스턴스가 두 개**가 되어 훅이 깨집니다. 그래서 플러그인·컴포넌트 라이브러리는 반드시 peer로 선언합니다.

**주의**: 번들러가 \`devDependencies\`도 번들에 포함시킬 수 있으므로 "dev에 넣으면 번들에서 빠진다"는 오해는 금물입니다. 구분은 **설치 시점**의 문제입니다.

## 버전 범위 표기

\`\`\`
"react": "^19.0.0"   // 캐럿: 19.x.x 허용 (MINOR·PATCH 업). 기본값
"react": "~19.0.0"   // 틸드: 19.0.x 만 (PATCH만)
"react": "19.0.0"    // 정확히 고정
"react": "*"         // 아무거나 ❌ 위험
"ui": "workspace:*"  // pnpm 워크스페이스 내부 참조
"ui": "catalog:"     // pnpm catalog 참조 (버전 단일 관리)
\`\`\`

**락파일(\`pnpm-lock.yaml\`)이 실제 설치 버전을 고정합니다.** 반드시 커밋하세요. CI에서는 \`pnpm install --frozen-lockfile\`로 락파일과 다르면 실패하게 만듭니다.

## scripts

\`\`\`jsonc
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "lint": "eslint .",
  "prepare": "husky"          // npm install 후 자동 실행 (라이프사이클 훅)
}
\`\`\`

\`pre\`/\`post\` 접두사로 자동 연쇄 실행됩니다(\`prebuild\` → \`build\` → \`postbuild\`). \`npx\` 없이 \`node_modules/.bin\`의 실행 파일을 바로 호출할 수 있습니다.

**보안 주의**: \`postinstall\` 스크립트는 **패키지 설치만으로 임의 코드가 실행되는** 공급망 공격의 주요 경로입니다. pnpm은 기본적으로 이를 제한하며, 신뢰하지 않는 패키지 설치 시 \`--ignore-scripts\`를 고려하세요.

## 배포·모듈 해석 필드 (라이브러리용)

\`\`\`jsonc
{
  "main": "./dist/index.cjs",       // CJS 진입점 (레거시)
  "module": "./dist/index.mjs",     // ESM 진입점 (비표준이나 널리 지원)
  "types": "./dist/index.d.ts",     // 타입 선언
  "exports": {                       // ⭐ 현대 표준. main/module보다 우선
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    },
    "./styles.css": "./dist/styles.css"
  },
  "files": ["dist"],                 // npm publish에 포함할 것만
  "sideEffects": false,              // 트리 셰이킹 최적화 허용
  "engines": { "node": ">=24" }      // 요구 런타임
}
\`\`\`

**\`exports\`의 중요성**: 명시하지 않은 경로는 **import 자체가 차단**됩니다. 라이브러리 내부 구현에 대한 무단 접근을 막는 캡슐화 수단입니다. \`types\` 조건은 반드시 **가장 먼저** 와야 합니다(조건 매칭이 순서대로 이루어짐).

**\`engines\` + \`engine-strict=true\`(.npmrc)** — Node 버전을 강제합니다. 이 저장소가 Node 24를 고정하는 방식입니다.

## 그 외

- **\`browserslist\`** — Autoprefixer·Babel의 타깃 결정
- **\`workspaces\`** — 모노레포 패키지 경로 (pnpm은 \`pnpm-workspace.yaml\` 사용)
- **\`prettier\`, \`eslintConfig\`** — 도구 설정 인라인화

## 이 저장소의 규칙

- 버전은 \`pnpm-workspace.yaml\`의 \`catalog:\`에서 단일 관리하고, 각 \`package.json\`은 \`"catalog:"\`로만 참조합니다. **raw 버전을 박지 않습니다**
- 워크스페이스 간 참조는 \`"workspace:*"\`
- 버전 변경은 catalog 한 곳만 수정 후 \`pnpm install\`

> 면접 답변: "핵심은 **의존성 4종의 구분**(특히 peerDependencies가 왜 필요한지), **락파일이 실제 버전을 고정한다는 점**, 그리고 **\`exports\` 필드가 현대 모듈 해석의 표준**이라는 것입니다."`,
    sub_category: '패키지 관리',
    difficulty: 'medium',
    tags: ['package.json', 'SemVer', 'peerDependencies', 'exports', 'pnpm'],
  },
];

// ============================================================
// cat-18 AI 프론트엔드
// ============================================================

const AI = [
  {
    id: 'q-219',
    question: 'LLM의 응답 지연 문제를 사용자 경험 측면에서 어떻게 해결할 수 있나요?',
    answer: `LLM 응답은 수 초에서 수십 초가 걸립니다. **지연 자체를 없앨 수 없다면, 체감 지연(perceived latency)을 줄이는 것**이 프론트엔드의 역할입니다.

## 1. 스트리밍 — 가장 효과적

전체 응답을 기다리지 않고 **첫 토큰이 오는 즉시** 화면에 표시합니다. 총 소요 시간은 같아도 체감은 완전히 달라집니다.

핵심 지표는 **TTFT(Time To First Token)**입니다. 전체 완료 시간보다 TTFT가 사용자 만족도에 훨씬 크게 기여합니다.

\`\`\`tsx
const [text, setText] = useState('');
for await (const chunk of stream) setText(prev => prev + chunk);
\`\`\`

## 2. 즉각적 피드백 (Optimistic UI)

전송 버튼을 누른 **즉시** 사용자 메시지를 목록에 추가하고 입력창을 비웁니다. 서버 왕복을 기다리지 않습니다.

\`\`\`tsx
const [optimisticMessages, addOptimistic] = useOptimistic(messages);
\`\`\`

## 3. 단계별 상태 노출

스피너 하나만 돌리지 말고 **지금 무엇을 하는지** 보여주세요. 진행 상황이 보이면 같은 시간도 짧게 느껴집니다.

\`\`\`
🔍 문서 검색 중… → 📄 3개 문서 참조 → ✍️ 답변 작성 중…
\`\`\`

RAG 파이프라인이라면 각 단계를 이벤트로 스트리밍해 표시할 수 있습니다.

## 4. 스켈레톤 · 타이핑 인디케이터

빈 화면 대신 응답이 들어올 자리를 미리 잡아두면 **CLS도 방지**됩니다.

## 5. 스트리밍 텍스트 렌더링 최적화

토큰마다 setState하면 초당 수십 번 리렌더가 발생합니다.

\`\`\`tsx
// 버퍼링 후 rAF 단위로 flush
const buffer = useRef('');
const flush = useCallback(() => { setText(t => t + buffer.current); buffer.current = ''; }, []);
// chunk 수신 시 buffer.current += chunk; requestAnimationFrame(flush)
\`\`\`

**마크다운 파싱은 특히 무겁습니다.** 스트리밍 중에는 평문으로 그리다가 완료 시 파싱하거나, 파싱 결과를 메모이제이션하세요.

## 6. 프리페칭 · 사전 연결

- 채팅 화면 진입 시 \`<link rel="preconnect">\`로 API 오리진에 미리 연결 (TLS 핸드셰이크 비용 선지불)
- 사용자가 입력을 시작하면 세션·컨텍스트를 미리 준비

## 7. 취소 가능성

**언제든 멈출 수 있다는 통제감**이 대기 스트레스를 크게 줄입니다. 정지 버튼은 필수입니다.

## 8. 모델·라우팅 전략

- 간단한 질의는 작은 모델로, 복잡한 것만 큰 모델로 라우팅
- 자주 반복되는 프롬프트는 **프롬프트 캐싱** 활용 (Anthropic·OpenAI 모두 지원)
- 동일 질의는 결과 캐싱

## 9. 백그라운드 처리 + 알림

수 분 걸리는 작업(문서 전체 분석 등)은 대기시키지 말고 백그라운드로 돌린 뒤 완료 알림을 주는 편이 낫습니다.

## 10. 실패 대비

타임아웃, 재시도(지수 백오프), 부분 응답 보존. **스트리밍 중 끊겨도 이미 받은 텍스트는 유지**해야 합니다.

## 지표로 관리하기

| 지표 | 목표 감각 |
| --- | --- |
| TTFT | 1초 이내가 이상적, 3초 넘으면 이탈 |
| 토큰 생성 속도 | 사람의 읽기 속도(~10 tok/s)보다 빠르면 체감 지연 없음 |
| 취소율 | 높으면 응답 품질 또는 속도 문제 |

> 면접 답변: "핵심은 **스트리밍으로 TTFT를 줄이는 것**입니다. 여기에 낙관적 UI, 단계별 진행 표시, 취소 버튼을 더하면 총 소요 시간이 같아도 체감이 크게 달라집니다. 그리고 스트리밍 자체가 리렌더 폭탄이 될 수 있어 버퍼링·메모이제이션으로 렌더 비용을 관리해야 합니다."`,
    sub_category: 'UX',
    difficulty: 'medium',
    tags: ['LLM', '스트리밍', 'TTFT', '낙관적 UI', '체감성능'],
  },
  {
    id: 'q-220',
    question: 'AI의 환각 현상으로 잘못 만든 UI 컴포넌트가 렌더링될 위험을 방지하는 방안은 무엇인가요?',
    answer: `LLM이 생성한 데이터로 UI를 구성할 때, 모델이 **존재하지 않는 컴포넌트 타입·잘못된 스키마·악의적 콘텐츠**를 내놓을 수 있습니다. **LLM 출력은 사용자 입력과 동일한 신뢰 수준으로 다뤄야 합니다.**

## 1. 구조화 출력 강제 (첫 번째 방어선)

자유 텍스트를 파싱하지 말고, 모델이 **스키마를 따르도록 강제**합니다.

- **Tool use / Function calling** — 모델이 정의된 도구 스키마에 맞춰 인자를 채움
- **JSON mode / Structured output** — 응답 형식을 JSON 스키마로 제약

## 2. 런타임 스키마 검증 (zod) — 필수

모델이 스키마를 따른다고 **믿지 말고 검증**하세요.

\`\`\`ts
import { z } from 'zod';

const ComponentSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), content: z.string().max(5000) }),
  z.object({ type: z.literal('chart'), data: z.array(z.object({ x: z.number(), y: z.number() })).max(500) }),
  z.object({ type: z.literal('table'), rows: z.array(z.record(z.string())).max(200) }),
]);

const result = ComponentSchema.safeParse(llmOutput);
if (!result.success) return <Fallback error={result.error} />;
\`\`\`

**\`safeParse\`를 쓰고 예외를 던지지 마세요.** 검증 실패는 예외 상황이 아니라 **예상된 경로**입니다.

## 3. 화이트리스트 렌더링 — 핵심 패턴

**동적으로 컴포넌트를 생성하지 않고, 미리 등록된 것만 매핑**합니다.

\`\`\`tsx
const REGISTRY = {
  text: TextBlock,
  chart: ChartBlock,
  table: TableBlock,
} as const;

function Renderer({ node }: { node: z.infer<typeof ComponentSchema> }) {
  const Component = REGISTRY[node.type];
  if (!Component) return <UnknownBlock />;   // 등록되지 않은 타입은 렌더 안 함
  return <Component {...node} />;
}
\`\`\`

모델이 \`type: "script"\`를 내놓아도 레지스트리에 없으므로 **아무 일도 일어나지 않습니다.**

## 4. 절대 하면 안 되는 것

\`\`\`tsx
<div dangerouslySetInnerHTML={{ __html: llmOutput }} />   // ❌ XSS
eval(llmGeneratedCode);                                    // ❌
new Function(llmOutput)();                                 // ❌
window[llmOutput.handler]();                               // ❌ 임의 함수 호출
\`\`\`

LLM 출력에 HTML이 필요하면 **DOMPurify**를 반드시 통과시키고, 허용 태그를 최소화하세요.

\`\`\`ts
DOMPurify.sanitize(html, { ALLOWED_TAGS: ['p','strong','em','ul','ol','li','code','pre','a'], ALLOWED_ATTR: ['href'] });
\`\`\`

**마크다운 렌더링도 안전하지 않습니다.** \`react-markdown\`에서 \`rehype-raw\`를 켜면 HTML이 통과하고, 링크의 \`javascript:\` 스킴도 별도 검증이 필요합니다.

## 5. 값 범위·형태 방어

스키마를 통과해도 값이 UI를 깨뜨릴 수 있습니다.
- 배열 길이 상한 (10만 행 테이블 → 브라우저 정지)
- 문자열 길이 상한
- 숫자 범위 (\`NaN\`, \`Infinity\`, 음수 크기)
- URL은 스킴 화이트리스트(\`https:\`만)

## 6. Error Boundary로 격리

검증을 통과해도 렌더 중 터질 수 있습니다. **블록 단위로 감싸** 하나가 실패해도 대화 전체가 죽지 않게 합니다.

\`\`\`tsx
<ErrorBoundary fallback={<BlockError />}>
  <Renderer node={node} />
</ErrorBoundary>
\`\`\`

## 7. 스트리밍 중 부분 JSON 처리

스트리밍하면 JSON이 중간에 잘린 상태로 도착합니다. 불완전한 상태로 파싱을 시도하다 에러가 나거나, 더 나쁘게는 **잘못 해석된 UI가 깜빡입니다.**
- 완성될 때까지 버퍼링하거나
- partial JSON 파서를 쓰되 **불완전한 블록은 렌더하지 않음**

## 8. 사람이 개입할 지점 두기

파괴적 동작(삭제, 결제, 외부 전송)은 **LLM이 결정해도 사용자가 확인**하게 합니다. 모델이 도구를 호출하면 실행 전 확인 UI를 띄우는 방식입니다.

## 9. 관측

검증 실패율, 알 수 없는 타입 발생 빈도, Error Boundary 발동 횟수를 로깅하세요. **프롬프트 회귀를 감지하는 유일한 방법**입니다.

## 방어 계층 정리

\`\`\`
① 구조화 출력 강제 (tool use / JSON schema)
② 런타임 검증 (zod safeParse)
③ 화이트리스트 매핑 (레지스트리)
④ 값 범위 제한
⑤ 새니타이징 (DOMPurify)
⑥ Error Boundary 격리
⑦ 사람 확인 게이트 (파괴적 동작)
\`\`\`

> 면접 답변: "핵심 원칙은 **LLM 출력을 신뢰하지 않는 것**입니다. 스키마 강제 → zod 검증 → 화이트리스트 렌더 → Error Boundary의 다층 방어를 쓰고, \`dangerouslySetInnerHTML\`이나 \`eval\`처럼 임의 코드를 실행하는 경로는 아예 만들지 않습니다."`,
    sub_category: '안전성',
    difficulty: 'hard',
    tags: ['환각', 'zod', '스키마검증', 'XSS', 'Error Boundary'],
  },
  {
    id: 'q-221',
    question: '생성형 AI 채팅 UI에서 중단 기능을 구현한다면 어떤 기술을 사용할 수 있나요?',
    answer: `## 핵심 도구: \`AbortController\`

Fetch API의 표준 취소 메커니즘입니다.

\`\`\`tsx
function useChat() {
  const [text, setText] = useState('');
  const [isStreaming, setStreaming] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  async function send(prompt: string) {
    controllerRef.current?.abort();               // 이전 요청 정리
    const controller = new AbortController();
    controllerRef.current = controller;
    setStreaming(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
        signal: controller.signal,                 // ⭐
      });
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setText(prev => prev + decoder.decode(value, { stream: true }));
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        // 사용자가 의도적으로 멈춤 — 에러 UI를 띄우지 않는다
      } else {
        setError(e);
      }
    } finally {
      setStreaming(false);
      controllerRef.current = null;
    }
  }

  const stop = () => controllerRef.current?.abort();
  return { text, isStreaming, send, stop };
}
\`\`\`

**\`AbortError\`를 일반 에러와 구분하는 것**이 UX상 중요합니다. 사용자가 멈춘 건데 "오류가 발생했습니다"가 뜨면 안 됩니다.

## 언마운트 정리

\`\`\`tsx
useEffect(() => () => controllerRef.current?.abort(), []);
\`\`\`

React 18 StrictMode는 개발 모드에서 effect를 두 번 실행하므로, cleanup이 없으면 요청이 중복됩니다.

## 서버 측 처리 — 여기가 핵심

**클라이언트에서 abort해도 서버가 LLM API 호출을 멈추지 않으면 토큰 비용은 계속 발생합니다.**

\`\`\`ts
// app/api/chat/route.ts
export async function POST(req: Request) {
  const upstream = await fetch(LLM_API, {
    method: 'POST',
    body: JSON.stringify(payload),
    signal: req.signal,        // ⭐ 클라이언트 연결 끊김이 상류로 전파됨
  });
  return new Response(upstream.body, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  });
}
\`\`\`

\`req.signal\`을 상류 fetch에 넘기면 클라이언트가 끊을 때 LLM 요청도 함께 취소됩니다. **비용 절감의 실질적 지점**입니다.

## 전송 방식별 중단 방법

| 방식 | 중단 방법 | 비고 |
| --- | --- | --- |
| **fetch + ReadableStream** | \`AbortController\` | **권장.** POST 가능, 헤더 자유 |
| \`EventSource\` (SSE) | \`es.close()\` | GET만 가능, 커스텀 헤더 불가 |
| **WebSocket** | \`ws.send({type:'cancel'})\` 또는 \`ws.close()\` | 양방향 필요할 때 |

\`EventSource\`는 간편하지만 POST와 헤더 제약이 커서, 실무 LLM 채팅은 대부분 **fetch + ReadableStream**을 씁니다.

## UX 세부사항

**1. 부분 응답 보존**
중단 시점까지 받은 텍스트는 **지우지 말고 유지**하세요. "중단됨" 표시와 함께 남깁니다.

\`\`\`tsx
{stopped && <span className="text-muted">— 사용자가 중단함</span>}
\`\`\`

**2. 버튼 상태 전환**
전송(▶) ↔ 중지(■)를 **같은 자리에서** 토글하면 즉시 누를 수 있습니다. 별도 버튼보다 낫습니다.

**3. 키보드 단축키** — Esc로 중단

**4. 이어서 생성** — 중단 후 "계속" 버튼으로 이어가려면 부분 응답을 컨텍스트에 포함해 재요청합니다

**5. 대화 기록 저장** — 중단된 응답도 저장할지 정책을 정하세요. 저장한다면 "미완성" 플래그를 남깁니다

**6. 새 메시지 전송 시 자동 중단** — 사용자가 답변 도중 새 질문을 하면 이전 스트림을 자동으로 끊습니다

## 주의점

- **\`reader.cancel()\`도 필요할 수 있습니다.** \`abort()\`가 fetch를 끊지만, 이미 만들어진 reader를 명시적으로 정리하면 더 안전합니다
- **여러 요청이 겹칠 때** race condition에 주의하세요. 요청마다 ID를 부여해 "현재 활성 요청의 응답만 반영"하도록 가드합니다
- **AI SDK**(Vercel)를 쓰면 \`useChat\`의 \`stop()\`이 이 전부를 처리합니다. 직접 구현 전에 검토할 만합니다

> 면접 답변: "\`AbortController\`가 표준 도구이고, \`signal\`을 fetch에 넘기면 됩니다. 실무에서 놓치기 쉬운 두 가지는 **\`AbortError\`를 일반 에러와 구분하는 것**과 **서버 라우트에서 \`req.signal\`을 상류 LLM 호출로 전파해 실제 토큰 비용을 멈추는 것**입니다."`,
    sub_category: '스트리밍',
    difficulty: 'medium',
    tags: ['AbortController', '중단', '스트리밍', 'SSE', '비용'],
  },
  {
    id: 'q-222',
    question: '길게 대화할 때 토큰 소모를 줄이는 프런트엔드 컨텍스트 관리 전략은 무엇인가요?',
    answer: `LLM API는 **매 요청마다 전체 대화 이력을 다시 보냅니다.** 대화가 길어지면 입력 토큰이 선형(사실상 누적하면 제곱)으로 증가해 비용과 지연이 함께 늘어납니다.

\`\`\`
1턴: [Q1]                        → 100 토큰
2턴: [Q1, A1, Q2]                → 500 토큰
10턴: [Q1..A9, Q10]              → 8,000 토큰   ← 매번 전부 재전송
\`\`\`

## 1. 슬라이딩 윈도우 — 가장 단순

최근 N턴만 유지합니다.

\`\`\`ts
const recent = messages.slice(-MAX_TURNS * 2);
const payload = [systemPrompt, ...recent];
\`\`\`

간단하지만 **초반 맥락이 통째로 사라집니다.** 사용자가 "아까 말한 그거"라고 하면 실패합니다.

## 2. 요약 압축 (Summarization)

오래된 대화를 요약본으로 대체합니다.

\`\`\`
[시스템 프롬프트]
[요약: 사용자는 Next.js 마이그레이션을 진행 중이며 App Router를 선택함…]
[최근 6턴 원문]
\`\`\`

임계치(예: 컨텍스트의 60%)를 넘으면 백그라운드에서 요약을 생성해 교체합니다. **요약 자체도 LLM 호출 비용**이므로 빈도를 조절해야 합니다.

## 3. 하이브리드 — 실무 권장

\`\`\`
① 시스템 프롬프트          (항상 유지, 캐싱 대상)
② 고정 컨텍스트            (사용자 프로필, 프로젝트 설정 — 잘 안 바뀜)
③ 누적 요약                (오래된 대화의 압축본)
④ 최근 N턴 원문            (정확도가 중요한 구간)
⑤ 현재 질문
\`\`\`

## 4. 프롬프트 캐싱 활용 — 비용 절감 폭이 가장 큼

Anthropic·OpenAI 모두 **반복되는 프롬프트 접두사(prefix)를 캐싱**해 대폭 할인된 가격으로 재사용합니다.

**설계 원칙: 변하지 않는 것을 앞에, 변하는 것을 뒤에 둡니다.**

\`\`\`
[시스템 프롬프트 — 고정]      ← 캐시 히트
[도구 정의 — 고정]            ← 캐시 히트
[문서 컨텍스트 — 고정]        ← 캐시 히트
[대화 이력]
[현재 질문 — 매번 변함]
\`\`\`

앞부분을 조금이라도 바꾸면 **캐시가 전부 무효화**됩니다. 타임스탬프를 시스템 프롬프트 앞에 넣는 것 같은 실수를 피하세요.

## 5. 프론트엔드에서 할 수 있는 것들

**전송 전 정리**
- 첨부 파일 원문 대신 **요약·발췌**만 전송
- 코드 블록은 관련 부분만 (전체 파일 ❌)
- 이미 전송한 문서는 재전송하지 않고 참조 ID로

**중복 제거** — 같은 문서가 여러 턴에 반복 포함되지 않게 관리

**토큰 카운터 표시**
\`\`\`tsx
<div>컨텍스트 {used.toLocaleString()} / {limit.toLocaleString()} 토큰 ({pct}%)</div>
\`\`\`
사용자가 상황을 인지하면 스스로 새 대화를 시작합니다. **UX가 곧 비용 절감 수단**입니다.

**"새 대화" 유도** — 주제가 바뀌면 새 스레드를 권합니다

**분기(branch) 지원** — 이전 지점에서 갈라진 대화는 그 이후 이력만 포함

## 6. RAG로 대체

긴 문서를 컨텍스트에 계속 넣는 대신, **질문 시점에 관련 청크만 검색해 주입**합니다. 문서가 클수록 효과가 큽니다.

## 7. 모델·출력 측 절감

- 간단한 질의는 저렴한 모델로 라우팅
- \`max_tokens\`로 출력 상한 설정 (출력 토큰이 입력보다 대개 비쌉니다)
- 시스템 프롬프트에서 간결한 답변 지시

## 8. 저장 아키텍처

**클라이언트에 전체 이력을 두고 매번 올려보내는 구조는 피하세요.**
- 이력은 서버/DB에 두고 클라이언트는 표시용만 보유
- 서버가 컨텍스트 구성 정책(윈도우·요약)을 담당
- 클라이언트가 보낸 이력을 그대로 믿으면 **컨텍스트 주입 공격**에 노출됩니다

## 측정

| 지표 | 왜 보는가 |
| --- | --- |
| 요청당 입력 토큰 | 컨텍스트 전략의 효과 |
| 캐시 히트율 | 프롬프트 구조가 캐싱 친화적인지 |
| 대화당 평균 턴 수 | 요약 임계치 튜닝 근거 |
| 요약 호출 비용 | 압축이 오히려 비싸지 않은지 |

> 면접 답변: "핵심은 **매 요청마다 전체 이력이 재전송된다**는 사실을 인지하는 것입니다. 슬라이딩 윈도우 + 요약 하이브리드로 컨텍스트를 관리하고, **프롬프트 캐싱이 먹도록 고정 부분을 앞에 배치**하는 설계가 비용에 가장 큰 영향을 줍니다. 프론트엔드는 여기에 토큰 사용량 가시화와 새 대화 유도로 기여합니다."`,
    sub_category: '컨텍스트 관리',
    difficulty: 'hard',
    tags: ['토큰', '컨텍스트', '프롬프트 캐싱', '요약', 'RAG'],
  },
  {
    id: 'q-223',
    question: 'RAG 구조에서 프런트엔드 개발자의 역할은 무엇이라고 생각하나요?',
    answer: `## RAG란

RAG(Retrieval-Augmented Generation)는 **외부 지식을 검색해 프롬프트에 주입한 뒤 LLM이 답변하게 하는 구조**입니다. 모델이 학습하지 않은 최신·사내 데이터를 다루고, 환각을 줄이며, 출처를 제시할 수 있게 합니다.

\`\`\`
질문 → 임베딩 → 벡터 검색 → 관련 청크 추출 → 프롬프트 조립 → LLM → 답변 + 출처
\`\`\`

검색·임베딩·벡터DB는 대체로 백엔드 영역이지만, **RAG의 성패는 상당 부분 UI에서 갈립니다.**

## 프론트엔드의 역할

### 1. 출처(Citation) UI — RAG의 존재 이유

RAG를 쓰는 가장 큰 이유가 "근거 있는 답변"인데, 이걸 **사용자가 확인할 수 있게 만드는 것이 프론트엔드**입니다.

\`\`\`tsx
<p>
  App Router는 서버 컴포넌트가 기본입니다<Citation id={1} />.
</p>
<SourceList sources={sources} />   {/* 문서명, 페이지, 원문 스니펫, 원본 링크 */}
\`\`\`

- 인라인 각주 → 클릭 시 원문 스니펫 표시
- 답변 문장과 출처의 **매핑**을 시각적으로 연결
- 원본 문서로 이동 + 해당 위치 하이라이트

출처가 없거나 확인이 번거로우면 사용자는 결국 답변을 믿지 못합니다.

### 2. 검색 과정의 투명한 노출

RAG는 단계가 많아 지연이 깁니다. 진행 상황을 스트리밍으로 보여주면 체감이 달라집니다.

\`\`\`
🔍 질문 분석 → 📚 문서 12건 검색 → 🎯 관련 3건 선별 → ✍️ 답변 생성
\`\`\`

### 3. 검색 결과 없음 / 신뢰도 낮음 처리

**가장 중요한 UX 판단**입니다. 관련 문서를 못 찾았는데 LLM이 그럴듯한 답을 지어내면 RAG의 의미가 없습니다.

\`\`\`tsx
if (sources.length === 0) {
  return <NoSourceNotice>관련 문서를 찾지 못했습니다. 일반 지식으로 답변할까요?</NoSourceNotice>;
}
if (topScore < THRESHOLD) {
  return <LowConfidenceBadge>참고 문서의 관련도가 낮습니다</LowConfidenceBadge>;
}
\`\`\`

### 4. 문서 관리 인터페이스

- 업로드(드래그앤드롭, 진행률, 대용량 청크 업로드)
- 인덱싱 상태 표시 (임베딩은 수 분 걸릴 수 있음 — 폴링/웹소켓)
- 문서 목록·삭제·재인덱싱
- 실패한 문서의 원인 표시

### 5. 검색 범위 제어

사용자가 어느 문서에서 찾을지 고를 수 있게 하면 정확도가 크게 오릅니다.

\`\`\`tsx
<FilterBar collections={['제품 문서', '내부 위키']} dateRange={...} tags={...} />
\`\`\`

메타데이터 필터는 벡터 검색 품질을 올리는 가장 저렴한 방법입니다.

### 6. 피드백 루프

👍/👎, "이 출처가 관련 없음" 신고를 수집해 **검색 품질 개선 데이터**로 씁니다. 이 데이터가 없으면 RAG 파이프라인을 개선할 근거가 없습니다.

### 7. 성능·상태 관리

- 스트리밍 렌더 최적화
- 검색 결과 캐싱 (같은 질문 반복)
- 낙관적 UI, 취소 지원
- 대화 이력과 검색 컨텍스트의 상태 분리

### 8. 보안·권한

**RAG의 대표적 사고 지점**: 사용자가 접근 권한이 없는 문서가 검색 결과로 나와 답변에 인용되는 경우입니다.

권한 필터링은 **서버에서 강제**해야 합니다. 프론트엔드는 UI에서 감추는 정도이지 방어선이 아닙니다. 다만 프론트엔드가 할 일은:
- 사용자에게 어떤 문서 범위가 사용됐는지 명시
- 권한 없는 출처가 노출되면 즉시 감지·신고할 수 있는 경로

## 오해 정정

"RAG는 백엔드 일이고 프론트엔드는 결과만 보여준다"는 관점은 부정확합니다. **RAG 제품의 신뢰도는 출처 표시·불확실성 전달·피드백 수집이라는 UI 결정에 크게 좌우됩니다.** 검색 정확도가 90%여도 나머지 10%를 사용자가 알아챌 수 없으면 제품은 신뢰를 잃습니다.

> 면접 답변: "검색 파이프라인 자체는 백엔드지만, **RAG가 약속하는 '근거 있는 답변'을 사용자가 실제로 검증할 수 있게 만드는 건 프론트엔드**입니다. 출처 UI, 검색 과정 노출, 결과 없음/신뢰도 낮음 처리, 피드백 수집이 핵심 역할이라고 생각합니다."`,
    sub_category: 'RAG',
    difficulty: 'medium',
    tags: ['RAG', '출처', 'Citation', '벡터검색', 'UX'],
  },
  {
    id: 'q-224',
    question: '이미지를 멀티모달 모델에 보낼 때 Base64 인코딩 방식과 멀티파트 방식 중 어떤 방식을 선호할까요?',
    answer: `## 두 방식

**Base64 (JSON 인라인)**
\`\`\`json
{
  "messages": [{
    "role": "user",
    "content": [
      { "type": "image", "source": { "type": "base64", "media_type": "image/jpeg", "data": "/9j/4AAQ..." } },
      { "type": "text", "text": "이 이미지를 설명해줘" }
    ]
  }]
}
\`\`\`

**멀티파트 (\`multipart/form-data\`)**
\`\`\`ts
const fd = new FormData();
fd.append('image', file);          // 바이너리 그대로
fd.append('prompt', '설명해줘');
await fetch('/api/vision', { method: 'POST', body: fd });
\`\`\`

## 비교

| 항목 | Base64 | 멀티파트 |
| --- | --- | --- |
| 전송 크기 | **+33%** | 원본 그대로 |
| 메모리 | 전체를 문자열로 적재 | 스트리밍 가능 |
| API 호환성 | **대부분의 LLM API가 요구** | 게이트웨이/자체 서버에 적합 |
| 구현 난이도 | 단순 (JSON 하나) | 폼 구성 필요 |
| 대용량 | 취약 (수십 MB에서 문제) | 유리 |
| 캐싱·재사용 | 매번 재전송 | 업로드 후 URL 재사용 가능 |
| 진행률 표시 | 어려움 | \`XMLHttpRequest\`/스트림으로 가능 |

## 결론 — 구간을 나눠서 답하는 것이 정답

**브라우저 → 우리 서버: 멀티파트**
- 33% 오버헤드 없음
- 파일 스트리밍으로 메모리 효율적
- 업로드 진행률 표시 가능
- 서버에서 리사이즈·포맷 변환·검증을 수행할 수 있음

**우리 서버 → LLM API: Base64 (또는 API가 지원하는 URL 방식)**
- Anthropic·OpenAI의 메시지 API가 대부분 Base64 또는 공개 URL을 요구합니다. 선택지가 아니라 **제약**입니다
- 서버는 이미 최적화된 이미지를 갖고 있으므로 인코딩 비용이 작습니다

\`\`\`
브라우저 --(multipart, 원본)--> 우리 서버 --(리사이즈/압축)--> Base64 --> LLM API
\`\`\`

**Base64를 브라우저에서 직접 만들면 안 되는 이유**를 함께 말하면 좋습니다:
- 메인 스레드에서 큰 파일을 Base64로 만들면 **UI가 멈춥니다**
- 33% 커진 페이로드가 사용자 업로드 대역폭을 그만큼 더 소모합니다 (모바일에서 체감이 큼)
- **API 키를 클라이언트에 둘 수 없으므로** 어차피 서버를 거쳐야 합니다

## 예외 상황

**클라이언트에서 Base64가 합리적인 경우**
- 아주 작은 이미지(수십 KB)
- 미리보기용 (\`FileReader.readAsDataURL\`)
- 프로토타입

**URL 참조 방식이 최선인 경우**
같은 이미지를 여러 번 참조하거나 대용량이라면, **presigned URL로 스토리지에 올린 뒤 URL만 전달**하는 것이 가장 효율적입니다(API가 지원할 때).

\`\`\`
브라우저 --(presigned URL로 S3 직접 업로드)--> S3
서버 --(이미지 URL)--> LLM API
\`\`\`

원본이 우리 서버를 거치지 않아 대역폭·메모리를 아낍니다.

## 함께 챙길 것

- **크기·용량 제한** — 모델마다 상한이 있습니다(픽셀 수, 파일 크기). 초과 시 서버에서 리사이즈
- **MIME 검증** — 확장자가 아니라 **매직 넘버**로 실제 타입 확인. 위장 파일 차단
- **EXIF 처리** — 회전 정보 반영 + **GPS 등 개인정보 메타데이터 제거**
- **압축** — 모델은 대체로 고해상도가 필요 없습니다. 다음 문항의 리사이즈 전략과 연결됩니다

> 면접 답변: "구간을 나눠서 봐야 합니다. **브라우저→서버는 멀티파트**가 33% 오버헤드가 없고 스트리밍·진행률 면에서 낫고, **서버→LLM API는 API 스펙상 Base64**를 쓰게 됩니다. 클라이언트에서 직접 Base64를 만드는 건 메인 스레드 블로킹과 대역폭 낭비 때문에 피하고, 대용량이면 presigned URL 방식을 검토합니다."`,
    sub_category: '멀티모달',
    difficulty: 'medium',
    tags: ['멀티모달', 'Base64', 'multipart', '이미지 업로드', 'presigned URL'],
  },
  {
    id: 'q-225',
    question: '고화질 사진을 업로드할 때 토큰 비용을 아끼고 처리 속도를 높이는 방법은 무엇인가요?',
    answer: `## 왜 중요한가

멀티모달 모델은 이미지를 **타일 단위로 쪼개 토큰으로 환산**합니다. 해상도가 커질수록 토큰이 급증하고, 이는 비용과 지연에 직결됩니다.

\`\`\`
4000×3000 원본  →  수천 토큰
1024×768 리사이즈 →  수백 토큰
\`\`\`

**결정적 사실: 모델의 최대 입력 해상도를 넘는 이미지는 어차피 내부적으로 축소됩니다.** 큰 이미지를 보내는 것은 대역폭만 낭비하고 정확도 이득은 없습니다.

## 1. 클라이언트 리사이즈 — 가장 효과가 큼

업로드 **전에** 브라우저에서 줄입니다.

\`\`\`ts
async function resize(file: File, maxSide = 1568, quality = 0.85): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = new OffscreenCanvas(w, h);      // Worker에서도 사용 가능
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();                                 // 메모리 해제

  return canvas.convertToBlob({ type: 'image/webp', quality });
}
\`\`\`

- \`createImageBitmap\` — 디코딩이 비동기라 메인 스레드 블로킹이 적음
- \`OffscreenCanvas\` — **Web Worker에서 실행 가능** → UI 프리즈 없음
- \`bitmap.close()\` — 고화질 이미지는 메모리를 많이 쓰므로 명시적 해제 필수

**목표 해상도**: 모델 문서에서 권장 최대 변 길이를 확인하세요. 대체로 1024~1568px 선이면 충분합니다.

## 2. 포맷 선택

| 포맷 | 특징 |
| --- | --- |
| **WebP** | JPEG 대비 25~35% 작음. 브라우저 지원 충분 |
| **AVIF** | 더 작지만 인코딩이 느림. 모델 지원 확인 필요 |
| JPEG | 호환성 최고. 사진에 무난 |
| PNG | **사진에는 부적합** (무손실이라 매우 큼). 스크린샷·도표용 |

모델이 지원하는 포맷을 먼저 확인하세요. 지원하지 않으면 서버에서 변환합니다.

## 3. Web Worker로 이동

여러 장을 처리하면 메인 스레드가 확실히 멈춥니다.

\`\`\`ts
// worker.ts
self.onmessage = async ({ data }) => {
  const blob = await resize(data.file);
  self.postMessage(blob);
};
\`\`\`

## 4. 디테일 레벨 조절

일부 API는 \`detail: 'low' | 'high' | 'auto'\` 같은 옵션을 제공합니다. **"이 사진에 고양이가 있나?" 수준의 질문에는 low로 충분**하며 토큰이 크게 줄어듭니다. 문서 OCR처럼 세부가 중요할 때만 high를 쓰세요.

## 5. 크롭 — 관련 영역만

전체 사진 대신 필요한 영역만 잘라 보내면 토큰과 정확도가 **동시에** 개선됩니다. 사용자가 영역을 지정하게 하거나, 문서 스캔이라면 경계 검출로 자동 크롭합니다.

## 6. 캐싱 · 중복 제거

- 같은 이미지를 여러 턴에서 다시 보내지 않기 — 서버에 업로드 후 참조 ID 사용
- 파일 해시로 중복 업로드 감지
- 프롬프트 캐싱을 지원하는 API라면 이미지도 캐시 대상이 될 수 있는지 확인

## 7. 지연 처리 · 배치

- 여러 장은 병렬 업로드하되 **동시 개수 제한**(3~5개)
- 사용자가 전송 버튼을 누르기 전에 리사이즈·업로드를 미리 시작하면 체감 지연이 사라집니다

## 8. EXIF 처리 — 놓치기 쉬움

- **회전 정보(Orientation)** — 무시하면 세로 사진이 눕습니다. \`createImageBitmap(file, { imageOrientation: 'from-image' })\`
- **GPS·촬영 기기 메타데이터 제거** — 개인정보입니다. 캔버스를 거치면 자동으로 제거되지만, 원본을 그대로 보낼 때는 명시적으로 스트립하세요

## 9. 측정

\`\`\`
원본 4.2MB (4032×3024) → 리사이즈 180KB (1568×1176 WebP)
토큰: 약 1,600 → 약 400
업로드 시간: 8.2s → 0.4s (3G 기준)
\`\`\`

**실제 숫자로 확인하세요.** 위 값은 예시이며 조건에 따라 크게 달라집니다.

## 파이프라인 정리

\`\`\`
파일 선택
 → EXIF 회전 보정 + 메타데이터 제거
 → Worker에서 리사이즈 (최대 변 ~1568px)
 → WebP 인코딩 (quality 0.85)
 → 멀티파트 업로드 (진행률 표시)
 → 서버: MIME 매직넘버 검증 + 상한 재확인
 → Base64 변환 → LLM API
\`\`\`

> 면접 답변: "가장 큰 절감은 **클라이언트 리사이즈**입니다. 모델 최대 해상도를 넘는 픽셀은 어차피 버려지므로 보낼 이유가 없습니다. \`createImageBitmap\` + \`OffscreenCanvas\`를 Worker에서 돌려 UI 블로킹 없이 처리하고, WebP로 인코딩합니다. 여기에 detail 파라미터와 크롭으로 토큰을 더 줄이고, EXIF 회전·GPS 제거를 함께 챙깁니다."`,
    sub_category: '멀티모달',
    difficulty: 'medium',
    tags: ['이미지 최적화', 'OffscreenCanvas', 'Web Worker', '토큰비용', 'EXIF'],
  },
  {
    id: 'q-226',
    question: 'LLM의 텍스트 응답을 구현할 때 SSE와 웹소켓 중 어떤 것을 선호하나요?',
    answer: `## 결론 먼저

**LLM 텍스트 스트리밍에는 SSE(정확히는 fetch + ReadableStream)를 선호합니다.** 통신이 본질적으로 **단방향(서버→클라이언트)**이기 때문입니다. 요청-응답 모델에 정확히 맞고 인프라가 단순합니다.

## 비교

| 항목 | SSE | WebSocket |
| --- | --- | --- |
| 방향 | **서버 → 클라이언트 단방향** | 양방향 |
| 프로토콜 | HTTP (그대로) | 별도 핸드셰이크 후 업그레이드 |
| 재연결 | **자동** (\`EventSource\`) + \`Last-Event-ID\` | 직접 구현 |
| 프록시·방화벽 | HTTP라 문제 없음 | 일부 환경에서 차단 |
| HTTP/2 다중화 | ⭕ | ❌ 별도 연결 |
| 인증 | 쿠키·헤더 그대로 | 핸드셰이크 시 별도 처리 필요 |
| 압축·캐싱 | HTTP 인프라 활용 | 별도 |
| 서버 부하 | 연결당 가벼움 | 상태 유지 필요 |
| 데이터 | 텍스트만 | 텍스트 + 바이너리 |
| 로드밸런싱 | 표준 HTTP LB | 스티키 세션 필요할 수 있음 |

## SSE를 고르는 이유

**1. LLM 응답은 단방향입니다.** 사용자 입력은 별도 POST 요청으로 충분하고, 응답만 흘러오면 됩니다. 양방향 채널을 유지할 이유가 없습니다.

**2. 인프라가 단순합니다.** 기존 HTTP 스택(인증 미들웨어, 로드밸런서, CDN, 관측 도구)이 그대로 동작합니다. WebSocket은 별도 게이트웨이·스케일링 전략이 필요합니다.

**3. 서버리스와 궁합이 좋습니다.** Vercel·Cloudflare Workers 같은 환경에서 SSE는 자연스럽지만, 장기 WebSocket 연결은 제약이 많거나 별도 서비스(Durable Objects, Ably)가 필요합니다.

**4. 자동 재연결** — \`EventSource\`가 기본 제공합니다.

## 다만 — 실무에서는 \`EventSource\`가 아니라 fetch를 씁니다

\`EventSource\` API의 제약이 큽니다:
- **GET만 가능** → 긴 프롬프트를 URL에 담을 수 없음
- **커스텀 헤더 불가** → \`Authorization: Bearer\` 사용 불가 (쿠키로만)
- 요청 바디 없음

그래서 실무 LLM 채팅은 **POST + \`fetch\` + \`ReadableStream\`**으로 SSE 포맷을 직접 파싱합니다.

\`\`\`ts
const res = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${token}\` },
  body: JSON.stringify({ messages }),
  signal: controller.signal,
});

const reader = res.body!.getReader();
const decoder = new TextDecoder();
let buf = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  buf += decoder.decode(value, { stream: true });

  const lines = buf.split('\\n\\n');
  buf = lines.pop() ?? '';                    // 불완전한 마지막 조각은 보존
  for (const line of lines) {
    if (!line.startsWith('data: ')) continue;
    const data = line.slice(6);
    if (data === '[DONE]') return;
    handleChunk(JSON.parse(data));
  }
}
\`\`\`

**"SSE를 쓴다"는 것은 대개 이 방식**을 의미합니다. 서버는 \`text/event-stream\`으로 응답하되 클라이언트는 \`EventSource\` 대신 fetch를 씁니다.

## WebSocket이 나은 경우

- **진짜 양방향 실시간**이 필요할 때 — 음성 대화(오디오 스트림 왕복), 실시간 협업 편집, 멀티 사용자 세션
- **한 연결로 여러 스트림 다중화** — 여러 에이전트가 동시에 응답
- **바이너리 전송** — 오디오·이미지 청크
- 서버가 요청 없이도 이벤트를 밀어야 할 때 (알림, 상태 변경)

OpenAI Realtime API처럼 **음성 대화**를 다루는 경우가 대표적입니다.

## 서버 측 주의사항

\`\`\`ts
return new Response(stream, {
  headers: {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',   // no-transform 중요
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',                    // Nginx 버퍼링 비활성화
  },
});
\`\`\`

**버퍼링이 최대 함정입니다.** Nginx나 일부 프록시가 응답을 모아뒀다가 한 번에 보내면 스트리밍이 무의미해집니다. \`X-Accel-Buffering: no\`와 \`no-transform\`을 반드시 설정하세요.

**타임아웃**도 확인하세요. 서버리스 함수의 최대 실행 시간, 로드밸런서의 idle timeout이 긴 응답을 끊을 수 있습니다. 주기적 keep-alive 코멘트(\`: ping\\n\\n\`)를 보내는 것이 일반적인 대응입니다.

> 면접 답변: "LLM 텍스트 응답은 단방향이라 **SSE가 구조적으로 맞습니다.** HTTP 인프라를 그대로 쓸 수 있고 서버리스와도 궁합이 좋습니다. 다만 \`EventSource\`는 GET·헤더 제약이 있어 실무에서는 **POST + fetch + ReadableStream으로 SSE 포맷을 파싱**합니다. WebSocket은 음성 대화처럼 양방향·바이너리가 필요할 때 씁니다."`,
    sub_category: '스트리밍',
    difficulty: 'medium',
    tags: ['SSE', 'WebSocket', 'ReadableStream', '스트리밍', '버퍼링'],
  },
  {
    id: 'q-227',
    question: 'Fetch API를 사용하여 스트리밍 응답을 처리할 때 ReadableStream을 어떻게 다루나요?',
    answer: `\`fetch\`의 \`response.body\`는 **\`ReadableStream<Uint8Array>\`**입니다. 전체 응답을 기다리지 않고 도착하는 청크를 순차 처리할 수 있습니다.

## 기본 형태

\`\`\`ts
const res = await fetch('/api/chat', { method: 'POST', body, signal });
if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
if (!res.body) throw new Error('스트림 미지원');

const reader = res.body.getReader();
const decoder = new TextDecoder();

try {
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });   // ⭐ stream: true
    onChunk(chunk);
  }
} finally {
  reader.releaseLock();
}
\`\`\`

## 반드시 알아야 할 3가지 함정

### ① \`decoder.decode(value, { stream: true })\`

**\`{ stream: true }\`를 빠뜨리면 한글이 깨집니다.** UTF-8에서 한글은 3바이트인데, 청크 경계가 문자 중간을 자를 수 있습니다. \`stream: true\`는 불완전한 바이트를 다음 호출까지 내부 버퍼에 보관합니다.

\`\`\`
청크1: [ED 95] ← '한'의 앞 2바이트
청크2: [9C ...] ← 나머지
stream:true 없으면 각각 �로 디코딩됨
\`\`\`

### ② 청크 경계는 메시지 경계가 아닙니다

TCP 청크는 임의로 잘립니다. SSE의 \`data: ...\\n\\n\` 한 덩어리가 여러 청크에 걸치거나, 한 청크에 여러 메시지가 들어올 수 있습니다. **반드시 버퍼링해서 구분자로 나누세요.**

\`\`\`ts
let buffer = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  buffer += decoder.decode(value, { stream: true });

  const parts = buffer.split('\\n\\n');
  buffer = parts.pop() ?? '';        // ⭐ 마지막은 미완성일 수 있으므로 남겨둠

  for (const part of parts) {
    const line = part.split('\\n').find(l => l.startsWith('data: '));
    if (!line) continue;
    const data = line.slice(6);
    if (data === '[DONE]') return;
    try { onEvent(JSON.parse(data)); } catch { /* 파싱 실패 청크 무시 */ }
  }
}
\`\`\`

### ③ 에러 응답도 스트림입니다

\`res.ok\` 확인을 빠뜨리면 500 에러 본문을 토큰으로 착각해 화면에 뿌립니다.

## 유용한 패턴

**비동기 이터레이터로 감싸기**

\`\`\`ts
async function* streamLines(res: Response) {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) yield line;
    }
    if (buffer) yield buffer;
  } finally {
    reader.releaseLock();
  }
}

for await (const line of streamLines(res)) { /* ... */ }
\`\`\`

**TransformStream으로 파이프라인 구성** (Node 18+/모던 브라우저)

\`\`\`ts
const lines = res.body!
  .pipeThrough(new TextDecoderStream())
  .pipeThrough(new TextLineStream());   // 직접 구현하거나 라이브러리

for await (const line of lines) { }
\`\`\`

\`TextDecoderStream\`은 위의 \`stream: true\` 처리를 알아서 해줍니다. 더 선언적이고 안전합니다.

## React 통합 시 리렌더 최적화

토큰마다 \`setState\`하면 초당 수십 회 리렌더됩니다.

\`\`\`tsx
const buffer = useRef('');
const raf = useRef<number | null>(null);

const append = (chunk: string) => {
  buffer.current += chunk;
  if (raf.current !== null) return;
  raf.current = requestAnimationFrame(() => {
    setText(prev => prev + buffer.current);
    buffer.current = '';
    raf.current = null;
  });
};
\`\`\`

프레임당 최대 1회로 묶여 렌더 비용이 크게 줄어듭니다. 언마운트 시 \`cancelAnimationFrame\` 정리를 잊지 마세요.

## 취소와 정리

\`\`\`ts
const controller = new AbortController();
fetch(url, { signal: controller.signal });

// 중단
controller.abort();
// 또는 스트림만
await reader.cancel();
\`\`\`

\`AbortError\`는 사용자의 의도적 중단이므로 **에러 UI를 띄우지 않도록** 구분하세요.

\`\`\`ts
catch (e) {
  if (e instanceof DOMException && e.name === 'AbortError') return;
  throw e;
}
\`\`\`

## 그 밖의 주의점

- **\`getReader()\`는 스트림을 잠급니다(lock).** 같은 body를 두 번 읽을 수 없습니다. 필요하면 \`res.body.tee()\`로 분기하세요
- **\`finally\`에서 정리**하세요. 예외로 빠져나가도 reader가 해제되어야 합니다
- **Content-Encoding** — 서버가 gzip을 걸면 브라우저가 자동 해제하지만, 프록시가 버퍼링하면 스트리밍이 죽습니다. 서버에서 \`Cache-Control: no-transform\`, \`X-Accel-Buffering: no\`를 설정하세요
- **HTTP/1.1 동시 연결 제한(6개)** — 여러 스트림을 동시에 열면 막힙니다. HTTP/2를 쓰세요

> 면접 답변: "\`response.body.getReader()\`로 청크를 읽으면서 \`TextDecoder\`의 **\`{ stream: true }\`**로 디코딩합니다. 실무에서 놓치기 쉬운 건 **청크 경계가 메시지 경계와 다르다**는 점이라 버퍼링 후 구분자로 분할해야 하고, React에서는 rAF로 setState를 묶어 리렌더 폭발을 막습니다. 취소는 \`AbortController\`로 처리하되 \`AbortError\`를 일반 에러와 구분합니다."`,
    sub_category: '스트리밍',
    difficulty: 'hard',
    tags: ['ReadableStream', 'fetch', 'TextDecoder', 'SSE 파싱', 'AbortController'],
  },
  {
    id: 'q-228',
    question: '스트리밍 도중 네트워크 연결이 끊겼을 때 자연스럽게 재연결하는 전략은 무엇일까요?',
    answer: `## 1. 끊김을 먼저 감지해야 합니다

스트리밍 중단은 여러 형태로 나타납니다.

| 상황 | 감지 방법 |
| --- | --- |
| 연결 끊김 | \`reader.read()\`가 \`TypeError\`로 reject |
| 서버가 조용히 종료 | \`done: true\`인데 \`[DONE]\` 신호 없음 → **정상 종료와 구분 필요** |
| 응답이 멈춤(stall) | 마지막 청크 이후 타임아웃 |
| 오프라인 전환 | \`navigator.onLine\`, \`offline\` 이벤트 |
| 탭 백그라운드 | \`visibilitychange\` |

**가장 놓치기 쉬운 것은 "조용한 종료"입니다.** 서버가 \`[DONE]\`을 보내지 않고 스트림이 끝나면 정상 완료처럼 보입니다. **종료 신호를 프로토콜에 반드시 넣으세요.**

\`\`\`ts
let receivedDone = false;
// ... 루프 안에서 data === '[DONE]' 이면 receivedDone = true
if (!receivedDone) throw new StreamInterruptedError();
\`\`\`

## 2. Stall 감지 — 타임아웃 워치독

\`\`\`ts
let lastChunkAt = performance.now();
const STALL_MS = 15_000;

const watchdog = setInterval(() => {
  if (performance.now() - lastChunkAt > STALL_MS) {
    controller.abort();          // 재연결 로직으로 진입
    clearInterval(watchdog);
  }
}, 2_000);

// 청크 수신 시: lastChunkAt = performance.now();
\`\`\`

서버가 주기적으로 keep-alive(\`: ping\\n\\n\`)를 보내면 정상 대기와 stall을 구분할 수 있습니다.

## 3. 이어받기(Resume) — 핵심 설계

**처음부터 다시 생성하면 토큰 비용이 두 배가 되고 사용자는 앞부분을 또 읽어야 합니다.**

**서버가 이벤트 ID를 부여하고, 클라이언트가 마지막 수신 지점을 알려주는 구조**를 만듭니다.

\`\`\`
서버 → id: 42\\ndata: {"delta":"안녕"}\\n\\n
재연결 시 → Last-Event-ID: 42  (또는 요청 바디에 lastEventId)
서버 → 43번부터 재전송
\`\`\`

\`EventSource\`는 \`Last-Event-ID\` 헤더를 **자동으로** 보냅니다. fetch 방식이라면 직접 넣어야 합니다.

**서버 측 전제**: 생성 결과를 스트리밍하면서 **동시에 저장**해야 이어받기가 가능합니다.

\`\`\`
LLM → 서버: 토큰 스트림
서버 → ① 저장소에 append (Redis/DB)
      → ② 클라이언트로 전달
재연결 → 저장소에서 offset 이후를 먼저 보내고, 이후 실시간 스트림에 합류
\`\`\`

이 구조가 없다면 **차선책**은: 이미 받은 부분 텍스트를 assistant 메시지로 컨텍스트에 넣고 "이어서 작성해줘"로 재요청하는 것입니다. 완벽하지 않지만 처음부터 다시 하는 것보다는 낫습니다.

## 4. 지수 백오프 + 지터

\`\`\`ts
async function withRetry(fn: () => Promise<void>, max = 5) {
  for (let attempt = 0; attempt < max; attempt++) {
    try { return await fn(); }
    catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') throw e;  // 사용자 취소는 재시도 금지
      if (attempt === max - 1) throw e;

      const base = Math.min(1000 * 2 ** attempt, 30_000);
      const jitter = Math.random() * base * 0.3;                          // 동시 재접속 폭주 방지
      await new Promise(r => setTimeout(r, base + jitter));
    }
  }
}
\`\`\`

**지터가 중요한 이유**: 장애 복구 시 모든 클라이언트가 동시에 재접속하면 서버가 다시 무너집니다(thundering herd).

**재시도하면 안 되는 것**: 4xx(400, 401, 403, 422)는 재시도해도 같은 결과입니다. 429는 \`Retry-After\` 헤더를 존중하세요.

## 5. 오프라인 감지와 연동

\`\`\`ts
if (!navigator.onLine) {
  await new Promise<void>(resolve => {
    window.addEventListener('online', () => resolve(), { once: true });
  });
}
\`\`\`

오프라인인 걸 아는데 재시도를 반복하는 것은 배터리 낭비입니다. **네트워크가 돌아올 때까지 대기**했다가 재개하세요. 단 \`navigator.onLine\`은 "랜선이 꽂혔는지" 수준이라 실제 도달 가능성을 보장하지 않으므로, 보조 신호로만 쓰세요.

## 6. UX — 사용자에게 무엇을 보여줄까

**원칙: 이미 받은 텍스트는 절대 지우지 않습니다.**

\`\`\`tsx
{status === 'reconnecting' && (
  <InlineNotice>
    연결이 끊겨 재연결 중입니다… ({attempt}/5)
    <button onClick={retryNow}>지금 다시 시도</button>
  </InlineNotice>
)}
{status === 'failed' && (
  <InlineNotice tone="error">
    연결에 실패했습니다.
    <button onClick={resume}>이어서 생성</button>
    <button onClick={restart}>처음부터</button>
  </InlineNotice>
)}
\`\`\`

- 자동 재연결은 **조용히**, 실패 후에는 **명시적 선택지**를
- 재시도 횟수를 보여주면 사용자가 기다릴지 판단할 수 있습니다
- 수동 재시도 버튼을 항상 제공하세요

## 7. 멱등성

재요청 시 같은 \`requestId\`를 보내 **서버가 중복 생성을 방지**하게 합니다. 이게 없으면 재연결이 곧 이중 과금입니다.

## 8. 관측

재연결률, 평균 재시도 횟수, 이어받기 성공률을 로깅하세요. 특정 지역·통신사에서만 높다면 인프라 문제일 수 있습니다.

## 전체 흐름

\`\`\`
스트림 시작
 ├─ 청크 수신 → lastEventId 갱신, 워치독 리셋, 텍스트 누적
 ├─ [DONE] 수신 → 정상 완료
 └─ 에러 / stall / done without DONE
     ├─ 사용자 취소(AbortError) → 종료
     ├─ 오프라인 → online 이벤트 대기
     ├─ 4xx → 재시도 없이 실패 처리
     └─ 그 외 → 백오프+지터 대기 → Last-Event-ID로 재연결
         └─ 최대 횟수 초과 → 부분 텍스트 유지 + 수동 선택지 제공
\`\`\`

> 면접 답변: "**부분 응답을 절대 버리지 않는 것**이 대전제입니다. 서버가 이벤트 ID를 부여하고 생성 결과를 저장해두면 \`Last-Event-ID\`로 끊긴 지점부터 이어받을 수 있고, 이게 비용과 UX 모두에 결정적입니다. 재연결은 지수 백오프 + 지터로 하되 4xx와 사용자 취소는 재시도하지 않고, \`requestId\` 멱등성으로 중복 생성을 막습니다."`,
    sub_category: '스트리밍',
    difficulty: 'hard',
    tags: ['재연결', '지수 백오프', 'Last-Event-ID', '멱등성', '오프라인'],
  },
];

// ============================================================
// 실행
// ============================================================

const GROUPS = [
  { categoryId: 'cat-1', startOrder: 15, items: HTML },
  { categoryId: 'cat-2', startOrder: 14, items: CSS },
  { categoryId: 'cat-3', startOrder: 16, items: JS },
  { categoryId: 'cat-5', startOrder: 15, items: REACT },
  { categoryId: 'cat-6', startOrder: 12, items: NEXT },
  { categoryId: 'cat-7', startOrder: 12, items: BROWSER },
  { categoryId: 'cat-10', startOrder: 8, items: SECURITY },
  { categoryId: 'cat-13', startOrder: 8, items: PATTERN },
  { categoryId: 'cat-17', startOrder: 0, items: BUILD },
  { categoryId: 'cat-18', startOrder: 0, items: AI },
];

async function main() {
  console.log('🚀 책 목차 기반 신규 질문 시드 시작...\n');

  const { error: catErr } = await sbAdmin.from('categories').upsert(NEW_CATEGORIES, { onConflict: 'id' });
  if (catErr) {
    console.error('❌ 카테고리 생성 실패:', catErr.message);
    process.exit(1);
  }
  console.log(`✅ 신규 카테고리 ${NEW_CATEGORIES.length}개 반영: ${NEW_CATEGORIES.map((c) => c.title).join(', ')}\n`);

  const rows = GROUPS.flatMap(({ categoryId, startOrder, items }) =>
    items.map((q, i) => ({
      ...q,
      category_id: categoryId,
      order_num: startOrder + i + 1,
      show_in_daily: true,
      show_in_flashcard: true,
    })),
  );

  const ids = rows.map((r) => r.id);
  if (new Set(ids).size !== ids.length) {
    console.error('❌ 중복 id 존재');
    process.exit(1);
  }

  const { error: qErr } = await sbAdmin.from('questions').upsert(rows, { onConflict: 'id' });
  if (qErr) {
    console.error('❌ 질문 삽입 실패:', qErr.message);
    process.exit(1);
  }

  for (const { categoryId, items } of GROUPS) {
    console.log(`  ${categoryId.padEnd(8)} +${items.length}개`);
  }
  console.log(`\n✅ 총 ${rows.length}개 질문 upsert 완료 (${ids[0]} ~ ${ids[ids.length - 1]})`);
}

main().catch(console.error);
