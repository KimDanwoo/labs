# @config/tsconfig

모노레포 앱과 패키지가 공유하는 TypeScript 설정 모음.

## 사용법

```jsonc
// tsconfig.json (Next.js 앱)
{
  "extends": "@config/tsconfig/next.json",
  "compilerOptions": {
    "paths": { "@app/*": ["./src/app/*"] }
  }
}

// tsconfig.json (라이브러리 패키지)
{
  "extends": "@config/tsconfig/base.json"
}
```

## 제공 설정

| 파일 | 대상 |
| --- | --- |
| `base.json` | 모든 패키지의 기본값 |
| `next.json` | Next.js 앱 전용 (`base.json` 확장) |

## base.json 주요 옵션

| 옵션 | 의미 |
| --- | --- |
| `strict: true` | 엄격 모드 전체 활성화 |
| `verbatimModuleSyntax` | 타입 import는 반드시 `import type`으로 분리 |
| `noUncheckedIndexedAccess` | 배열·객체 인덱스 접근 결과에 `undefined` 포함 — 반드시 좁혀서 사용 |
| `isolatedModules` | 파일 단위 트랜스파일 안전성 보장 |
| `moduleResolution: bundler` | Vite·Next 번들러 환경에 맞는 모듈 해석 |

## next.json 추가 옵션

`jsx: preserve`, `noEmit: true`, `incremental: true`, Next.js 언어 서버 플러그인(`plugins: [{ name: "next" }]`) 포함.
