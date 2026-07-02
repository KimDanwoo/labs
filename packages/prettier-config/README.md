# @repo/prettier-config

모노레포 전체에 적용하는 공유 Prettier 설정.

## 사용법

```jsonc
// package.json
{
  "prettier": "@repo/prettier-config"
}
```

Astro 앱처럼 플러그인을 추가해야 할 때는 `prettier.config.cjs`로 확장한다.

```js
// prettier.config.cjs (Astro 앱 예시)
module.exports = {
  ...require('@repo/prettier-config'),
  plugins: [...require('@repo/prettier-config').plugins, 'prettier-plugin-astro'],
};
```

## 주요 설정

| 옵션 | 값 | 비고 |
| --- | --- | --- |
| `printWidth` | `120` | 줄 길이 기준 |
| `singleQuote` | `true` | JSX 제외 작은따옴표 |
| `trailingComma` | `"all"` | 함수 인자 포함 후행 쉼표 |
| `semi` | `true` | 세미콜론 삽입 |
| `tabWidth` | `2` | 들여쓰기 2칸 |
| `arrowParens` | `"always"` | 화살표 함수 인자 항상 괄호 |
| `plugins` | `prettier-plugin-organize-imports` | import 저장 시 자동 정렬 |

`prettier-plugin-organize-imports`가 포함되어 있어, 저장·포맷 시 import 순서가 자동으로 정렬된다. 수동 정렬 불필요.
