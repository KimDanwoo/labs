---
title: 'import 경로 관리 알아보기 (alias와 barrel 패턴, FSD)'
date: 2024-12-15
description: 'import 경로 관리 알아보기 (alias와 barrel 패턴, FSD)'
category: 'JavaScript'
isHidden: false
thumbnail: './thumbnail.png'
---

## 왜 이 글을 쓰게 됐나? 🤔

최근 같이 교류하던 분들과 친한 개발자 분이 이렇게 물어봤다.
”이 @components 같은 거 왜 쓰는 거예요? 어떤 이유가 있죠?"

솔직히 나도 처음엔 그냥 "깔끔해 보여서" 쓰기 시작했다.
이참에 내가 쓰던 방식을 같이 복기하면서 정리해볼까 한다.

## alias가 뭔지 알아보자

### 상대경로의 불편함부터 보자

프로젝트 하다 보면 이런 코드 진짜 많이 보게 된다

```tsx
// 깊이가 깊어질수록...
import { Button } from '../../../components/common/Button'
import { Input } from '../../../components/common/Input'
import { useAuth } from '../../../hooks/useAuth'
```

이런 import 구문 보면 드는 생각들:

- '../' 이게 몇 개더라...?
- 파일 위치 바꾸면 다 고쳐야 하나?
- 다른 폴더로 옮기면 경로 다 깨지겠는데?

### alias로 바꿔보자

```tsx
// 훨씬 깔끔하지 않나?
import { Button } from '@components/common/Button'
import { Input } from '@components/common/Input'
import { useAuth } from '@hooks/useAuth'
```

## alias 어떻게 설정하는지 보자

### 1. TypeScript 프로젝트면 이렇게 하면 된다 (tsconfig.json)

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@hooks/*": ["src/hooks/*"]
    }
  }
}
```

### 2. Next.js 프로젝트면 이렇게 (next.config.js)

```jsx
const path = require('path')

module.exports = {
  webpack: config => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components')
    }
    return config
  }
}
```

### 3. FSD 구조에서도 이렇게 쓸 수 있다

FSD(Feature-Sliced Design) 구조를 쓰고 있다면 이렇게 설정하면 좋다:

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@shared/*": ["src/shared/*"],
      "@entities/*": ["src/entities/*"],
      "@features/*": ["src/features/*"],
      "@widgets/*": ["src/widgets/*"],
      "@pages/*": ["src/pages/*"],
      "@app/*": ["src/app/*"]
    }
  }
}
```

실제로 이렇게 쓰면:

```tsx
// 깔끔하게 각 슬라이스별로 임포트할 수 있다
import { Button } from '@shared/ui'
import { UserCard } from '@entities/user'
import { LoginForm } from '@features/auth'
import { Header } from '@widgets/header'
import { config } from '@app/config'
```

폴더 구조는 대충 이런 식:

```
src/
├── app/
├── pages/
├── widgets/
│   └── header/
│       ├── ui/
│       └── index.ts
├── features/
│   └── auth/
│       ├── ui/
│       └── index.ts
├── entities/
│   └── user/
│       ├── ui/
│       └── index.ts
└── shared/
    └── ui/
        └── index.ts
```

이렇게 하면 좋은 점:

- 각 슬라이스별로 깔끔하게 구분된다
- 계층 간 의존성 관리가 쉬워진다
- 코드 네비게이션이 한결 편해진다

## barrel 패턴도 같이 보자

처음 이 패턴 봤을 때는 "왜 index.ts 파일을 또 만들지?"라고 생각했다.
근데 쓰다 보니까 진짜 편하더라.

### barrel 패턴이 뭔데?

한 폴더의 여러 파일들을 하나로 모아서 내보내는 방식이다.
index.ts 파일로 구현하는데, 실제로 어떻게 쓰이는지 보자:

```tsx
// components/common/index.ts
export * from './Button'
export * from './Input'
export * from './Select'

// 다른 파일에서 쓸 때
import { Button, Input, Select } from '@components/common'
```

### 폴더 구조는 이렇게 된다

```
src/
├── components/
│   ├── common/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   └── index.ts    // <- 여기서 모아서 내보낸다
│   └── index.ts
```

## 써보니까 좋았던 점

1. 파일 위치 바꿀 때 편하다
   - components 폴더 구조가 바뀌어도 import 경로는 그대로!
2. 자동완성이 잘 된다
   - '@components/'만 입력해도 VSCode가 척척 찾아줌
3. import 문이 깔끔해진다
   - '../../../' 같은 상대경로가 사라져서 코드가 한결 깔끔

## 주의할 점도 있더라

1. alias를 너무 많이 만들면 오히려 헷갈린다
   - 자주 쓰는 경로만 alias로 설정하는 게 낫더라
2. barrel 패턴 쓸 때는 트리쉐이킹 조심!
   - 불필요한 코드가 포함될 수 있어서 큰 파일들은 개별 import가 나을 수도

## 마무리하며

사실 이런 패턴들이 꼭 필요한 건 아니다.
근데 프로젝트가 커질수록, 팀이 커질수록 이런 작은 규칙들이 코드 관리를 훨씬 편하게 만들더라.

처음에는 나도 "그냥 써도 되는데..." 했는데, 지금은 새 프로젝트 시작할 때마다 꼭 설정하는 습관이 생겼다.
한번 써보고 편해지면 계속 쓰게 될 거다! 😊
