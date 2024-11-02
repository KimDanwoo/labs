---
title: '의미 있는 코드로 성장하기: 리액트 전환기에서 배운 것들 [WIL]'
date: 2024-10-23
description: '의미 있는 코드로 성장하기: 리액트 전환기에서 배운 것들'
thumbnail: './thumbnail.png'
category: 'WIL'
isHidden: false
---

## **1. 문제**

이번 리팩토링에서는 기존 **JavaScript DOM 조작 방식**으로 만들어진 장바구니 시스템을 **React로 전환**했다. 해당 코드 곳곳에 **더티 코드**가 쌓여 유지보수가 어려워졌고, 기능 추가 시 예상치 못한 오류가 자주 발생했다. 특히 다음과 같은 문제점들이 있었다:

1. **복잡한 상태 관리**
   - 상품, 장바구니, 포인트 등 여러 전역 상태가 얽히면서 의존성이 복잡해지고 관리가 힘들어졌다.
   - 코드가 길어지면서 상태 변경 흐름을 파악하기 어려웠다.
2. **불명확한 네이밍**
   - 변수와 함수명이 모호해 각자의 역할을 예측하기 어려웠다. 예를 들어, `handleClick()` 같은 이름은 해당 함수가 어떤 클릭 이벤트를 처리하는지 명확하지 않았다.
3. **UI와 로직의 혼합**
   - 이벤트 핸들러와 비즈니스 로직이 DOM 조작 코드에 섞여 있어 기능을 수정할 때 UI 요소도 예상치 못한 영향을 받았다.
4. **재사용성 부족**
   - 동일한 로직이 여러 곳에 중복되어 있어, 작은 수정에도 코드 전체를 손봐야 했다.

</br>

---

</br>

## **2. 시도**

리팩토링 목표는 코드의 **가독성, 유지보수성**을 높이고 기능 확장을 쉽게 만드는 것이었다. 이를 위해 다음과 같은 전략을 시도했다:

### 1. **의미 있는 네이밍 사용**

- 함수와 변수명에 **명확한 역할**을 부여했다.
- 예를 들어, `setSelOpts()` 대신 `updateSelectOptions()`처럼 **함수가 수행하는 동작을 명확히 표현**하도록 변경했다.
- 의미 있는 네이밍은 **협업과 유지보수**를 더 쉽게 만든다.

```tsx
// 의미를 알기어렵게 줄인 네이밍: setSelOpts
function setSelOpts() {
	...
}

// 의미 있는 네이밍: updateSelectOptions
function updateSelectOptions(productId) {
  ...
}
```

### 2. **순수 함수 작성으로 로직 명확화**

- 순수 함수는 같은 입력이 주어지면 항상 같은 출력을 반환하고, 외부 상태를 변경하지 않는다. 이를 통해 **예측 가능성**을 높였다.
- 로직을 순수 함수로 분리하면 테스트가 쉬워지고, 각 함수의 역할도 더 명확해진다.

```tsx
// 순수 함수 예시: 할인 계산
function calculateDiscount(price, discountRate) {
  return price - price * discountRate
}

// 비순수 함수 예시: 외부 상태 변경
let discount = 0
function applyDiscount(price) {
  discount += 1 // 외부 상태 변경
  return price - 10
}
```

### 3. **Reducer를 사용한 일관된 상태 관리**

- *`useReducer`*를 사용해 모든 상태를 하나의 흐름으로 관리했다. 상태 변경은 모두 **`dispatch`\*를 통해 처리해 **예측 가능성\*\*을 높였다.
- 이로 인해 상태 간 의존성을 최소화하고 디버깅이 쉬워졌다.

```tsx
const initialState = { cart: [], total: 0 }

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_PRODUCT':
      return {
        ...state,
        cart: [...state.cart, action.product],
        total: state.total + action.product.price
      }
    case 'REMOVE_PRODUCT':
      return {
        ...state,
        cart: state.cart.filter(p => p.id !== action.productId)
      }
    default:
      return state
  }
}
```

### 4. **Context로 전역 상태 관리**

- `useContext`를 활용해 **전역 상태를 공유**하고 **props 드릴링 문제**를 해결했다.
- 필요한 컴포넌트에서만 상태를 가져다 쓸 수 있어, 코드가 더 간결해졌다.

```tsx
const CartContext = React.createContext()

function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState)
  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  )
}

function useCart() {
  return useContext(CartContext)
}
```

### 5. **Custom Hook으로 로직 재사용**

- 상품 추가, 장바구니 삭제 등 **비즈니스 로직**을 `useProduct`, `useProductActions` 같은 **커스텀 훅**으로 분리했다.
- 컴포넌트는 **렌더링에만 집중**하게 하고, 로직은 재사용성을 높였다.

```tsx
// 상품 관련 로직 훅
function useProductActions() {
  const { dispatch } = useCart()

  const addProduct = product => dispatch({ type: 'ADD_PRODUCT', product })

  const removeProduct = productId =>
    dispatch({ type: 'REMOVE_PRODUCT', productId })

  return { addProduct, removeProduct }
}
```

### 6. **컴포넌트 모듈화로 역할 명확화**

- `CartItem`, `ProductSelect`, `StockStatus` 등 컴포넌트를 **역할 단위**로 분리했다.
- UI와 로직의 책임을 명확히 나누어 **유지보수와 확장**이 쉬워졌다.

</br>

---

</br>

## **3. 해결**

1. **가독성과 유지보수성 개선**
   - 의미 있는 네이밍과 순수 함수 사용으로 **코드의 명확성**이 높아졌다.
   - 협업 시 코드의 의도를 쉽게 파악할 수 있게 되었다.
2. **일관된 상태 관리**
   - `useReducer`와 `useContext` 조합으로 전역 상태를 관리해 **예측 가능성**을 확보했다.
   - 상태 변경 흐름을 쉽게 추적할 수 있어 **디버깅이 수월**해졌다.
3. **UI와 로직 분리로 재사용성 확보**
   - 로직은 커스텀 훅으로, UI는 컴포넌트로 분리해 **재사용성과 테스트 용이성**을 높였다.
   - 필요한 기능만 개별적으로 수정할 수 있어 유지보수가 간편해졌다.

</br>

---

</br>

## **4. 배운 점**

1. **Reducer와 Context 조합의 효과**
   - 복잡한 상태를 관리할 때 `Reducer + Context` 패턴을 사용하면 코드가 훨씬 깔끔해지고 유지보수가 쉬워진다는 것을 알게 되었다.
2. **의미 있는 네이밍과 순수 함수의 중요성**
   - 코드의 가독성을 높이려면 네이밍이 중요하며, 순수 함수를 사용하면 로직이 더 예측 가능해진다.
3. **컴포넌트 모듈화의 장점**
   - 컴포넌트를 작은 단위로 나누니 기능 수정이 쉬워지고 코드의 안정성도 높아졌다.

</br>

---

</br>

## **5. Keep: 앞으로도 유지할 부분**

- **Reducer와 Context 패턴 활용**: 복잡한 상태를 관리할 때 **Reducer + Context 패턴**을 계속 사용할 것이다. 이 조합을 통해 **상태의 일관성**과 **예측 가능성**을 높이고, **디버깅**과 **유지보수**가 쉬운 코드를 작성할 수 있다.
- **의미 있는 네이밍과 순수 함수 사용**: 의미 있는 네이밍으로 **가독성**을 유지하고, **순수 함수**를 활용해 **예측 가능한 로직**을 작성하는 습관을 이어갈 것이다. 이로 인해 로직을 파악하기 쉬워지고 테스트와 디버깅도 효율적으로 진행할 수 있다.
- **Custom Hook 활용과 로직 재사용**: 비즈니스 로직을 **커스텀 훅**으로 분리해 재사용성을 높이고, 컴포넌트는 UI에 집중하도록 설계할 것이다. 이를 통해 **중복 코드를 줄이고**, 변경 사항이 발생해도 **특정 로직만 수정**할 수 있게 한다.
- **컴포넌트 모듈화와 역할 분리**: **컴포넌트를 작은 단위**로 모듈화해 역할별로 분리하는 습관을 유지할 계획이다. 이 방식은 **SRP(Single Responsibility Principle)** 원칙을 지켜 기능 확장 시 다른 부분에 영향을 주지 않으면서 코드를 안정적으로 유지할 수 있도록 돕는다.
- **리팩토링 기법 지속 활용**: 코드 작성 후에도 주기적으로 **리팩토링 기법**을 적용해 가독성, 유지보수성, 성능을 지속적으로 개선할 계획이다. 특히 **상태 분리, 의존성 최소화, 중복 코드 제거**와 같은 리팩토링 원칙을 통해 코드 품질을 높이는 습관을 유지할 것이다.

</br>

---

</br>

## **6. 마무리**

이번 리팩토링을 통해 코드의 **가독성, 유지보수성, 재사용성**이 눈에 띄게 개선된 것을 직접 체감할 수 있었다. 의미 있는 네이밍과 순수 함수 사용 덕분에 로직이 더 명확해졌고, **Reducer와 Context 조합**을 통해 복잡한 상태도 예측 가능하고 일관되게 관리할 수 있었다.

이번 작업을 하며 느낀 것은, 코드 품질을 높이기 위해선 **작은 개선의 반복과 주기적인 리팩토링**이 필수적이라는 점이다. 앞으로도 더 복잡한 기능이나 큰 규모의 프로젝트를 마주하게 될 텐데, 이번 경험을 바탕으로 더욱 **자신감**을 갖고 도전할 수 있을 것 같다.

무엇보다 중요한 건, 리팩토링이 단순한 코드 정리가 아니라 **코드의 가치를 높이고 유지보수성을 확보하는 과정**이라는 점을 깨달았다는 것이다. 이런 습관을 꾸준히 이어가며, 더 효율적이고 안정적인 코드를 작성하는 개발자가 되고 싶다.
