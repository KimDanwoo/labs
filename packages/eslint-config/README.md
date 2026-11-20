# `@repo/eslint-config`

labs 앱이 함께 쓰는 ESLint(flat) 설정. 품질·FSD 규칙의 원본은 [my-fe-harness](https://github.com/KimDanwoo/my-fe-harness)이고, 버전은 루트 `pnpm-workspace.yaml` catalog의 태그로 고정한다. 규칙을 바꾸려면 하네스를 고치고 태그를 올린다.

| 파일                        | 내용                                                                                                                                                                                   |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `next.eslint.config.mjs`    | Next 권장 + 네이밍 + 하네스 `quality()`(복잡도·깊이·함수 길이·매직넘버·컴포넌트 본문·props 개수·마크업·상대경로) + Prettier                                                            |
| `fsd.config.mjs`            | 하네스 `fsd()`(레이어 방향·공개 API·슬라이스 구조·컴포넌트 파일·라우팅 위치·atom 위치, `pages` → `views`) + labs 전용 `labs/interactive-composition` + 루트 파일의 `src` 상대경로 금지 |
| `quality.config.mjs`        | 하네스 `quality`를 그대로 내보낸다(루트 `eslint.config.mjs`용)                                                                                                                         |
| `naming.config.mjs`         | 파일 이름·식별자 네이밍                                                                                                                                                                |
| `library.eslint.config.mjs` | 앱이 아닌 TS 패키지용 최소 설정                                                                                                                                                        |
