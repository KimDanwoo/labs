---
title: "리액트 리팩토링: Context와 Hook을 활용한 상태 관리 개선"
description: "컴포넌트마다 흩어진 상태와 중복 로직을 Context와 Custom Hook으로 분리한 리팩토링 과정과 그 뒤에 남은 배움을 정리했어요."
publishedAt: "2024-12-11T13:25:06+09:00"
updatedAt: "2026-11-11T12:48:16+09:00"
category: "dev"
tags: ["react","state-management"]
legacyUrl: "https://dansoon-dev.tistory.com/6"
thumbnail: "./thumbnail.jpg"
cover: "./cover.webp"
---

## 1\. 문제: 흩어진 상태와 중복된 코드

이번 주에는 기존 리액트 코드의 상태 관리 방식을 Context와 Custom Hook으로 리팩토링하는 과제가 있었다. 컴포넌트마다 각기 다른 상태와 로직을 관리하고 있어서 코드가 복잡해지고 유지보수가 어려웠다. 구체적인 문제는 세 가지였다.

1.  **복잡한 상태 관리**
    -   AdminPage, CartPage 같은 주요 컴포넌트에서 여러 상태(products, cart, coupons)를 개별적으로 관리하고 있었다.
    -   상태가 분산되다 보니 로직이 길어지고, 코드 흐름을 이해하기 어려웠다.
2.  **중복된 코드**
    -   제품 추가, 수정, 삭제 등의 로직이 각각의 컴포넌트에 중복되어 있었다.
    -   동일한 로직을 여러 곳에서 관리하다 보니, 기능을 수정할 때 모든 컴포넌트를 일일이 수정해야 하는 번거로움이 있었다.
3.  **유지보수성 저하**
    -   여러 상태와 로직이 혼합돼 있어 작은 변경 사항에도 실수로 다른 로직에 영향을 줄 가능성이 있었다.
    -   각 상태 변경이 어디서 발생하는지 추적하기가 어려워서, 협업 시 코드 파악에 많은 시간이 소요됐다.

---

## 2\. 시도: Context와 Custom Hook으로 상태와 로직 분리

리팩토링의 목표는 코드의 가독성, 재사용성, 유지보수성을 높이는 것이었다. Context는 props를 층층이 내려보내지 않고도 하위 컴포넌트가 값을 읽게 해주고 Custom Hook은 `use`로 시작하는 함수에 상태 로직을 담아 여러 컴포넌트에서 재사용하게 해준다. 이 둘로 상태와 로직을 분리하는 방향으로 리팩토링을 시도했다.

### 1\. Context와 Custom Hook으로 상태 관리 분리

-   context/providers 폴더를 만들어 ProductContext, CartContext, CouponContext 등을 각각의 기능별로 분리해 관리했다.
-   Context를 사용해 전역에서 필요한 상태를 관리하고 Custom Hook을 사용해 로직을 캡슐화했다.
-   그 결과 컴포넌트는 상태와 로직을 Context와 Hook에서 받아 쓰기만 하면 되도록 간소화할 수 있었다.

### 2\. 모듈화된 Custom Hook 작성

-   hooks 폴더에 useProduct, useCart, useDiscount, useProductEditor 등 기능별 Custom Hook을 작성했다.
-   예를 들어 useProduct는 제품 목록과 관련된 상태와 로직을 관리하고 useProductEditor는 제품 수정과 관련된 로직을 담당하도록 했다.
-   각 기능이 독립된 모듈로 관리되면서 컴포넌트는 UI에 집중할 수 있게 되었다.

```ts
import { useState } from 'react';
import { Product } from '@/types';

export const useProduct = (initialProducts: Product[]) => {
  const [products, setProducts] = useState(initialProducts);

  const addProduct = (newProduct: Product) => {
    setProducts((prev) => [...prev, newProduct]);
  };

  const updateProduct = (updatedProduct: Product) => {
    setProducts((prev) =>
      prev.map((product) => (product.id === updatedProduct.id ? updatedProduct : product))
    );
  };

  return { products, addProduct, updateProduct };
};
```

addProduct와 updateProduct는 `setProducts`에 함수형 업데이트를 넘겨, 이전 상태를 기준으로 새 배열을 만든다.

### 3\. ProductProvider로 모든 기능 통합

-   ProductProvider를 만들어 제품과 관련된 로직을 모두 한 곳에서 관리했다.
-   useProduct, useProductEditor, useNewProduct, useDiscount 같은 훅을 ProductProvider 내부에서 호출하고 이들을 통합한 contextValue를 제공했다.
-   그래서 제품 관리에 필요한 모든 기능을 ProductContext 하나로 접근할 수 있다.

```tsx
import { createContext, ReactNode } from 'react';
import { useProduct, useProductEditor, useNewProduct, useDiscount } from '@/hooks';

export const ProductContext = createContext(null);

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const product = useProduct([]);
  const productEditor = useProductEditor(product.updateProduct);
  const newProduct = useNewProduct(product.addProduct);
  const discount = useDiscount(product.products, product.updateProduct);

  const contextValue = { ...product, ...productEditor, ...newProduct, ...discount };

  return <ProductContext.Provider value={contextValue}>{children}</ProductContext.Provider>;
};
```

ProductProvider는 네 훅이 반환한 값을 펼쳐 하나의 contextValue로 합친 뒤 Provider의 value로 내려준다. 컴포넌트는 `useContext(ProductContext)`로 이 값을 꺼내 쓴다.

다만 contextValue는 렌더링할 때마다 새 객체로 만들어진다. 그래서 Provider가 다시 렌더링되면 이 Context를 읽는 컴포넌트도 함께 다시 렌더링된다. 값이 자주 바뀐다면 useMemo로 감싸거나 Context를 더 잘게 나누는 편이 낫다.

메모이제이션 훅을 직접 구현한 과정은 [React Hook을 직접 구현해보자](/posts/implement-react-hooks/)에서, FSD 구조와 함께 상태 관리를 리팩토링한 과정은 [FSD 패턴으로 상태 관리 리팩토링하기](/posts/fsd-state-management-refactoring/)에서 다뤘다.

---

## 3. 상태를 바꾸는 코드의 위치가 정해졌다

상품 관리 로직을 네 개의 훅으로 나누고 `ProductProvider`에서 합쳤다. 컴포넌트는 Context로 필요한 값을 읽고, 상태를 바꾸는 코드는 해당 훅에서 찾을 수 있게 됐다. 상태와 이벤트 처리 코드가 화면마다 흩어져 있던 문제를 이 방식으로 정리했다.

다만 Context에 모았다고 렌더링 문제까지 해결되지는 않았다. 위 예시의 `contextValue`는 렌더링마다 새로 만들어지고, 값을 읽는 컴포넌트도 함께 다시 렌더링된다. 로직을 찾기 쉬운 구조와 필요한 부분만 다시 그리는 구조는 각각 확인할 필요가 있었다.
