---
title: 'Next.js Router.push와 link 차이점 이해하기'
date: 2023-09-29
description: 'Next.js Router.push와 link,a 차이점 이해하기'
thumbnail: './thumbnail.png'
category: 'next'
isHidden: false
---

## 개요

Next.js 를 사용하다 Link와 Router.push, a태그의 차이점이 궁금해졌다.

```jsx
<Link href="/main">메인</Link>

<a href="/main">메인</a>

<button onClick={()=>router.push('/main')'}>메인</button>
```

위 코드들은 겉으로 보기엔 경로를 이동한다는 점에서 비슷해보이지만, 각자 다른 점이 있다. **가장 큰 차이점은 검색엔진 최적화(SEO)**이다.

## 1. Router

router.push()를 이용하는 경우는 window.location과 비슷하게 동작한다. a 태그를 만들지 않기 때문에 검색엔진 최적화를 신경쓰고 있다면 **해당 링크는 크롤링되지 않아서 SEO에 불리하다.**

하지만 **Link 컴포넌트로 커버할 수 없는 프로그래밍 영역에서 사용하기 위한 목적**이 크다. 예를 들어 onSubmit등 form을 제출하고 특정 페이지로 이동해야하는 상황에서 사용할 수 있다.

## 2. Link

Link 컴포넌트는 a태그를 생성하기 때문에 **웹사이트가 크롤링되어 SEO에 유리하다.** 페이지를 다시 로드하지 않고 SPA동작처럼 보이게 만들어준다.

next.js를 사용한다면 검색엔진최적화를 신경써서 작업한다고 볼 수 있기 때문에 Link 컴포넌트를 사용하는것이 유리하다.

## 3. a

순수 HTML 태그 요소로, 사용자를 새 페이지의 URL로 이동시키는 하이퍼링크를 생성한다. **이때 페이지는 완전히 새로고침이 된다.**

Next.js에서는 a태그 대신 Link 컴포넌트를 사용하는것이 좋다.
