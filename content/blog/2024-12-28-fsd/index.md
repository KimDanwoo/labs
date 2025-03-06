---
title: '내가 보려고 정리한 FSD'
date: 2024-12-28
description: '내가 보려고 정리한 FSD'
category: 'design'
isHidden: true
thumbnail: './thumbnail.png'
---

## 들어가며

프론트엔드 프로젝트의 규모가 커지면 효율적인 코드 구조화의 중요성이 더욱 부각되기 마련이다. 이를 해결하기 위해 구조화된 설계와 디자인 패턴을 많이 사용하는 추세이다.

최근 PHP 와 Vue로 작성된 페이지를 Next.js로 마이그레이션 하는 과정에서 팀내 프로젝트 패턴을 통일하기 위해 FSD 방법론을 도입하려고한다.

Feature-Sliced Design(FSD) 아키텍처를 활용하고 이를 실제 프로젝트에 적용하는 방법에 대해 알아보자.

## FSD란?

Feature-Sliced Design은 프론트엔드 아키텍처 방법론으로, 비즈니스 로직을 기능(feature) 단위로 분할하고 계층화된 구조로 관리하는 접근 방식이다.

이는 프로젝트의 복잡성을 효과적으로 관리하고, 코드의 재사용성과 유지보수성을 향상시키는데 도움을 준다.

## 기본 원칙

1. **책임 분리**: 각 레이어와 슬라이스는 명확한 책임을 가지며, 한 가지 일만 수행한다.
2. **의존성 역전**: 상위 레이어는 하위 레이어에 의존할 수 있지만, 그 반대는 불가능하다.
3. **공유 영역 제한**: shared 폴더는 신중하게 관리되어야 하며, 무분별한 공유를 지양한다.
4. **기능 격리**: 각 기능은 독립적으로 개발, 테스트, 재사용될 수 있어야 한다.

## FSD 도입 배경

### 기존 구조의 한계점

- 컴포넌트와 로직의 낮은 재사용성
- 기능 단위의 낮은 응집도
- 새로운 팀원의 긴 온보딩 시간
- 비즈니스 로직과 UI 로직의 모호한 경계

### FSD 도입의 기대효과

- 명확한 계층 구조를 통한 코드 탐색성 향상
- 재사용 가능한 컴포넌트의 체계적 관리
- 비즈니스 로직의 명확한 분리
- 일관된 구조를 통한 개발 생산성 향상

## FSD의 핵심 레이어 구조

### app

애플리케이션의 핵심 설정을 담당하는 최상위 계층이다.

- 전역 상태 관리
- 라우팅 설정
- 스타일 테마 설정
- 다국어 처리 등 앱 전반의 기능 구성

### pages

실제 라우팅되는 페이지 컴포넌트들의 집합이다.

- 하위 레이어의 위젯과 피처들을 조합
- 페이지별 레이아웃 관리
- 데이터 흐름 제어

### widgets

독립적으로 재사용 가능한 큰 단위의 UI 블록이다.

- 여러 피처들의 조합으로 구성
- 예: 헤더, 푸터, 상품 목록 위젯

### features

특정 비즈니스 기능을 캡슐화한다.

- UI와 비즈니스 로직이 결합된 형태
- 예: 상품 필터링, 장바구니 추가 기능

### entities

핵심 비즈니스 엔티티 관련 로직을 포함한다.

- 도메인 모델과 타입 정의
- 엔티티 관련 API 통신 로직

### shared

프로젝트 전반에서 공유되는 유틸리티를 포함한다.

- 공통 UI 컴포넌트
- API 클라이언트
- 상수 및 유틸리티 함수

## 세그먼트 구조화 전략

각 레이어는 다음과 같은 세그먼트로 구조화된다:

### ui

- 순수 표현 컴포넌트
- 스타일링 관련 코드
- 상태나 비즈니스 로직 배제

### model

- 상태 관리 로직 (React Query, Zustand 등)
- 타입 정의
- 유효성 검증 로직

### api

- API 통신 관련 코드
- 데이터 변환 로직
- 에러 핸들링

### lib

- 유틸리티 함수
- 헬퍼 함수
- 비즈니스 로직과 무관한 순수 함수

## 프로젝트 구조 예시

```
src/
├── app/
│   ├── providers/
│   ├── styles/
│   └── index.tsx
├── pages/
│   ├── home/
│   ├── products/
│   └── index.tsx
├── widgets/
│   ├── header/
│   │   ├── ui/
│   │   ├── model/
│   │   └── lib/
│   └── product-list/
├── features/
│   ├── product-filter/
│   │   ├── ui/
│   │   ├── model/
│   │   ├── api/
│   │   └── lib/
│   └── add-to-cart/
├── entities/
│   ├── product/
│   │   ├── ui/
│   │   ├── model/
│   │   ├── api/
│   │   └── lib/
│   └── user/
└── shared/
    ├── ui/
    ├── api/
    ├── lib/
    └── config/
```

## 구현 가이드라인

### 레이어 간 의존성 규칙

- 상위 레이어는 하위 레이어만 참조 가능
- 순환 참조는 절대 금지
- shared 레이어는 모든 레이어에서 참조 가능
- 레이어와 세그먼트의 이름은 변경 불가

### 세그먼트 활용 원칙

- ui: 순수 표현 컴포넌트만 포함
- model: 상태 관리와 비즈니스 로직 집중
- api: 외부 통신 관련 로직 격리
- lib: 재사용 가능한 유틸리티 함수 모음

### 네이밍 컨벤션

- 폴더명: 케밥-케이스 사용 (예: product-list)
- 파일명: 파스칼케이스(컴포넌트), 기타파일명: 카멜케이스 (api, util)
- index.ts 파일을 통한 캡슐화

## Next.js에서 사용시 유의점

### app 폴더 네이밍의 충돌

**문제점**

- app router의 경우 app폴더를 경로로 사용한다.
- 반면 FSD 패턴에서 app 레이어는 애플리케이션 전반에 걸쳐 사용되는 provider, 전역스타일을 포함

**해결**

```
├── app/ # Next.js app directory
└── src/ # FSD layers
    ├── app/
    └── widget/
    └── feature/
    └── widget/
    └── shared/
```

### 2. middleware 인식 오류

**문제점**

- Next.js에서 middleware는 요청과 응답 사이에 실행되는 로직을 정의할 수 있는 중요한 파일
- FSD 레이어에 위치하게 되면 Next.js가 이를 미들웨어로 인식하지 않음

**해결**

```
├── app/ # Next.js app directory
├── middleware.ts # 루트 디렉토리에서 바로 작성해야 인식
└── src/ # FSD layers
    ├── app/
    └── widget/
    └── feature/
    └── widget/
    └── shared/
```

### 3. Public API 적용 시 코드 실행 환경 오류

**문제점**

- import한 파일을 모두 읽는 JS모듈 시스템의 실행 방식으로 인해 서버/클라이언트 실행환경 불일치
- 위 경우 클라이언트에서 서버 구성요소 사용 에러 발생

**해결**

```
├── app/ # Next.js app directory
└── shared/ # FSD layers
    ├── server-utils/
    └── utils/

```

### Next.js의 폴더 구조 예시

```
├── app/
├── └── layout.tsx
├── └── page.tsx
├── src/
├── └── pages/
├── └── widgets/
├── └── features/
├── └── entities/
├── └── shared/
├── middleware.ts
├── tsconfig.json
├── package.json
└── ...
```

### 4. 정적 리소스 관리

문제점

- font와 image같은 정적 리소스는 크게 두가지 방식으로 관리할 수 있다.
- shared 레이어 내부에서 관리하는 경우와 기능별로 분산 관리하는 경우가 있다.

해결

```

└── web
    ├── public/        # 웹앱 전용 정적 리소스
    │   ├── fonts/     # 폰트 파일 실제 위치
    │   └── static/
    │       └── images/
    ├── app/
    │   └── home/
    │   src/
    │   └── features/
    │       └── product/
    │           └── assets/  # 기능별 리소스
    └── package.json
```
