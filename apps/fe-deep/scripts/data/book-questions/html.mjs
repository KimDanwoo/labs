export const HTML = [
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
