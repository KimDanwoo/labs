---
title: '패키지 매니저 알아보기'
date: 2024-04-15
description: 'npm vs Yarn vs pnpm'
thumbnail: './thumbnail.png'
category: 'react'
isHidden: false
---

## Introduction

Node 패키지 관리의 역사는 npm으로 시작하여, 현재는 npm, yarn classic, yarn berry, pnpm이라는 네 가지 주요 선택지가 있다. 이 패키지 관리자들은 모두 기본적인 기능을 제공하며, 설치 속도, 디스크 사용량, 워크플로우에 따라 선택할 수 있다.

## npm

- **설명**: Node.js에 기본 통합된 패키지 매니저.
- **장점**: 간단하고 사용하기 쉬움.
- **단점**: `node_modules` 구조가 비효율적.
- **설치**: Node.js에 내장됨.
- **보안**: 오래된 역사를 가진 만큼 여러 보안 사건이 있었음. 최신 버전은 SHA-512 알고리즘으로 무결성 확인.

### npm 프로젝트 구조

```plaintext
.
├── node_modules/
├── .npmrc
├── package-lock.json
└── package.json
```

## Yarn Classic

- **설명**: Facebook에서 개발한 npm 대체 패키지 매니저.
- **장점**: 더 나은 속도, 보안성, 모노레포 지원.
- **단점**: 복잡한 설정.
- **설치**: `npm install -g yarn`
- **보안**: 체크섬으로 무결성 확인, 의심스러운 패키지 설치 방지. Yarn Berry는 명시된 바이너리만 실행 가능.

### Yarn Classic 프로젝트 구조

```plaintext
.
├── .yarn/
│   ├── cache/
│   └── releases/
│       └── yarn-1.22.17.cjs
├── node_modules/
├── .yarnrc
├── package.json
└── yarn.lock
```

## pnpm

- **설명**: 효율적인 디스크 사용을 목표로 하는 패키지 매니저.
- **장점**: 단일 복사본 저장으로 중복 감소, 빠른 설치 속도.
- **단점**: 생태계가 npm/yarn보다 작음.
- **설치**: `npm install -g pnpm`
- **보안**: 체크섬으로 무결성 확인, 호이스팅을 하지 않아 보안성 향상.

## pnpm 프로젝트 구조

```plaintext
.
├── node_modules/
├── pnpm-lock.yaml
├── package.json
└── .npmrc
```

## Yarn Berry

- **설명**: Yarn Classic의 업그레이드 버전.
- **장점**: Plug'n'Play로 `node_modules` 제거, 성능 및 디스크 사용 개선.
- **단점**: 새로운 방식에 대한 적응 필요.
- **설치**: `yarn set version berry`
- **pnp**:Yarn Berry의 Plug'n'Play(PnP)는 전통적인 node_modules 폴더를 제거하고, 대신 의존성을 단일 .pnp.cjs 파일에 기록하는 시스템이다. 이는 파일 시스템에서 패키지 파일을 압축된 상태로 .yarn/cache에 저장하고, 런타임에 패키지를 즉시 사용할 수 있도록 한다. 이 방식은 설치 속도를 크게 향상시키고, 디스크 사용량을 줄이며, 의존성 충돌을 방지한다. PnP는 의존성을 명확하게 정의하고, 각 패키지의 정확한 위치를 지정해주므로 보안성도 높다.

### Yarn Berry (with node_modules) 프로젝트 구조

```plaintext
.
├── .yarn/
│   ├── cache/
│   └── releases/
│       └── yarn-3.1.1.cjs
├── node_modules/
├── .yarnrc.yml
├── package.json
└── yarn.lock
```

### Yarn Berry (with PnP) 프로젝트 구조

```plaintext
.
├── .yarn/
│   ├── cache/
│   ├── releases/
│       └── yarn-3.1.1.cjs
│   ├── sdk/
│   └── unplugged/
├── .pnp.cjs
├── .pnp.loader.mjs
├── .yarnrc.yml
├── package.json
└── yarn.lock
```

## 성능과 디스크 관리의 효율성

- Yarn Berry + Plug'n'Play가 가장 빠르고 디스크 효율적.
- pnpm이 뒤를 이음.

## 결론

모든 패키지 매니저는 사용하기에 충분한 기능을 제공하지만, 각기 다른 내부 동작 방식을 가지고 있다. pnpm은 성능과 디스크 효율성이 뛰어나고, yarn berry는 혁신적인 Plug'n'Play를 제공한다. npm은 풍부한 문서와 안정성을 제공하지만, 성능 면에서 뒤처진다. 각자의 필요에 맞는 패키지 매니저를 선택하면 된다.
