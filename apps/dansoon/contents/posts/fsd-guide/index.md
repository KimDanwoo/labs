---
title: "Feature-Sliced Design(FSD) 가이드: Next.js 앱 일곱 개에 적용하며 정한 기준"
description: "FSD의 레이어·슬라이스·세그먼트와 import 규칙을 공식 문서 기준으로 정리하고, Next.js 앱 일곱 개에 적용하며 정한 기준과 부딪힌 문제를 담았어요. 2026년 바뀐 Next.js 가이드도 반영했어요."
publishedAt: "2024-12-17T16:56:31+09:00"
updatedAt: "2026-11-10T18:00:00+09:00"
category: "dev"
tags: ["fsd","architecture"]
legacyUrl: "https://dansoon-dev.tistory.com/13"
thumbnail: "./thumbnail.jpg"
cover: "./cover.webp"
---

> 2024년 12월에 쓴 글을 2026년 11월에 다시 썼다. 그사이 FSD는 2.1이 됐고, 공식 Next.js 가이드와 Next.js의 파일 규칙도 바뀌었다. 지금 쓰는 기준과 바뀐 내용을 반영했다.

## 1. 왜 FSD였나

2024년, 회사에서 PHP와 Vue로 만든 레거시 서비스를 Next.js로 옮기게 됐다. 기존 코드는 컴포넌트끼리 서로 깊게 얽혀 있었고, 같은 도메인 로직이 여러 곳에 흩어져 있었다. 새로 들어온 사람이 "이 기능은 어디를 고치면 되나"를 찾는 데만 한참 걸렸다.

옮기는 김에 폴더 구조의 기준부터 정하기로 했고, 그 기준으로 Feature-Sliced Design(FSD)을 골랐다. 폴더 이름과 import 방향을 규칙으로 정해 두면 "어디에 둘까"를 매번 토론하지 않아도 된다는 점이 컸다.

그 뒤로 개인 프로젝트 모노레포의 Next.js 앱 일곱 개도 전부 FSD로 나눴다. 아래 내용은 그 과정에서 정리한 것이다.

## 2. 레이어 한눈에 보기

FSD는 코드를 **레이어 → 슬라이스 → 세그먼트** 세 단계로 나눈다. 레이어는 위에서부터 이렇다.

| 레이어 | 역할 | 예 |
|---|---|---|
| app | 앱 전역 설정 | 프로바이더, 전역 스타일 |
| pages | 화면 하나 | 홈, 상품 상세 |
| widgets | 여러 화면에서 쓰는 큰 UI 블록 | 헤더, 상품 목록 |
| features | 사용자가 하는 행동 단위 기능 | 장바구니 담기, 필터 |
| entities | 비즈니스 개념 | 상품, 사용자 |
| shared | 도메인과 무관한 공용 코드 | UI 기본 요소, API 클라이언트 |

예전에 있던 processes 레이어는 지금 폐지됐다. 공식 문서는 레이어 의미가 표준화돼 있으니 새 레이어를 추가하지 말라고 한다([Layers](https://fsd.how/docs/reference/layers/)).

레이어 안은 **슬라이스**로 나뉜다. 슬라이스는 `product`, `cart`처럼 비즈니스 도메인으로 이름을 짓고, 이름 규칙은 따로 없다. 슬라이스 안은 다시 **세그먼트**로 나뉜다. 표준 세그먼트는 `ui`, `api`, `model`, `lib`, `config`이고, 필요하면 직접 만들어도 된다. 대신 이름은 내용물의 종류가 아니라 목적을 나타내야 한다. 공식 문서는 `components`, `hooks`, `types`를 나쁜 이름의 예로 든다([Slices and segments](https://fsd.how/docs/reference/slices-segments/)).

2.1에서 화면을 나누는 기준이 Feature 중심에서 Page-first로 바뀐 이야기는 [FSD 2.1은 무엇이 달라졌을까?](/posts/fsd-2-1/)에, 2026년 공식 문서가 widgets와 entities를 줄이라고 권하게 된 이야기는 [FSD는 왜 Widgets 레이어를 권하지 않게 됐을까](/posts/fsd-2026-widgets/)에 정리했다.

## 3. import 규칙

FSD에서 가장 중요한 규칙은 하나다.

> 슬라이스 안의 모듈은 자기보다 **엄격하게 아래** 레이어에 있는 슬라이스만 import할 수 있다.

예전 글에서는 이 규칙을 '의존성 역전'이라고 불렀는데 틀린 이름이었다. 의존성 역전은 추상화로 의존 방향을 뒤집는 설계 원칙이고, FSD 규칙은 단순히 위에서 아래로만 의존하게 하는 단방향 규칙이다. 공식 문서도 "레이어의 import 규칙"이라고 부른다.

"엄격하게 아래"라는 말에는 규칙 하나가 더 숨어 있다. **같은 레이어의 다른 슬라이스끼리는 import할 수 없다.** `features/cart`가 `features/filter`를 가져다 쓰면 안 된다. 예전 글에는 이 규칙이 빠져 있었다. 엔티티끼리 정말 서로 알아야 할 때를 위해 공식 문서는 `@x` 표기로 교차 import용 공개 API를 따로 두는 방법을 안내한다.

예외는 app과 shared다. 두 레이어는 슬라이스 없이 세그먼트로만 이뤄져서, 안에서는 서로 자유롭게 import할 수 있다.

## 4. 내가 정한 기준

공식 규칙만으로는 매번 판단이 갈리는 부분이 남았다. 지금 모노레포에서 쓰는 기준은 이렇다.

**Next.js 라우팅과 FSD app 레이어를 나눈다.** 루트의 `app/`은 Next.js 라우팅 진입점으로, `page.tsx`·`layout.tsx`만 얇게 두고 화면은 FSD 쪽에 맡긴다. FSD `app` 레이어는 `src/app/`에 두고 프로바이더와 전역 스타일만 넣는다. 둘을 합치면 라우팅 파일과 전역 설정이 한 폴더에서 섞인다.

**pages 레이어는 `views`라고 부른다.** Next.js는 App Router를 써도 `src/pages` 폴더가 있으면 Pages Router로 읽으려 한다. 그래서 FSD pages 레이어의 이름을 처음부터 `views`로 바꿨다.

**widgets 레이어는 쓰지 않는다.** 한 화면에서만 쓰는 블록은 그 화면(views) 안에 두고, 여러 화면에서 쓰는 동작은 features로, 앱 전체 레이아웃은 `src/app`으로 보낸다.

**쓰는 화면이 하나뿐이면 그 화면 안에 둔다.** features와 entities는 지금 실제로 여러 화면에서 쓰는 코드만 남긴다. 화면이 하나뿐인 앱은 `views` 슬라이스 하나에 거의 모든 코드가 들어간다. 지금 앱 일곱 개의 `src/` 아래를 보면 이렇다.

| 앱 | 있는 레이어 |
|---|---|
| design, hub, komorebi | app, views |
| prairie | app, views, shared |
| soundlab | app, views, entities, shared |
| awesome-sudoku, fe-deep | app, views, features, entities, shared |

**공유 디자인 시스템이 shared UI를 맡는다.** 버튼 같은 표시용 기본 요소는 모노레포의 UI 패키지에서 가져오고, 앱의 `src/shared`에는 그 앱에서만 쓰는 공용 코드만 둔다. shared 바로 아래에는 `ui`·`lib`·`api`·`config` 세그먼트만 두고, 도메인 이름이 붙은 폴더는 쓰는 슬라이스로 옮긴다.

**슬라이스는 루트 `index.ts`로만 내보낸다.** 밖에서는 `@entities/game`처럼 슬라이스 이름까지만 적는다. 슬라이스 안에서는 `../model/types/game`처럼 상대경로로 파일을 직접 가져오고, 자기 `index.ts`는 거치지 않는다. `index.ts`에는 밖에서 실제로 쓰는 것만 이름을 하나씩 적는다. shared는 슬라이스가 없으니 `@shared/lib/cn`, `@shared/ui/BottomSheet`처럼 항목 단위로 가져온다.

**전역 상태는 쓰는 슬라이스의 `model`에 둔다.** 여러 화면에서 쓰게 되면 그때 entities로 내린다.

이 가운데 import 기준은 2026년 11월에 바꾼 것이다. 그전에는 반대였다. `@widgets/project-grid/ui`처럼 세그먼트마다 `index.ts`를 두고 경로에 `ui`인지 `model`인지가 보이게 했고, 슬라이스 루트의 `index.ts`는 일부러 만들지 않았다. 공식 문서는 정확히 그 반대를 권한다. 슬라이스가 있는 레이어에서는 세그먼트 안에 `index.ts`를 두지 말고 루트 하나만 두라고 하고, `shared/ui`와 `shared/lib`는 하나로 묶지 말고 항목마다 따로 두라고 한다([Public API](https://fsd.how/docs/reference/public-api/)). 그래서 앱 일곱 개를 한꺼번에 공식 방식으로 옮겼다. 같은 때에 widgets 레이어를 없애고, 쓰는 화면이 하나뿐인 슬라이스를 화면 안으로 합쳤다. alias와 barrel 패턴 자체는 [import 경로 관리 알아보기](/posts/import-path-alias-barrel-fsd/)에 정리했다.

이 규칙들은 처음에 문서로만 적어 뒀는데, 새 코드를 쓸 때마다 어긋났다. 지금은 공유 ESLint 설정으로 막는다. 그 과정은 [FSD 규칙을 문서 대신 ESLint로 강제하기](/posts/fsd-eslint-boundaries/)에 있다.

## 5. Next.js에 적용하며 부딪힌 문제

### app·pages 폴더 이름 충돌

Next.js는 `app` 폴더를 App Router로, `pages` 폴더를 Pages Router로 쓴다. FSD 레이어 이름과 정확히 겹친다.

2024년에 따른 방법은 당시 공식 가이드와 같았다. Next.js의 `app/`을 프로젝트 루트로 빼고, FSD 레이어는 `src/` 아래에 둔다. 공식 가이드는 여기에 더해 루트에 빈 `pages/` 폴더를 하나 두라고 했다. 그래야 Next.js가 `src/pages`를 Pages Router로 착각하지 않는다.

```text
├── app/          # Next.js 라우팅
├── src/
│   ├── app/      # FSD app 레이어
│   ├── views/    # FSD pages 레이어(이름 변경)
│   ├── widgets/
│   ├── features/
│   ├── entities/
│   └── shared/
└── package.json
```

2026년 6월 공식 Next.js 가이드가 바뀌었다. 이제는 빈 폴더를 두는 대신 FSD 레이어 이름 자체를 `_app`, `_pages`로 바꾸라고 권한다. 어떤 라우터를 쓰든 두 레이어 모두 바꾸라는 것이다([Usage with Next.js](https://fsd.how/docs/guides/tech/with-nextjs/)). 나는 처음부터 이름을 바꾸는 쪽(`views`)이었는데, 공식 가이드도 같은 방향으로 바뀐 셈이다. 다만 공식 이름은 `views`가 아니라 `_pages`다. 2026년 11월 현재 한국어판 가이드에는 아직 반영되지 않았다.

정리하면 지금 쓰이는 방법은 세 가지다.

| 방법 | 구조 | 특징 |
|---|---|---|
| 빈 `pages/` 폴더 | 루트에 `app/`과 빈 `pages/`, FSD는 `src/`에 표준 이름 그대로 | 2026년 6월 이전 공식 권장. 용도를 모르는 빈 폴더가 남는다 |
| `views`로 이름 변경 | 루트 `app/`, FSD pages 레이어만 `src/views/` | 내가 쓰는 방법. 커뮤니티에서 많이 쓰지만 공식 이름은 아니다 |
| `_app`·`_pages` 접두사 | FSD `app`·`pages` 레이어 둘 다 이름 앞에 `_` | 2026년 6월 이후 공식 권장 |

### middleware 위치

Next.js는 요청을 가로채는 파일을 정해진 위치에서만 찾는다. FSD 레이어 안에 두면 인식하지 않으므로 루트(`app/`과 같은 위치)에 둬야 한다.

이 파일 이름도 바뀌었다. Next.js 16부터 `middleware.ts`는 `proxy.ts`로 이름이 바뀌었고, 예전 이름을 쓰면 deprecated 경고가 뜬다.

### Public API가 서버 코드를 클라이언트로 끌고 오는 문제

슬라이스마다 `index.ts`로 공개할 것만 내보내면, 클라이언트 컴포넌트가 그 `index.ts`를 import할 때 같은 파일에서 내보낸 서버 전용 코드까지 함께 읽힌다. 서버 전용 모듈을 클라이언트에서 쓴다는 에러가 여기서 났다.

2024년에는 shared 안에 `server-utils/`와 `utils/`를 따로 두는 식으로 피했다. 지금 공식 가이드는 슬라이스에 `index.server.ts`를 하나 더 두라고 한다. 서버 컴포넌트나 `server-only`로 표시한 데이터 접근 함수는 거기서만 내보내는 방식이다. 서버 코드를 shared로 따로 빼지 않고 슬라이스 안에 그대로 둘 수 있다는 점이 다르다. 지금은 나도 이 방식을 쓴다. 서버에서 데이터를 읽어 오는 화면은 `index.server.ts`로 내보내고, 라우팅 파일이 `@views/study/index.server`처럼 가져간다.

### 정적 리소스

폰트·이미지 같은 정적 파일은 shared 한곳에 모을 수도 있고 기능별로 나눌 수도 있다. 나는 폰트처럼 앱 전체에서 쓰는 파일은 `public/`에 두고, 특정 기능에서만 쓰는 이미지는 그 슬라이스 안 `assets/`에 두는 쪽을 택했다.

## 6. 지금 다시 보면

가장 크게 어긋난 건 경계였다. 2.0 방식대로 Feature 중심으로 나눴더니 프로젝트 안의 경계가 갈수록 어지러워졌다. 지금은 2.1의 Page-first로 바꿨다. 코드는 처음에 화면(views) 안에 두고, 여러 곳에서 쓰게 되면 그때 아래 레이어로 내린다.

규칙은 문서에 적어 두는 것만으로는 지켜지지 않았다. 새 코드마다 어긋나다가 lint로 막은 뒤에야 자리를 잡았다.

## FSD 글 읽는 순서

1. 이 글: 레이어·규칙과 내가 정한 기준
2. [FSD 2.1은 무엇이 달라졌을까?](/posts/fsd-2-1/): Feature 중심에서 Page-first로
3. [FSD는 왜 Widgets 레이어를 권하지 않게 됐을까](/posts/fsd-2026-widgets/): 2026년 공식 문서의 변화
4. [FSD 규칙을 문서 대신 ESLint로 강제하기](/posts/fsd-eslint-boundaries/): 규칙을 lint로 막기
5. [import 경로 관리 알아보기](/posts/import-path-alias-barrel-fsd/): alias와 barrel 패턴
6. 처음 적용했을 때의 기록: [FSD 패턴으로 상태 관리 리팩토링하기](/posts/fsd-state-management-refactoring/), [MSW로 테스트 코드를 작성하며 FSD 구조 보완하기](/posts/test-code-fsd-refactoring/)
