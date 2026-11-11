---
title: "25년 1분기 회고: 마이크로 프론트엔드, 모노레포, 디자인 시스템"
description: "방구하기 프로젝트에서 마이크로 프론트엔드 통합, OTAT 인증, 모노레포, 디자인 시스템을 다룬 1분기의 기술 과제와 성과를 돌아봐요."
publishedAt: "2025-03-14T16:30:47+09:00"
updatedAt: "2026-11-11T12:48:16+09:00"
category: "retro"
tags: []
legacyUrl: "https://dansoon-dev.tistory.com/15"
thumbnail: "./thumbnail.jpg"
cover: "./cover.webp"
---

회사에서 1분기부터 시작된 '방구하기 프로젝트'가 드디어 첫 번째 마일스톤을 완료했다. 이 프로젝트를 진행하면서 경험한 기술적인 도전과 배움을 정리한다. 레거시 환경을 새 프레임워크로 옮기려던 고민은 [24년 회고](/posts/retrospective-2024/)에 적었다.

## 마이크로 프론트엔드로 기존 서버에 Next.js 통합하기

방구하기 프로젝트의 핵심은 마이크로 프론트엔드 아키텍처 도입이었다.

기존 서버에 Next.js로 만든 새 프로젝트를 통합하는 것이 목표였는데, 이 과정에서 다양한 기술적 과제들을 해결해야 했다.

주요 과제는 기존 시스템과 새로운 Next.js 애플리케이션의 통합이었다.

두 애플리케이션이 사용자에게는 하나의 일관된 서비스로 제공되어야 했다. 특히 라우팅과 인증 시스템 통합이 핵심 요소였다.

결국 우리는 두 애플리케이션을 통합하는 방식을 택했다.

One-time Auth Token 방식의 인증 시스템을 도입해 두 애플리케이션 간 원활한 사용자 인증을 구현했고 URL 패턴을 기반으로 애플리케이션을 라우팅하는 프록시 레이어를 구현했다.

### OTAT로 두 애플리케이션의 인증 상태 공유하기

방구하기 프로젝트에서 마이크로 프론트엔드 아키텍처 도입과 함께 가장 큰 기술적 도전은 애플리케이션 간 인증 상태 공유였다.

이를 해결하기 위해 One-Time Auth Token(OTAT) 시스템을 구현했다. 인증 구현은 실용적인 접근 방식을 취했다.

React Context API를 활용해 간단한 인증 상태 관리 시스템을 구축했고 커스텀 훅을 만들어 컴포넌트에서 쉽게 인증 상태에 접근할 수 있게 했다.

기존 애플리케이션에서 Next.js 애플리케이션으로 이동할 때는 서버에서 발급한 일회용 토큰을 쿼리 파라미터로 전달하는 방식을 사용했다.

OTAT 처리의 핵심은 Next.js 미들웨어에서 이루어졌다.

페이지 컴포넌트가 아닌 애플리케이션 레벨에서 토큰을 처리함으로써 인증 로직을 중앙화하고 일관성을 유지할 수 있었다.

```ts
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { handleOtat } from './otatHandler';
import { hasValidSession } from './sessionManager';
import { handleAuthError, AuthErrorType } from './errorHandler';

export const authMiddleware = async (request: NextRequest): Promise<NextResponse | null> => {
  // 1. OTAT 처리
  const otatResult = await handleOtat(request);
  if (otatResult) return otatResult;
  
  // 2. 세션 검증 (필요한 경로일 경우)
  const requiresAuth = shouldCheckAuth(request.nextUrl.pathname);
  if (requiresAuth) {
    if (!hasValidSession(request)) {
      return handleAuthError(request, AuthErrorType.SESSION_EXPIRED);
    }
  }
  return null;
};

// 인증이 필요한 경로인지 확인
const shouldCheckAuth = (pathname: string): boolean => {
  const publicPaths = ['/building', '/map', '/amount' /* ... */];
  const staticResourcePattern = /\.(ico|png|jpg|jpeg|gif|svg|css|js)$/;
  
  return !(
    publicPaths.includes(pathname) || 
    staticResourcePattern.test(pathname) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/public')
  );
};

export { AuthErrorType } from './errorHandler';
```

이 미들웨어 접근 방식의 장점은 토큰 처리 로직이 한 곳에 집중되어 있어 유지보수가 용이하다는 점이다.

또한 페이지 컴포넌트에서는 인증 상태만 확인하면 되므로 관심사 분리가 명확하게 이루어졌다.

OTAT를 검증하고 세션을 만드는 핸들러는 다음과 같이 구현했다.

```ts
import { NextRequest, NextResponse } from 'next/server';
import { OtatVerificationResult } from './types';
import { logger } from '../common/logger';
import { createRedirect } from '../common/responseUtils';
import { createSession } from './sessionManager';

export const handleOtat = async (request: NextRequest): Promise<NextResponse | null> => {
  const { nextUrl } = request;
  const authToken = nextUrl.searchParams.get('auth_token');
  
  if (!authToken) {
    return null;
  }
  
  try {
    const result = await verifyOtat(authToken);
    
    if (result.valid && result.sessionToken) {
      // 토큰 검증 성공, URL에서 OTAT 제거하고 세션 생성
      const url = nextUrl.clone();
      url.searchParams.delete('auth_token');
      
      const response = NextResponse.redirect(url);
      return createSession(response, result.sessionToken);
    } else {
      // 토큰 검증 실패
      logger.warn('유효하지 않은 OTAT', { reason: result.error });
      return redirectToLogin(request);
    }
  } catch (error) {
    logger.error('OTAT 처리 중 오류 발생', error);
    return redirectToLogin(request);
  }
};

const verifyOtat = async (token: string): Promise<OtatVerificationResult> => {
  try {
    const apiUrl = process.env.API_URL || '';
    if (!apiUrl) {
      throw new Error('API_URL 환경 변수가 설정되지 않았습니다');
    }
    
    const response = await fetch(`${apiUrl}/auth/verify-otat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json',},
      body: JSON.stringify({ token }),
    });
    
    if (!response.ok) {
      throw new Error(`API 응답 오류: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    logger.error('OTAT 검증 실패', error);
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
};

const redirectToLogin = (request: NextRequest): NextResponse => {
  return createRedirect(request, '/login');
};
```

이 OTAT 시스템은 단순하지만 효과적으로 두 애플리케이션 간 인증 상태를 공유할 수 있게 해주었다.

사용자는 애플리케이션 전환 시 재로그인 없이 자연스럽게 서비스를 이용할 수 있게 되었다. 이는 사용자 경험 향상에 큰 도움이 되었다.

미들웨어를 통한 인증 처리는 보안 측면에서도 이점이 있었다.

일회용 토큰은 미들웨어가 서버에서 검증해 곧바로 세션으로 바꾸므로 클라이언트 코드가 토큰을 다루지 않는다. 다만 토큰이 주소에 실려 오기 때문에 한 번만 쓸 수 있고 유효 시간이 짧아야 한다. 세션 토큰은 HTTP Only 쿠키에 저장해 XSS 공격에 대한 방어 수준을 높였다.

앞으로는 더 복잡한 시나리오와 보안 요구사항을 충족시키기 위해 인증 시스템을 지속적으로 개선해 나갈 계획이다.

특히 토큰 갱신 메커니즘과 권한 관리 기능을 강화하는 것이 다음 목표이다.

## Turborepo 모노레포로 코드 중복 줄이기

방구하기 프로젝트는 두 시스템의 통합에서 끝나지 않았다.

향후 더 많은 페이지를 현대화하기 위한 확장성 있는 기반을 마련하는 것도 중요했다.

이를 위해 새롭게 개발하는 Next.js 애플리케이션에 Turborepo를 기반으로 구성한 모노레포 아키텍처를 도입했다.

```text
방구하기/
├── apps/
│   ├── ceo/       # 관리자 페이지
│   ├── ceo-mobile/   # 관리자 모바일 페이지
│   ├── web/   # 신규 페이지
│   └── mobile/   # 신규 모바일 페이지
├── packages/
│   ├── ui/             # 공통 UI 컴포넌트
│   ├── utils/          # 유틸리티 함수
│   ├── api-client/     # API 클라이언트 라이브러리
│   └── auth/           # 인증 관련 모듈
└── config/             # 공통 설정 파일
```

모노레포 설정은 계획된 일정 내에 완료되었으며 구축 후 생산성이 크게 향상되었다.

공통 컴포넌트와 유틸리티 코드의 관리 방식이 근본적으로 바뀌었다.

기존에는 여러 프로젝트에 동일한 코드가 중복되어 있어 하나를 수정할 때마다 모든 곳을 개별적으로 업데이트해야 했다.

모노레포 환경에서는 한 번의 수정으로 모든 앱에 변경사항이 적용되므로 유지보수 효율성이 높아졌다.

초기 설정 과정에서 Turborepo의 빌드 캐싱 최적화, 패키지 간 의존성 관리, 타입스크립트 설정 공유 등이 기술적 과제였다.

각 패키지의 의존성 트리를 최적화하는 과정에서 순환 참조를 방지하면서도 코드 재사용성을 높이는 패키지 구조 설계가 중요했다.

그동안 복사-붙여넣기로 코드를 재사용하던 관행에서 벗어나니 중복 코드도 줄고 버그도 확실히 줄어들었다.

npmrc와 tsconfig 같은 설정 파일 공유, ESLint와 Prettier 규칙을 통일해서 코드 작성 방식보다 기능 구현에 집중할 수 있게 되었다.

## Storybook 디자인 시스템으로 협업 간소화

모노레포와 함께 도입한 또 다른 변화는 디자인 시스템이었다.

사실 이건 꼭 필요했던 부분인데, 기존에는 디자인 가이드라인이 있긴 했지만 실제 구현은 개발자마다 제각각이었다.

우리는 작년에 정의된 Storybook을 활용해 모든 UI 컴포넌트를 문서화하고 디자인 토큰을 적용하여 일관된 시각적 언어를 유지할 수 있게 했다. 이미 구축된 컴포넌트 라이브러리를 이번 프로젝트에 가져와 사용함으로써 개발 생산성이 크게 향상됐다.

특히 디자이너와의 협업 방식이 매우 효율적이었다.

디자이너가 Storybook을 통해 직접 컴포넌트의 동작과 상태를 확인하고 피드백을 줄 수 있는 환경이 이미 갖춰져 있었기 때문에 별도의 셋업 없이 바로 작업을 시작할 수 있었다.

이전 프로젝트에서 경험했던 디자인-개발-피드백-수정의 긴 주기 대신, 이미 검증된 컴포넌트를 재사용하고 Storybook 링크를 공유하는 것만으로 의사소통이 가능해졌다.

디자이너가 직접 모든 상태를 확인하고 의견을 제시할 수 있는 시스템이 준비되어 있어 커뮤니케이션 과정이 크게 간소화되었다.

## 첫 마일스톤의 성과와 배운 점

방구하기 프로젝트의 첫 번째 마일스톤을 완료한 지금, 성과는 다음과 같다.

공통 컴포넌트를 재사용하면서 같은 UI를 앱마다 따로 구현하는 작업을 줄였다. 디자이너와는 Storybook에서 같은 컴포넌트와 상태를 보며 피드백을 주고받을 수 있었다.

서비스 지표도 함께 확인했다. MAU는 평균 150만에서 2월 250만까지 늘었다. 다만 유입에 영향을 주는 다른 요인과 개발 변경의 효과를 분리한 수치는 아니므로, 이 증가를 구조 개선만의 성과로 보기는 어렵다.

## 두 번째 마일스톤 계획

하반기에는 마이크로 프론트엔드 통합 라이브러리의 핵심 부분을 개선하고, 서비스를 쓰는 사람들의 피드백을 반영할 예정이다. 첫 마일스톤에서 만든 공통 기반을 실제 기능을 늘리는 과정에서도 계속 쓸 수 있는지 확인하고 싶다.
