---
title: 'Next.js의 Hydrate란?'
date: 2023-10-04
description: 'Next.js의 Hydrate 이해하기'
thumbnail: './thumbnail.png'
category: 'react'
---

## 1. Hydrate란?

Hydrate는 Server Side 단에서 렌더링 된 정적 페이지와 번들링된 JS파일을 클라이언트에게 보낸 뒤, 클라이언트 단에서 HTML 코드와 React인 JS코드를 서로 매칭 시키는 과정을 말한다.

## 2. React의 웹 페이지 구성 원리

React는 JS파일만을 이용하여 웹 화면을 구성하는 원리를 가지고 있다. 그래서 실제 HTML 코드는 안에 내용이 하나도 없는 상태이다.

```jsx
<html lang='en'>
  <head>
    <meta charset='UTF-8' />
    <title>Title</title>
  </head>
  <body>
    <div id='root'></div>
  </body>
</html>
```

위 코드는 처음 리엑트 프로젝트를 세팅할 때 많이 본 HTML코드이다.

단순 뼈대만 있는 HTML document와 JS 파일들을 클라이언트로 모두 보낸 뒤, 클라이언트 단에서 JS 코드들을 통해 웹 화면을 렌더링 하며 페이지를 그리게 된다.

웹 페이지 렌더링을 한 뒤에도 페이지 내에서 동작하는 모든 이벤트 또한 자바스크립트로 인해 일어나게 된다.

```jsx
import React from 'react'
import ReactDOM from 'react-dom'
import App from './src/App'

ReactDOM.render(<App/>,document.getElementById('root')
```

위 코드 처럼 public/index.html 에는 아무 내용 없는 기본 뼈대만 있고, 나머지는 src/index.js의 자바스크립트 코드에서 모든 화면을 렌더링 한 뒤 HTML DOM요소 중 root라는 아이디를 가진 엘리먼트를 찾아서 하위로 주입을 하게 된다.

## 3. Next.js의 웹 페이지 구성 원리

Next.js는 클라이언트에게 웹 페이지를 보내기 전에 Server side 단에서 미리 웹 페이지를 Pre-Rendering 한다.

그리고 Pre-Rendering으로 인해 생성된 HTML document를 클라이언트에게 전송한다.

현재 클라이언트가 받은 웹 페이지는 단순히 웹 화면만 보여주는 HTML일 뿐이고, 자바스크립트 요소들이 하나도 없는 상태이다. 이는 웹 화면을 보여주고 있지만, 특정 JS 모듈 뿐 아니라 단순 클릭과 같은 이벤트 리스너들이 각 웹 페이지의 DOM 요소에 하나도 적용되어 있지 않은 상태임을 말한다.

Next.js Server에서는 Pre-Rendering된 웹 페이지를 클라이언트에게 보내고 나서, 바로 리액트가 번들링 된 자바스크립트 코드들을 클라이언트에게 전송한다.

이전에 보내진 HTML DOM 요소 위에서 한번 더 렌더링을 하면서 각자 자기 자리를 찾아가며 매칭이 된다.

이 과정을 Hydrate라고 부른다.

이것은 마치 자바스크립트 코드들이 DOM요소 위에 물을 채우 듯 필요로 하던 요소들을 채운다 하여 Hydrate라는 용어를 쓴다고 한다.

## 4. 장점

서버 단에서 빠르게 Pre-Rendering하고 유저에게 빠른 웹 페이지로 응답할 수 있다는 것에 더욱 큰 이점을 가져갈 수 있다. 자바스크립트 요소들이 빠진 상태의 Document는 굉장히 가벼운 상태 이므로 클라이언트에게 빠른 로딩이 가능하다.
