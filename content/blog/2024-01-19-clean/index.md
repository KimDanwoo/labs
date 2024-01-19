---
title: '클린 아키텍쳐 in frontend'
date: 2024-01-08
description: '클린 아키텍쳐는 어플리케이션 도메인과의 근접성에 따라 책임과 기능의 일부를 분리하는 방법이다.'
thumbnail: './thumbnail.png'
category: 'architecture'
---

원문 주소:https://bespoyasov.me/blog/clean-architecture-on-frontend/

## 클린 아키택쳐

클린 아키텍처는 어플리케이션 **도메인과의** **근접성(proximity)**에 따라 **책임과 기능의 일부를 분리하는 방법**이다.

### 도메인

도메인이란 우리가 프로그램으로 모델링하는 현실 세계의 일부를 의미한다. 이것은 실제 세계의 변화를 반영하는 데이터 변환이다. 예를 들어, **우리가 물품의 이름을 업데이트 했다면**, **이전의 이름을 새로운 이름으로 대체하는 것이 도메인 변환** 이다.

클린 아키텍처는 레이어로 나뉜 기능들로 인해 종종 3-레이어 아키텍처로 참조된다. 클린 아키텍처에 대한 최초의 글은 레이어가 강조 표시된 다이어그램을 제시했다.

![cleanArchitecture.png](https://prod-files-secure.s3.us-west-2.amazonaws.com/b0e1c0c2-a035-4ddb-8760-b1b21901d642/8b67a58f-12a6-48d3-bec2-17c8b5d9967d/cleanArchitecture.png)

레이어 다이어그램은 도메인이 중심에 있으며 어플리케이션 레이어가 그 주위를 감싸고 어댑터 레이어가 바깥쪽에 있다.

### Domain Layer

중심에 위치한 부분이 도메인 레이어이다. 도메인 레이어는 어플리케이션의 주제 영역을 표현하는 엔티티와 데이터 그리고 그것들을 조작하는 코드가 포함된다. 도메인은 한 어플리케이션을 다른 어플리케이션과 구분 가능하게 하는 핵심이다.

도메인을 React에서 Vue에서 UI 프레임워크를 바꾸거나, 유스케이스 일부를 변경해도 바뀌지 않는 것이다 생각해도 좋다.

도메인 엔티티들의 데이터 구조와 변환의 핵심은 외부로부터 독립적이다. 외부의 이벤트들은 도메인 변환을 일으키지만, 어떤 식으로 발생할지에 대한 상세 사항은 결정하지 않는다.

예를들어, 장바구니에 아이템을 추가한다 라는 기능은 아이템이 유저 스스로 구매 버튼을 눌렀는지 혹은 프로모션 코드를 통해 자동으로 추가되었는지 등에 대해 전혀 신경쓰지 않는다. 해당 기능은 두가지 경우에 모두 작동하며, 아이템을 받아 카트에 추가할 아이템을 업데이트하기만 할 뿐이다.

💻 **코드 예**

```jsx
class Item {
	constructor(id, name, price){
		this.id = id;
		this.name = name;
		this.price = price;
	}
}

// Cart entity
class Cart {
		constructor(){
			this.items = [];
		}

		addItem(item){
			this.items.push(item)
		}

		getTotalPrice(){
			return this.items.reduce((total,item)=> total + item.price, 0))
		}
}
```

```jsx
const cart = new Cart()
const item1 = newItem(1, 'apple', 1000)
const item2 = newItem(2, 'tomato', 2000)

cart.addItem(item1)
cart.addItem(item2)

console.log('총 가격은', cart.getTotalPrice()) // 3000
```

### Application Layer

도메인을 둘러싸는 것은 어플리케이션 레이어이다. 이 레이어는 유저의 시나리오와 같이 유스 케이스를 묘사한다. 즉 어떤 이벤트가 발생했을 때 무엇이 일어날지에 대해 담당한다.

예를들어 카트에 추가하기 시나리오는 유스 케이스이다. 이것은 버튼이 클릭되었을 때 일어나야 하는 액션에 대해 묘사한다.

- 서버에 요청을 보내고
- 도메인 변환을 수행하고
- 응답 데이터를 가지고 UI를 다시 그린다.

또한 어플리케이션 레이어에는 포트들이 존재한다. 포트들은 우리의 어플리케이션이 외부와 어떻게 소통하기를 원하는지에 대한 명세들이다. 포트는 어떻게 동작할지 규정하는 인터페이스와 비슷하다. 포트는 어플리케이션의 필요 실제 사이의 임시공간 역할을 한다. 입력(인바운드) 포트는 응용 프로그램이 외부와 어떻게 연결되기를 원하는지 알려준다. 출력(아웃바운드) 포트는 어플리케이션이 어떻게 외부와 통신하여 준비할 것인지를 나타낸다.

```jsx
;<button onClick={addItemToCart}>장바구니 추가</button>

const API_URL = 'https://example.com/api'
const cartItem = {
  /* 카트에 추가할 아이템 정보 */
}

// 이벤트 연결 함수
async function addItemToCart() {
  try {
    const response = await postItemToCart(cartItem)
    console.log('Item added to cart:', response.data)
  } catch (error) {
    console.error('Error adding item to cart:', error)
  }
}

// api 통신로직
const postItemToCart = async cartItem => {
  return await axios.post(`${API_URL}/cart`, cartItem)
}
```

### Adapters Layer

가장 바깥의 레이어는 외부 서비스로의 어댑터들(adapters)을 포함한다. 어댑터들은 호환되지 않는 외부 서비스의 API들을 우리의 필요에 맞게 변환하기 위해 필요하다.

어댑터들은 우리의 코드와 서드파티 서비스들의 결합도(coupling)를 낮추는데 있어 훌륭한 방법이다.

어댑터들은 보통 2가지로 나뉘는데

- dricing(인바운드) - 우리 어플리케이션으로 신호를 보내는 종류
- driven(아웃바인드)

유저의 상호작용은 대부분 driving 어댑터들과 일어난다. 예를 들어 UI 프레임워크의 버튼 클릭 핸들링은 driving 어댑터의 일이다. 그것은 브라우저 API (서드파티 서비스)와 작동하며 이벤트를 우리의 어플리케이션이 이해할 수 있는 신호로 변환해준다.

Driven 어댑터들은 인프라와 상호작용 한다. 프론트엔드에서 대부분의 인프라는 백엔드 서버이다. 그러나 가끔은 다른 서비스들과 직접적으로 상호작용하기도 한다.

중앙에서 멀어질수록 코드 기능은 더 서비스 지향적이며 응용프로그램의 도메인 지식과는 거리가 멀다는 점에 유의해야한다.

```jsx
class WeatherServiceAdapter {
  constructor(apiKey) {
    this.apiKey = apiKey
    this.baseUrl = 'https://api.weatherapi.com/v1'
  }

  async getWeather(city) {
    const response = await fetch('${this.baseUrl}/current')
    const data = response.json()
    return {
      condition: data.current.condition
    }
  }
}

const fetchWeather = async () => {
  const { data } = await weatherService.getWeather()
  console.log(data)
}
```

### Dependency Rule

3-레이어 아키텍처는 의존성 규칙이 존재한다. 바깥쪽에서 안쪽으로 의존성을 가질 수 있다.

- 도메인은 반드시 독립적이여야 한다.
- 어플리케이션 레이어는 도메인에 의존성을 가질 수 있다.
- 바깥의 레이어는 어디에나 의존성을 가질 수 있다.

이 조건은 반드시 지켜질 필요는 없다.
