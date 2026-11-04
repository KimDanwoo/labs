export const BUILD = [
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
