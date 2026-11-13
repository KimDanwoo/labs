---
title: "FSD 2.1은 무엇이 달라졌을까? Page-first를 앱 일곱 개에 적용해 본 결과"
description: "FSD 2.0의 Feature 중심 구조가 2.1에서 Page-first로 바뀐 이유와 차이를 짚고, Next.js 앱 일곱 개에서 한 페이지에서만 쓰던 슬라이스를 페이지 안으로 옮긴 전후 구조를 정리해요."
publishedAt: "2025-11-30T14:49:57+09:00"
updatedAt: "2026-11-13T13:00:00+09:00"
category: "dev"
tags: ["fsd"]
legacyUrl: "https://dansoon-dev.tistory.com/23"
thumbnail: "./thumbnail.jpg"
cover: "./cover.webp"
---

Feature-Sliced Design(FSD)은 기능 단위로 코드를 나누는 구조적 설계 방식입니다. 2.1 버전에서 가장 크게 달라진 점은 화면을 분해하는 기준이 ‘Feature 중심’에서 ‘Page 우선(Page-first)’으로 바뀌었다는 점입니다.

기존 구조를 뒤집었다기보다 현실적인 개발 흐름을 더 잘 반영하도록 멘탈 모델을 재정의한 변화라고 볼 수 있습니다. FSD의 레이어 구성 자체가 궁금하다면 [FSD 가이드](/posts/fsd-guide/)를 먼저 보면 좋습니다.

## FSD 2.0: Feature가 중심인 구조

FSD 2.0에서는 Feature가 가장 중요한 단위였습니다.

```text
Page
 └─ Feature
      └─ Entity
```

특징은 다음과 같습니다.

-   Feature가 기능·데이터·UI를 모두 포함하는 중심 레이어
-   Page는 Feature를 조합하는 얇은 계층
-   Feature 단위 재사용성과 도메인 중심 구조화에 초점

단점은 시간이 지날수록 Feature가 비대해지고 Page의 역할이 점점 모호해진다는 점입니다.

## 왜 FSD 2.1이 필요했나?

실제 서비스는 “기능”보다 “페이지 흐름(Flow)”이 중심입니다. 예를 들면 이런 경우입니다.

-   리스트 페이지에서 필터 → 정렬
-   상세 페이지에서 여러 데이터 조합
-   페이지 단위 전처리/분기
-   특정 페이지에서만 필요한 UI·조건

이런 흐름은 Feature 내부에 담기 어렵고, 결국 Page가 자연스럽게 더 많은 책임을 갖게 됩니다.

> 현실적인 개발 방식이 이미 Page 중심이었고,
> 
> FSD 2.1은 이를 구조적으로 명확히 정리한 버전입니다.

## FSD 2.1: Page-first 구조

FSD 2.1에서는 Page에서 흐름을 정의하고, 그 아래에 Widget과 Feature가 배치되는 형태로 분해 기준이 변경됐습니다.

### 레이어별 책임

-   **Page**
    -   화면 흐름(Flow) 정의
    -   필요한 데이터 준비
    -   어떤 Widget/Feature를 사용할지 결정하는 상위 조립 계층
-   **Widget**
    -   페이지를 구성하는 UI 조각을 묶는 단위
    -   2.0에도 존재했지만 2.1에서 역할이 더 명확해짐
    -   다만 2026년부터 공식 문서는 Widgets 레이어를 권장하지 않습니다([FSD는 왜 Widgets 레이어를 권하지 않게 됐을까](/posts/fsd-2026-widgets/))
-   **Feature**
    -   단일 기능 구현 (UI + 최소한의 로직)
    -   이제 페이지 조립 역할을 갖지 않음
-   **Entity**
    -   순수 도메인/데이터 모델

### 레이어 규칙은 2.0과 2.1에서 같다

분해 기준이 바뀌어도 FSD의 의존 규칙은 그대로입니다. 레이어는 위에서 아래로 app, pages, widgets, features, entities, shared 순서이고, 한 레이어의 모듈은 자기보다 아래 레이어만 import할 수 있습니다. 같은 레이어 안에서 슬라이스끼리 서로 import하는 것도 원칙적으로 허용되지 않습니다. 다만 FSD는 entities끼리 관계를 표현해야 할 때를 위해 `@x`라는 교차 import용 공개 API를 예외로 둡니다(예: `entities/A/@x/B.ts`로 B에게만 노출). 각 슬라이스는 index 파일로 공개 API를 정해 두고 바깥에서는 그 진입점만 사용합니다. 슬라이스 내부는 ui, model, api 같은 세그먼트로 나눕니다.

이 규칙 덕분에 Page가 흐름을 맡아도 구조가 무너지지 않습니다. Page는 Widget과 Feature를 가져다 쓸 수 있지만, 반대로 Feature가 Page를 참조하는 일은 규칙상 불가능하기 때문입니다. 공개 API와 import 경로 관리는 [import 경로 관리 알아보기](/posts/import-path-alias-barrel-fsd/)에서 다룬 barrel 패턴과 이어집니다.

## FSD 2.0과 2.1 핵심 차이 비교

| 항목 | FSD 2.0 | FSD 2.1 |
| --- | --- | --- |
| 분해 기준 | Feature 중심 | Page-first(페이지 먼저) |
| Feature 역할 | 기능·데이터·UI 모두 담당, 비대해지기 쉬움 | 단일 기능·UI 단위로 축소 |
| Page 역할 | 얇은 조립 계층 | 흐름·데이터 준비를 맡는 핵심 계층 |
| Widget | 개념은 있었으나 비중이 작음 | Page와 Feature 사이의 UI 조합 레이어로 명확해짐 |
| 구조 의도 | 도메인 중심 분리 | 실제 화면 구성/흐름 중심 분리 |

## Page-first가 코드 배치에 주는 기준

Page가 흐름과 데이터 준비를 맡는다는 말은 곧 코드를 처음 둘 자리가 Page라는 뜻입니다. 특정 페이지에서만 필요한 UI나 분기 조건은 그 Page 슬라이스 안에 두면 됩니다. 같은 코드가 다른 페이지에서도 필요해지는 시점에 Widget이나 Feature로 내리면 되므로, 재사용될지 모르는 코드를 미리 Feature로 분리할 필요가 줄어듭니다.

2.0 방식에서는 이 판단이 거꾸로였습니다. 기능이 보이면 먼저 Feature로 만들고 Page가 이를 조립했기 때문에, 한 페이지에서만 쓰는 로직까지 Feature에 쌓이기 쉬웠습니다. 앞에서 짚은 Feature 비대화는 이런 배치 순서에서 생깁니다.

## Page-first로 앱 일곱 개를 다시 나눠 보니

이 기준을 직접 적용해 본 적이 있습니다. 2026년 11월, 개인 프로젝트를 모아 둔 labs 저장소의 Next.js 앱 일곱 개를 FSD 공식 문서 기준으로 다시 정리했습니다([PR #272](https://github.com/KimDanwoo/labs/pull/272)). 이 저장소는 Next.js 폴더 이름과 겹치지 않도록 Pages 레이어를 `views`라고 부릅니다. 공식 [v2.0에서 v2.1로 옮기는 가이드](https://feature-sliced.design/docs/guides/migration/from-v2-0)도 페이지에서 시작하고 거기서 멈춰도 된다고 권합니다.

옮길지 말지는 공식 문서 [Layers](https://feature-sliced.design/docs/reference/layers)의 두 문장으로 정했습니다.

> A good indicator that something needs to be a feature is the fact that it is reused on several pages.
>
> If a UI block on a page is not reused, it's perfectly fine to keep it inside the page slice.

여러 페이지에서 다시 쓰이는 것이 Feature로 둘 만하다는 신호이고 재사용되지 않는 UI 블록은 Page 슬라이스 안에 두어도 된다는 뜻입니다. 그래서 슬라이스마다 가져다 쓰는 페이지 수를 세고 한 페이지에서만 쓰는 슬라이스는 그 페이지 안으로 옮겼습니다.

![여러 칸에 흩어져 있던 상자가 각 방으로 옮겨지고 공용 선반에는 몇 개만 남는 모습](./page-first.webp)

스도쿠 앱(awesome-sudoku)의 `src/` 아래가 이렇게 바뀌었습니다.

```text
# 옮기기 전
entities/  game · session · theme
features/  auth · game-record · game-stats · leaderboard · profile · sudoku-game · theme
widgets/   game-board · game-controls · game-header · game-overlays · game-result
views/     home · leaderboard · profile

# 옮긴 뒤
entities/  game · session · theme
features/  theme
views/     home · leaderboard · profile
```

게임 화면에서만 쓰던 `sudoku-game`·`auth`·`game-record`와 위젯 다섯 개는 `views/home`으로, `leaderboard`는 `views/leaderboard`로, `profile`·`game-stats`는 `views/profile`로 들어갔습니다. 남은 슬라이스는 여러 페이지가 함께 쓰는 것뿐입니다. `features/theme`은 home·leaderboard·profile 세 페이지가 가져다 쓰고 `entities/game`과 `entities/session`은 세 페이지와 앱 전체 프로바이더가 씁니다.

앱 일곱 개를 합치면 features·entities 슬라이스 18개와 위젯 14개가 페이지 안으로 들어갔습니다. 나머지 위젯 2개는 페이지가 아닌 곳으로 갔습니다. 앱 전체 레이아웃은 `src/app`으로, 질문을 새로 만드는 화면과 수정하는 화면이 함께 쓰는 입력 폼은 features로 옮겼습니다. 정리 후 features·entities가 남은 앱은 세 개입니다. 화면이 하나뿐인 hub·komorebi·prairie는 `views` 슬라이스 하나만 남았습니다.

앞에서 Page-first의 약점으로 짚은 "Page 슬라이스가 커지는 문제"도 실제로 나타났습니다. 테스트 파일을 빼고 세면 komorebi의 `views/walk`는 96개, prairie의 `views/ride`는 88개 파일이 됐습니다. 두 슬라이스 모두 안을 `ui`·`model`·`lib` 같은 세그먼트로 나눠 두었습니다. 지금 저장소가 따르는 기준 전체는 [FSD 가이드: Next.js 앱 일곱 개에 적용하며 정한 기준](/posts/fsd-guide/)에, 위젯을 다시 분류한 과정은 [FSD는 왜 Widgets 레이어를 권하지 않게 됐을까](/posts/fsd-2026-widgets/)에 정리했습니다.

## FSD 2.1의 장점

-   Page 단위 흐름이 선명해짐
-   Feature가 가벼워지고 재사용성이 증가
-   Page → Feature 흐름이 단순해짐
-   실제 화면 구성 방식과 디렉토리 구조가 자연스럽게 일치
-   협업 시 “이 로직이 어디에 있어야 하는가?” 기준이 명확해짐

> 실제 개발 과정을 구조가 그대로 반영하게 됩니다.

## Page-first 구조의 한계와 대안

Page-first에도 약점이 있습니다. 페이지가 흐름과 데이터 준비를 모두 맡으므로 화면이 복잡해지면 Page 슬라이스 자체가 커질 수 있습니다. 페이지 사이에서 비슷한 코드가 복사된 채 남고, 아래 레이어로 내리는 시점을 놓치는 일도 생길 수 있습니다. Page 슬라이스가 커지면 Widget으로 쪼개고, 반복되는 코드가 보이면 Feature나 Entity로 내리는 정리가 계속 필요합니다.

대안도 있습니다. 도메인 경계가 뚜렷하고 기능이 여러 화면에 고르게 걸쳐 있는 서비스라면 2.0처럼 Feature·Entity 중심으로 나누는 편이 맞을 수 있습니다. FSD 없이 기능별 폴더로만 나누는 방식은 규칙이 느슨해 시작이 가볍지만, import 방향을 강제하는 장치가 없어 규모가 커질수록 의존이 얽히기 쉽습니다. 어느 쪽이든 화면 단위로 일하는 팀인지, 도메인 단위로 일하는 팀인지가 선택 기준이 됩니다. FSD 패턴을 적용하는 리팩토링은 [FSD 패턴으로 상태 관리 리팩토링하기](/posts/fsd-state-management-refactoring/)에서 이어집니다.

## 정리

FSD 2.1의 변화는 갑작스러운 규칙 변경이 아니라, 현실적인 화면 구성 방식이 Page 중심이라는 사실을 구조에 반영한 결과입니다.

-   2.0은 기능 중심
-   2.1은 페이지 흐름 중심

2026년 공식 문서에서 이어진 변화는 [FSD는 왜 Widgets 레이어를 권하지 않게 됐을까](/posts/fsd-2026-widgets/)에 정리했습니다.
