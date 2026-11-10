---
title: "import 경로 관리 알아보기 (alias와 barrel 패턴, FSD)"
description: "상대경로 import의 문제를 alias로 풀고 barrel 패턴으로 모듈을 캡슐화하는 방법을 정리해요. FSD 적용 사례와 주의점도 담았어요."
publishedAt: "2024-12-15T14:47:25+09:00"
updatedAt: "2026-11-10T18:24:00+09:00"
category: "dev"
tags: ["fsd","architecture"]
legacyUrl: "https://dansoon-dev.tistory.com/12"
thumbnail: "./thumbnail.jpg"
cover: "./cover.jpg"
---

> 2024년 12월에 쓴 글이다. 2026년 11월에 FSD 공식 문서 기준으로 barrel을 쓰는 방식을 바꿨다. 달라진 내용은 글 끝의 '2026년 11월에 바꾼 것'에 덧붙였다.

## 들어가며

최근 같이 교류하던 분들과 친한 개발자 분이 이렇게 물어봤다.

"이 @components 같은 거 왜 쓰는 거예요? 어떤 이유가 있죠?"

솔직히 처음에는 그냥 "깔끔해 보여서" 쓰기 시작했다.

하지만 수년간 다양한 규모의 프로젝트를 진행하면서, 이 패턴이 미적 선호만이 아니라 코드 품질과 개발 효율성에도 상당한 영향을 미친다는 것을 깨달았다.

모듈 별칭(alias)과 barrel 패턴의 기술적 이점, 구현 방법, 실제 대규모 프로젝트에서의 활용 사례를 차례로 다룬다.

## 모듈 별칭(alias)은 왜 필요한가

### 상대경로 import의 문제

프로젝트 복잡도가 증가하면 상대경로 방식은 다음과 같은 문제를 일으킨다.

```ts
// 중첩 깊이가 깊어질수록 발생하는 가독성 문제
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { useAuth } from '../../../hooks/useAuth';
import { formatDate } from '../../../../utils/dateUtils';
import { API_ENDPOINTS } from '../../../../../config/constants';
```

이런 코드에는 다음과 같은 문제가 있다.

1.  경로 추적 복잡성: 상위 디렉토리로 이동하는 '../' 연산자의 개수를 정확히 추적하기 어려워 오류 발생 확률이 높아진다.
2.  리팩토링 취약성: 파일 위치 변경 시 모든 import 경로를 수동으로 조정해야 하는 유지보수 오버헤드가 발생한다.
3.  코드베이스 확장성 제한: 프로젝트 구조 변경에 따른 전체 import 경로 수정 작업으로 인해 아키텍처 개선이 지연된다.
4.  개발자 인지 부하 증가: 복잡한 경로 계산은 개발자가 본질적인 로직 구현보다 경로 관리에 더 많은 인지적 리소스를 사용하게 만든다.

### 별칭으로 상대경로 문제 해결하기

모듈 별칭을 적용하면 위의 문제들이 다음과 같이 해결된다.

```ts
// 구조적으로 명확하고 가독성이 높은 import 경로
import { Button } from '@components/common/Button';
import { Input } from '@components/common/Input';
import { useAuth } from '@hooks/useAuth';
import { formatDate } from '@utils/dateUtils';
import { API_ENDPOINTS } from '@config/constants';
```

이 방식의 기술적 이점은 다음과 같다.

1.  절대 경로 기반 참조: 프로젝트 루트를 기준으로 한 일관된 참조 시스템 제공
2.  모듈 의존성 명시화: 코드 내 의존성 관계를 시각적으로 명확하게 표현
3.  구조적 리팩토링 내구성: 파일 이동 시에도 import 경로 변경 불필요
4.  모듈 경계 명확화: 프로젝트 아키텍처 내 각 모듈의 역할과 책임을 경로 체계를 통해 명시

## tsconfig와 Next.js에서 모듈 별칭 설정하기

### TypeScript(tsconfig.json) 설정

TypeScript에서는 tsconfig.json을 통해 경로 별칭을 설정할 수 있으며, 추가적인 최적화 옵션을 포함한 고급 구성은 다음과 같다.

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@hooks/*": ["src/hooks/*"],
      "@services/*": ["src/services/*"],
      "@utils/*": ["src/utils/*"],
      "@models/*": ["src/types/*"],
      "@assets/*": ["src/assets/*"],
      "@contexts/*": ["src/contexts/*"],
      "@constants/*": ["src/constants/*"]
    },
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["node_modules", "build", "dist"]
}
```

이 구성은 경로 매핑만이 아니라 TypeScript의 모듈 해석 알고리즘과 통합되어 타입 검사와 코드 네비게이션을 최적화한다.

타입 폴더의 별칭을 `@types/*`로 짓지는 않는다. `@types/`는 타입 선언 패키지가 쓰는 이름이라 이 이름으로 import하면 TypeScript가 `Cannot import type declaration files` 오류(TS6137)를 낸다.

### Next.js의 Webpack 설정

> Next.js는 `tsconfig.json`의 `paths`와 `baseUrl`을 기본으로 지원한다. 별칭만 필요하다면 아래 webpack 설정은 없어도 된다.

Next.js에서는 Webpack 구성을 확장하여 모듈 별칭을 설정하는데, 성능 최적화까지 고려한 구성은 다음과 같다.

```ts
const path = require('path');

module.exports = {
  webpack: (config, { dev, isServer }) => {
    // 모듈 별칭 설정
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@styles': path.resolve(__dirname, 'src/styles'),
      '@public': path.resolve(__dirname, 'public'),
    };
    
    // 개발 환경에서 소스맵 최적화
    if (dev && !isServer) {
      config.devtool = 'eval-source-map';
    }
    
    // 프로덕션 환경에서 번들 최적화
    if (!dev) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          }
        }
      };
    }
    
    return config;
  },
};
```

이 구성은 모듈 별칭을 설정하는 동시에 개발 및 프로덕션 환경에 최적화된 웹팩 설정을 제공한다.

### FSD 아키텍처와 별칭 함께 쓰기

Feature-Sliced Design(FSD) 아키텍처는 모듈 별칭과 시너지가 크며, 이를 최대한 활용한 구성은 다음과 같다. FSD 자체는 [FSD 가이드](/posts/fsd-guide/)에 정리해 두었다.

```ts
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@app/*": ["src/app/*"],
      "@pages/*": ["src/pages/*"],
      "@widgets/*": ["src/widgets/*"],
      "@features/*": ["src/features/*"],
      "@entities/*": ["src/entities/*"],
      "@shared/*": ["src/shared/*"]
    }
  }
}
```

이 구성은 FSD의 계층 구조를 경로 이름에 그대로 드러낸다. alias는 어느 레이어에서 가져오는지 보이게 할 뿐이고 의존 방향을 지키게 하는 일은 lint가 맡는다.

```ts
// 계층 간 의존성 방향을 명시적으로 보여주는 import 구조
import { AppProvider } from '@app/providers';
import { ProfilePage } from '@pages/profile';
import { Header, Footer } from '@widgets/layout';
import { LoginForm } from '@features/auth';
import { User, Product } from '@entities/models';
import { Button, Input, formatCurrency } from '@shared/ui';
```

processes 레이어는 지금 폐지돼서 예시에서 뺐다. Next.js에서는 `pages` 폴더 이름이 라우터와 겹치므로 이름을 바꿔야 한다. 그 내용은 FSD 가이드에 있다. widgets 레이어도 지금은 쓰지 않는다. 이유는 [FSD는 왜 Widgets 레이어를 권하지 않게 됐을까](/posts/fsd-2026-widgets/)에 적었다.

## barrel 패턴으로 모듈 캡슐화하기

### 공개 API로 내부 구현 감추기

barrel 패턴은 디렉토리의 index.ts에서 하위 모듈을 한데 re-export해 하나의 진입점으로 import하게 하는 방식이다. import를 편하게 하는 데 그치지 않고 모듈의 내부 구현을 캡슐화하고 안정적인 공개 API를 제공하는 메커니즘으로 활용할 수 있다.

```ts
// components/common/index.ts
// 공개 API로 노출할 컴포넌트만 선택적으로 export
export { Button } from './Button';
export { Input } from './Input';
export { Select } from './Select';
export type { ButtonProps, InputProps, SelectProps } from './types';

// 내부 구현 세부사항은 노출하지 않음
// export { useButtonFocus } from './hooks'; - 노출하지 않음
```

이 접근 방식의 장점은 다음과 같다.

1.  모듈 경계 명확화: 공개 API와 내부 구현을 명확히 구분
2.  버전 간 호환성 유지: 내부 구현 변경 시에도 공개 API 안정성 확보

### 계층적 barrel 패턴

대규모 프로젝트에서는 계층적 barrel 패턴을 적용하여 모듈 구조를 더욱 체계화할 수 있다.

```text
src/
├── components/
│   ├── common/
│   │   ├── inputs/
│   │   │   ├── TextInput.tsx
│   │   │   ├── NumberInput.tsx
│   │   │   ├── DatePicker.tsx
│   │   │   └── index.ts  // 1차 barrel
│   │   ├── buttons/
│   │   │   ├── PrimaryButton.tsx
│   │   │   ├── SecondaryButton.tsx
│   │   │   └── index.ts  // 1차 barrel
│   │   ├── layout/
│   │   │   ├── Card.tsx
│   │   │   ├── Panel.tsx
│   │   │   └── index.ts  // 1차 barrel
│   │   └── index.ts      // 2차 barrel (통합 export)
│   └── index.ts          // 3차 barrel (최상위 export)
```

이에 대응하는 코드 구조는 다음과 같다.

```ts
// components/common/inputs/index.ts (1차 barrel)
export { TextInput } from './TextInput';
export { NumberInput } from './NumberInput';
export { DatePicker } from './DatePicker';
export type { InputProps } from './types';

// components/common/index.ts (2차 barrel)
export * from './inputs';
export * from './buttons';
export * from './layout';

// components/index.ts (3차 barrel)
export * from './common';
export * from './specialized';
export * from './templates';
```

이 패턴으로 사용처에 따라 다양한 import 수준을 제공할 수 있다.

```ts
// 특정 컴포넌트만 필요한 경우
import { TextInput } from '@components/common/inputs';

// 관련 컴포넌트 그룹이 필요한 경우
import { TextInput, NumberInput, DatePicker } from '@components/common/inputs';

// 일반적인 공통 컴포넌트가 필요한 경우
import { TextInput, PrimaryButton, Card } from '@components/common';

// 모든 컴포넌트에 접근이 필요한 경우
import { TextInput, PrimaryButton, SpecializedTable } from '@components';
```

지금은 이 계층적 barrel을 쓰지 않는다. `index.ts`가 층마다 쌓이면 같은 것을 가져오는 경로가 여러 개가 되고, `export *`로 무엇이 공개되는지도 흐려진다. 이유는 글 끝에 적었다.

### barrel 패턴과 트리쉐이킹

barrel 패턴을 쓸 때 트리쉐이킹 최적화를 위한 모범 사례는 다음과 같다.

```ts
// ❌ 잘못된 방식 - 트리쉐이킹에 방해됨
import * as Components from '@components';
const { Button } = Components;

// ✅ 올바른 방식 - 트리쉐이킹 최적화
import { Button } from '@components';
```

## 실제 프로젝트 적용 사례

실제 엔터프라이즈급 프로젝트에서 이러한 패턴을 적용한 결과는 다음과 같다.

1.  개발 속도 향상: 복잡한 경로 계산 없이 직관적인 import로 개발 흐름 유지
2.  리팩토링 효율성: 구조 변경 시 import 경로 수정 작업 감소
3.  코드 가독성: PR 리뷰 시 의존성 파악이 용이해져 리뷰 효율성 향상
4.  온보딩 시간 단축: 신규 개발자가 프로젝트 구조를 이해하는 시간 감소

barrel이 번들 크기나 빌드 속도를 줄여 주지는 않는다. 오히려 `index.ts`가 많아지면 개발 서버가 느려질 수 있고, 관련 없는 것을 한 파일로 묶으면 안 쓰는 코드가 함께 딸려 올 수 있다. 얻는 것은 경계와 가독성이다.

## 별칭과 barrel 패턴을 쓸 때 주의할 점

모듈 별칭과 barrel 패턴을 도입할 때 고려해야 할 기술적 측면은 다음과 같다.

1.  별칭 과다 사용 방지
    -   프로젝트의 논리적 구조를 반영하는 10개 내외의 핵심 별칭만 유지
    -   과도한 별칭은 오히려 학습 곡선을 가파르게 만듦
2.  트리쉐이킹 최적화
    -   대규모 모듈은 개별 import 사용 고려
    -   Webpack 분석 도구를 활용한 주기적인 번들 사이즈 모니터링
3.  IDE 통합 최적화
    -   VSCode에서의 자동 완성 및 네비게이션 지원을 위한 설정:

        ```json
        // .vscode/settings.json
        {
          "typescript.preferences.importModuleSpecifier": "non-relative"
        }
        ```

4.  지속적 통합 파이프라인 구성
    -   import 경로 일관성 검사를 위한 ESLint 규칙 적용:

        ```js
        // .eslintrc.js
        module.exports = {
          // ...
          rules: {
            'no-restricted-imports': [
              'error',
              {
                patterns: [
                  {
                    group: ['../*'],
                    message: 'Use aliases instead of relative imports',
                  },
                ],
              },
            ],
          },
        };
        ```

## 2026년 11월에 바꾼 것

이 글을 쓴 뒤로 barrel을 쓰는 기준이 달라졌다. FSD 공식 문서의 [Public API](https://fsd.how/docs/reference/public-api/)를 기준으로 삼았다.

**barrel은 슬라이스 루트에 하나만 둔다.** 공식 문서는 슬라이스가 있는 레이어에서 세그먼트 안에 `index.ts`를 두지 말라고 한다. 루트 `index.ts` 하나면 충분하고, `index.ts`가 많으면 개발 서버가 느려진다는 이유다. 앞에서 본 계층적 barrel과는 반대 방향이다.

```ts
// entities/game/index.ts — 슬라이스의 유일한 출입구
export { GameBoard } from './ui/GameBoard';
export { useGame } from './model/hooks/useGame';
export type { Game } from './model/types/game';
```

**`export *`는 쓰지 않는다.** 밖에서 실제로 쓰는 것만 이름을 하나씩 적는다. 공식 문서는 `export *`가 무엇이 공개되는지 찾기 어렵게 만들고, 내부 구현까지 실수로 내보내게 한다고 설명한다.

**슬라이스 안에서는 상대경로를 쓴다.** 앞에서는 `../*`를 ESLint로 막는 설정을 권했는데, 지금은 그렇게 하지 않는다. 공식 문서는 같은 슬라이스 안이면 상대경로를, 다른 슬라이스면 alias를 쓰라고 한다. 슬라이스 안에서 자기 `index.ts`를 거쳐 가져오면 순환 참조가 생기기 때문이다. alias는 슬라이스 밖으로 나갈 때만 쓴다.

**shared의 `ui`와 `lib`는 하나로 묶지 않는다.** 서로 관련 없는 것들의 모음이라, `index.ts` 하나로 묶으면 번들러에 따라 하나만 가져와도 나머지가 함께 딸려 올 수 있다. 공식 문서는 항목마다 진입점을 따로 두라고 한다.

```ts
// 이전
import { Button, Input } from '@shared/ui';

// 지금
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
```

정리하면 barrel은 "모듈의 출입구"로만 쓰고, 편하게 가져오려고 층층이 쌓지 않는다.

## 결론

모듈 별칭과 barrel 패턴은 코드 스타일 선호가 아니라 확장 가능하고 유지보수하기 쉬운 코드베이스를 구축하기 위한 견고한 아키텍처 패턴이다.

처음에는 사소해 보일 수 있지만, 프로젝트가 성장함에 따라 이러한 패턴의 가치는 기하급수적으로 증가한다.

프로젝트 초기 단계에서 이러한 패턴을 도입하는 데 드는 약간의 설정 비용은 장기적인 개발 생산성 향상과 기술 부채 감소로 충분히 보상받을 수 있다.

새로운 프로젝트를 시작할 때마다 이러한 패턴을 기본 설정으로 도입한다면, 보다 견고하고 유지보수가 용이한 코드베이스를 구축할 수 있을 것이다.

공개 API로만 import하는 규칙을 lint로 강제하는 방법은 [FSD 규칙을 문서 대신 ESLint로 강제하기](/posts/fsd-eslint-boundaries/)에 정리했다.
