export const NEXT = [
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

> 이 저장소의 앱들은 App Router를 쓰되 **Next 라우팅용 \`app/\`과 FSD의 \`src/_app\` 레이어를 분리**합니다. \`app/\`은 진입점만 얇게 두고 화면은 \`_pages\`, 전역 setup은 \`src/_app\`이 담당합니다.`,
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
