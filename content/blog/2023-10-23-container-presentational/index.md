---
title: 'Container/Presentational 패턴'
date: 2023-10-23
description: 'Container/Presentational 패턴 이해하기'
thumbnail: './thumbnail.png'
category: 'pattern'
isHidden: false
---

## 1. Container/Presentational 패턴이란?

presentational component와 container 컴포넌트는 **리덕스를 사용하는 프로젝트에서 자주 사용되는 구조**이다. **Dumb컴포넌트와 Smart 컴포넌트로도 알려져있다.**

### 1-1. Presentational 컴포넌트

presentational component는 **오직 view만을 담당하는 component이다**. 이 안에는 DOM Element, 그리고 스타일을 갖고 있으며, 프리젠테이셔널 컴포넌트나 컨테이너 컴포넌트를 가지고 있을 수도 있다. 하지만, **리덕스의 스토어에슨 직접적인 접근 권한이 없으며** **오직 props로만 데이터를 가져올 수 있다.** 또한, **대부분의 경우 state를 갖고 있지 않으며, 갖고 있을 경우엔 데이터에 관련된 것이 아니라 UI에 관련된 것이어야 한다.**

### 1-2. Container 컴포넌트

이 컴포넌트는 프리젠테이셔널 컴포넌트들과 컨테이너 컴포넌트들을 관리하는것을 담장한다. 주로 내부에 DOM Element가 직접적으로 사용되는 경우는 없다. **사용되는 경우는 감싸는 용도일때만 사용된다.** 또한, **스타일을 가지고 있지 않아야 한다.** **스타일들은 모두 프리젠테이셔널 컴포넌트에서 정의되어야 한다.** 상태를 가지고 있을 때가 많으며, **리덕스에 직접적으로 접근 할 수 있다.**

### 1-3. 간략한 정리

| 구분   | Presentational                                               | Container                                         |
| ------ | ------------------------------------------------------------ | ------------------------------------------------- |
| 쓰임새 | 데이터가 유저에게 어떻게 보여질지에 대해서만 다루는 컴포넌트 | 어떤 데이터가 유저에게 보여질지 결정하는 컴포넌트 |
| 역할   | View                                                         | 비즈니스 로직                                     |
| 예시   | 데이터 List를 렌더링하는 컴포넌트                            | 데이터를 fetch하는 컴포넌트                       |

👉 **Presentational Components**

```jsx
import React from 'react'

export default function WorldImages({ images }) {
  return images.map((img, index) => (
    <img src={img} key={index} alt={`Dog_${index}`} />
  ))
}
```

- props로 데이터를 받는다
- 이 컴포넌트의 주요 기능은 단순히 받은 데이터를 렌더링하는 것
- 따라서 스타일 시트를 포함하며 데이터는 건드리지 않음
- UI를 위한 데이터인 props 이외의 상태를 갖지 않는다.
- Container 컴포넌트로 부터 데이터를 받는다.

👉 **Container Component**

```jsx
import React, { useState, useEffect } from 'react'
import WorldImages from './WorldImages'

export default function FetchImagesContainer() {
  const [images, setImages] = useState(null)

  const fetchImages = async () => {
    fetch('...url')
      .then(r => r.json())
      .then(img => setImages(img))
  }

  useEffect(() => {}, [fetchImages()])

  return <WorldImages images={images} />
}
```

- presentational 컴포넌트에 데이터를 전달하는 것이 주요 기능
- 스타일 시트를 포함하지 않음

## 2. Hooks 사용

Container/Presentational 패턴은 대부분 React Hooks로 대체될 수 있다.

- Hooks의 도입으로 container컴포넌트 없이 stateul 컴포넌트를 만들기 쉬워졌다.

```jsx
// Hooks 사용
export default useWorldImages (){
	const [images, setImages] = useState([])

	useEffect(()=>{
		fetch('{...url})
			.then(res=>res.json())
			.then(images=>setImages(images))
	},[])

	return {images}
}

// presentation 컴포넌트
import React from 'react'
import useWorldImages from './useWorldImages'

export default function WorldImages(){
	const { images } = useWorldImages()

	return images.map((dog,i) => <img src={dog} key={i} alt="Dog" />)
}
```

- useWorldImages 훅을 사용하여 비즈니스 로직과 뷰를 분리

### 2-1. 장점

- 자연스럽게 관심사의 분리 구현
- presentational 컴포넌트 재사용 가능 (데이터 변경이 없으므로)
- props로 데이터만 넘겨주면 되므로 테스트가 쉬움

### 2-2. 단점

- Hooks로 대체 가능하여 패턴을 사용할 이유가 없어짐
