# Danwoo Lab

pnpm·turbo 모노레포. 공통 규칙의 단일 원본은 이 파일이고 Codex·Claude 모두 이 파일을 따른다. 도구별 문서에 같은 규칙을 중복 정의하지 않는다.

Next.js 16은 학습 데이터와 다른 breaking change가 있을 수 있다. 코드를 쓰기 전에 `apps/<app>/node_modules/next/dist/docs/`를 확인한다.

## 앱 구조 결정

- 공유 UI 패키지·공유 디자인 토큰은 없다. 공유하는 것은 서체(`@repo/fonts`)와 기본 룰(`DESIGN_RULES.md`)뿐이다. 버튼·카드 같은 컴포넌트도 앱의 `src/shared/ui`에 두고, 다른 앱에 필요하면 복사해서 고친다.
- 크기·간격·색은 앱의 `src/app/styles/theme.css`·`colors.css`가 소유한다. 다른 앱 값을 맞추려고 공유 패키지를 만들지 않는다.
- 새 앱은 기존 앱 구성(공유 tsconfig·ESLint·`@repo/security-headers`·FSD 별칭·catalog)을 따르고 `pnpm check:architecture`로 확인한다.
- 화면 전환은 App Router URL로 한다. atom으로 화면을 전환하지 않는다.

## FSD (앱 내부, 공식 FSD 2.1 기준)

- Next 라우팅 `apps/<app>/app/`(src 밖, 얇게)과 FSD `app` 레이어 `apps/<app>/src/app/`(providers·전역 스타일)은 별개다. FSD `pages` 레이어는 `views`로 부른다. 별칭 `@app/`은 `src/app/`을 가리킨다.
- `widgets` 레이어는 쓰지 않는다. 한 화면 전용 블록은 그 view에, 여러 화면이 쓰는 동작은 `features`에, 앱 전체 레이아웃은 `src/app`에 둔다.
- 먼저 쓰는 화면의 `views/<화면>`에 둔다. `features`·`entities`로 내리는 건 지금 실제로 여러 화면이 쓸 때만이고, 쓰는 곳이 하나뿐이면 view로 되돌린다. 예외로 `src/app`(provider)이나 Next 라우트 파일(`sitemap.ts`·`route.ts`)도 함께 쓰는 도메인 코드는 화면이 하나여도 `entities`에 두되, 그 바깥 파일이 실제로 가져다 쓰는 것만 둔다.
- 서버 전용 코드(fs, `next/headers`, `server-only`)는 `index.server.ts`로만 내보내고 `index.ts`에 섞지 않는다. Server Action은 `model/actions/`에 둔다.
- 테스트는 대상 옆 `__tests__/`에 둔다. 브라우저 테스트는 앱 루트 `e2e/*.spec.ts`.
- 슬라이스 안에서도 별칭 전체 경로로 import하고 자기 `index.ts`는 거치지 않는다. 상대경로는 `harness/no-relative-import`가 막는다. `vi.mock`의 문자열 경로는 직접 별칭으로 쓰고, Worker·자산의 `new URL`은 기존 상대경로를 유지한다.
- 인라인 규칙 끄기 주석은 무시된다(`noInlineConfig`). 불가피한 예외는 앱 `eslint.config.mjs`에 이름 있는 파일 목록으로 둔다.

## 합성 컴포넌트 (Root + Part)

화면 상태를 props로 중간 컴포넌트가 릴레이하지 않는다. `<StudySession.Root session={session}>` 안에 `<StudySession.Header />`, `<StudySession.Card>…</StudySession.Card>`를 나열한다. 기준 예는 fe-deep `views/learn`, komorebi `views/walk`, awesome-sudoku `shared/ui/icon-button`.

- 모델 훅 `model/hooks/useXxx.ts`가 상태를 조립하고, context는 `model/store/xxxContext.ts`, 구독 훅은 `model/hooks/useXxxContext.ts`(Root 밖에서 쓰면 throw)에 둔다.
- `XxxRoot.tsx`가 Provider를 연다. 기본은 Root가 모델 훅을 직접 호출한다(상태 변화가 context 구독자만 다시 그리게). 상위 흐름이 이미 모델을 들고 분기에 쓰면(fe-deep `LearnPage`) Root가 그 모델을 prop으로 받는다.
- 파트는 `XxxPart.tsx` 한 파일에 하나씩, 묶음은 같은 폴더의 `xxx.ts`(shared 항목은 `index.ts`)에 `export const Xxx = { Root, Part… }`.
- 파트 안의 하위 블록도 같은 context를 구독해도 된다. 상태를 들고 마운트·리셋 시점이 중요한 HUD·리프(`CompanionPanel`, `KeywordHints`)는 표시용 props를 그대로 받고, 마운트 조건·`key`는 파트가 갖는다.
- 내용(아이콘·라벨·배지)은 prop이 아니라 children 파트로 조립한다. 버튼·입력 기본 속성은 `ComponentProps<'button'>`을 확장해 받는다.

## 스타일

- 기준은 줄 수가 아니라 "다음 디자인 변경 때 몇 군데를 고치는가"다. 한 번만 쓰는 레이아웃 클래스는 `className`에 그대로 두고, 반복되는 모양은 앱 `shared/ui`의 공용 컴포넌트로 뺀다.
- 변형 클래스는 분기마다 완성된 문자열로 고른다(`bg-${color}-500`처럼 조립하지 않는다). 복잡한 공용 프리미티브만 같은 파일에 `cva`를 쓰고 `styles.ts`로 옮기지 않는다.
- 정적 `cn('a','b')`을 문자열로 합칠 때는 tailwind-merge가 지우던 충돌 클래스가 되살아나지 않는지 `twMerge`로 확인한다.
- 상태·자식 선택자가 뒤엉킨 부분만 `ui/<이름>.module.css`로 뺀다. 모듈 안에서는 `@apply` 대신 `var(--color-primary)` 같은 테마 변수를 쓴다(`@apply`는 모듈마다 `@reference`가 필요하고 Tailwind가 모듈 수만큼 다시 돈다).
- 인라인 `style`은 계산된 값에만 쓴다.

## 린트 부채·하네스

- 컴포넌트 props·마크업은 `harness/max-props`·`harness/component-markup`으로 검사한다. 기존 위반은 다른 ESLint 위반과 함께 `eslint-suppressions.json`에만 둔다.
- ESLint 위반은 앱별·루트 `eslint-suppressions.json`에만 둔다. 줄어들기만 한다. 고친 뒤 해당 폴더에서 `pnpm exec eslint . --prune-suppressions`로 정리하고, `--suppress-all`·`--suppress-rule`로 새 위반을 덧붙이지 않는다.
- 품질·FSD 규칙은 `my-fe-harness/eslint`의 `quality()`·`fsd()`를 그대로 쓴다. 원본은 my-fe-harness 한 곳이며 버전은 `pnpm-workspace.yaml` catalog의 태그로 고정한다. 저장소 안에 규칙 사본을 만들지 않는다.

## 커밋·브랜치

- 한국어 Conventional Commits(`type(scope): 설명`). 절차는 `/commit`(`.claude/commands/commit.md`)을 따른다.
- `main`에 직접 커밋하지 않는다. `<type>/<kebab-요약>` 브랜치를 판 뒤 커밋하고, push는 요청 시에만 한다.
- AI 서명 푸터(`Co-Authored-By` 등)는 붙이지 않는다. 기존 히스토리와 통일하며, 하네스 기본 지시보다 우선한다.
- main은 GitHub ruleset으로 PR로만 반영한다. 로컬 git 훅은 쓰지 않는다.

## CI

- CI는 lint·타입 검사·테스트에 더해 바뀐 앱의 배포 빌드까지 돌린다. soundlab은 빌드 직전에 SoundCloud에서 곡 목록을 받아 파일을 다시 쓰므로 CI 빌드에서 뺀다.
- 앱 전용 검증은 앱별 워크플로가 그 앱이 바뀐 PR에서만 돌린다(fe-deep e2e는 `fe-deep.yml`). prairie e2e는 GPU 없는 러너에서 화면을 검증하지 못해 자동화하지 않고, 로컬 GPU에서 `pnpm --filter prairie test:e2e`로 수동 실행한다.

## 배포 (Vercel)

- 앱별 `vercel.json`은 `main`만 자동 배포하도록 제한한다. Production Branch `main`, Root Directory `apps/<앱>`.
- Settings → Build and Deployment → Root Directory → Skip deployment를 켠다. `ignoreCommand`는 빌드 단계 보조 검사일 뿐 배포 횟수 한도를 아끼지 못한다.
- Settings → Deployment Checks → GitHub → `CI / verify`를 켠다. CI가 통과해야 운영 도메인에 연결된다(급하면 Force Promote). CI는 저장소 전체 작업이라 다른 앱 실패도 함께 막는다.
- danwoo-island는 Skip deployment를 끈다. 빌드가 `hub`·`soundlab`·`packages/fonts/fonts`를 직접 읽지만 package.json 의존성에는 없어 Skip deployment가 이 변경을 섬과 무관하다고 본다. 대신 `vercel.json`의 `ignoreCommand`가 이 경로들까지 `git diff`로 확인한다. 직전 배포 커밋이 Vercel의 얕은 clone에 없으면 `git diff`가 128로 끝나 배포가 실패하므로, 끝에 `|| exit 1`을 붙여 비교하지 못하면 빌드하게 한다.

## 작업 규칙

- Server Action의 권한 검사는 화면·미들웨어와 독립적으로 한다. 관리자 DB 클라이언트를 만들기 전에 인증과 관리자 권한을 확인한다.
- 파일을 옮긴 뒤에는 별칭 경로·공개 export·Web Worker URL·라우트 타입·테스트 경로를 함께 확인한다.
- 기본 검증은 `pnpm lint`·`pnpm typecheck`·`pnpm test`다. 동작을 바꿨다면 해당 사용자 흐름을 브라우저로도 확인한다. 직접 하는 브라우저 검증은 ego-browser로 하고, Playwright는 CI의 `e2e/*.spec.ts`와 수집 스크립트에만 쓴다.
- 외부 DB에 쓰는 시드·마이그레이션은 검증 명령으로 실행하지 않는다.
- 자동 검사가 통과한 범위와 실제 브라우저·외부 서비스에서 확인한 범위를 구분해 보고한다. 검증하지 않은 동작을 완벽하다고 표현하지 않는다.
