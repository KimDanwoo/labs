export const JS = [
  {
    id: 'q-189',
    question: '자바스크립트란 무엇인가요?',
    answer: `JavaScript는 **싱글 스레드 · 인터프리터(JIT) · 동적 타입 · 프로토타입 기반**의 멀티 패러다임 프로그래밍 언어입니다. 1995년 브렌던 아이크가 넷스케이프에서 10일 만에 초안을 만들었고, 지금은 ECMAScript 표준(TC39)을 따릅니다.

## 핵심 특성

| 특성 | 의미 |
| --- | --- |
| **싱글 스레드** | 콜 스택이 하나. 동시에 한 작업만 실행 |
| **비동기 · 논블로킹** | 이벤트 루프 + 태스크 큐로 I/O를 기다리지 않음 |
| **동적 타입** | 변수 타입이 런타임에 결정, 재할당 시 변경 가능 |
| **프로토타입 기반** | 클래스가 아니라 객체가 다른 객체를 상속. \`class\`는 문법 설탕 |
| **일급 함수** | 함수를 값처럼 전달·반환·저장 가능 → 클로저, 고차 함수 |
| **멀티 패러다임** | 명령형 · 함수형 · 객체지향 모두 가능 |

## 이름의 오해

Java와는 **아무 관계가 없습니다.** 당시 Java의 인기에 편승한 마케팅 작명이었습니다. 문법적으로 C 계열이라는 점만 공유합니다.

## JavaScript ≠ ECMAScript ≠ 런타임

- **ECMAScript** — 언어 사양(문법, 타입, 내장 객체). ES2015(ES6) 이후 매년 갱신
- **JavaScript** — ECMAScript를 구현한 언어
- **런타임** — 실행 환경. 브라우저(V8/SpiderMonkey + DOM·BOM API), Node.js(V8 + fs·http API), Deno, Bun

\`setTimeout\`, \`fetch\`, \`document\`는 **ECMAScript 스펙이 아니라 런타임이 제공하는 API**입니다. Node에 \`document\`가 없는 이유입니다.

## 엔진 동작 개요

\`\`\`
소스 → 파싱(AST) → 인터프리터가 바이트코드로 즉시 실행
                 ↘ 자주 실행되는 코드는 JIT 컴파일러가 기계어로 최적화
\`\`\`

V8은 Ignition(인터프리터)과 TurboFan(최적화 컴파일러)을 함께 씁니다. "인터프리터 언어"라고만 답하면 절반만 맞습니다 — **JIT 컴파일이 들어간 하이브리드**입니다.

## 실행 모델 한 문장

싱글 스레드 콜 스택 위에서 동기 코드를 실행하고, 비동기 작업은 런타임(Web API/libuv)에 위임한 뒤 완료된 콜백을 **이벤트 루프**가 큐에서 꺼내 스택이 빌 때 밀어 넣습니다. 마이크로태스크(Promise)가 매크로태스크(\`setTimeout\`)보다 먼저 처리됩니다.`,
    sub_category: '기초',
    difficulty: 'easy',
    tags: ['JavaScript', 'ECMAScript', '싱글스레드', 'V8', 'JIT'],
  },
  {
    id: 'q-190',
    question: '자바스크립트는 어떤 데이터 타입을 가지고 있나요?',
    answer: `크게 **원시 타입(primitive) 7가지**와 **참조 타입(object)**으로 나뉩니다.

## 원시 타입 7가지

| 타입 | 설명 | \`typeof\` |
| --- | --- | --- |
| \`number\` | 64비트 부동소수점 **하나뿐**. 정수 타입이 없음 | \`"number"\` |
| \`string\` | UTF-16 문자열. 불변 | \`"string"\` |
| \`boolean\` | \`true\` / \`false\` | \`"boolean"\` |
| \`undefined\` | 값이 할당되지 않음 | \`"undefined"\` |
| \`null\` | 의도적인 "값 없음" | **\`"object"\`** ⚠️ |
| \`symbol\` | ES6. 유일한 식별자 | \`"symbol"\` |
| \`bigint\` | ES2020. 임의 정밀도 정수 (\`10n\`) | \`"bigint"\` |

**\`typeof null === "object"\`는 JS 초기 구현의 버그**입니다. 하위 호환 때문에 고치지 못하고 남았습니다. null 판별은 \`value === null\`로 하세요.

## 참조 타입

\`Object\`, \`Array\`, \`Function\`, \`Date\`, \`RegExp\`, \`Map\`, \`Set\`, \`WeakMap\`, \`Promise\` 등 — 모두 \`object\`의 하위입니다.

\`\`\`js
typeof []        // "object"  — 배열 판별은 Array.isArray()
typeof function(){} // "function" — 예외적으로 function
\`\`\`

## 원시 vs 참조 — 면접 핵심

| | 원시 | 참조 |
| --- | --- | --- |
| 저장 | 값 자체 | 힙의 **주소** |
| 복사 | 값 복사 (독립) | 주소 복사 (**공유**) |
| 비교 | 값 비교 | 참조(주소) 비교 |
| 불변성 | 불변 | 가변 |

\`\`\`js
let a = 1; let b = a; b = 2;        // a는 1 (독립)
let x = {n:1}; let y = x; y.n = 2;  // x.n도 2 (공유)
{a:1} === {a:1}                      // false — 주소가 다름
\`\`\`

## \`number\`의 함정

\`\`\`js
0.1 + 0.2 === 0.3        // false — IEEE 754 부동소수점 오차
0.1 + 0.2                // 0.30000000000000004
Number.MAX_SAFE_INTEGER  // 9007199254740991 (2^53-1) 초과 시 정밀도 손실
\`\`\`

금액 계산은 정수 단위(원)로 다루거나 \`BigInt\`/decimal 라이브러리를 씁니다.

## 래퍼 객체(Boxing)

원시값은 메서드가 없는데도 \`"abc".toUpperCase()\`가 동작합니다. 엔진이 접근 순간 임시로 \`String\` 래퍼 객체를 만들고 즉시 버리기 때문입니다. \`new String("a")\`처럼 명시적으로 만들면 \`typeof\`가 \`"object"\`가 되므로 **절대 쓰지 마세요**.

## 타입 판별 정리

\`\`\`js
typeof v === 'string'                                 // 원시 판별
Array.isArray(v)                                      // 배열
v === null                                            // null
Object.prototype.toString.call(v)                     // "[object Date]" — 가장 정확
Number.isNaN(v)                                       // NaN (전역 isNaN은 형변환하므로 위험)
\`\`\`

## Falsy 8가지

\`false\`, \`0\`, \`-0\`, \`0n\`, \`""\`, \`null\`, \`undefined\`, \`NaN\`. **나머지는 전부 truthy**이며 특히 \`[]\`, \`{}\`, \`"0"\`, \`"false"\`는 truthy입니다.`,
    sub_category: '타입',
    difficulty: 'easy',
    tags: ['데이터타입', '원시타입', 'typeof', 'falsy', 'NaN'],
  },
  {
    id: 'q-191',
    question: '자바스크립트에서 객체란 무엇인가요?',
    answer: `객체는 **키(문자열 또는 Symbol)와 값의 쌍(property)을 담는 컬렉션**이며, JavaScript에서 원시 타입이 아닌 모든 것이 객체입니다. 배열, 함수, 날짜, 정규식 모두 객체입니다.

## 생성 방법

\`\`\`js
const a = { name: '단우' };              // 객체 리터럴 (기본)
const b = Object.create(protoObj);        // 프로토타입 지정
const c = new Person('단우');             // 생성자 함수/클래스
\`\`\`

## 프로퍼티 접근

\`\`\`js
obj.name          // 점 표기 — 식별자 규칙을 따르는 키만
obj['first-name'] // 대괄호 — 동적 키, 특수문자 키
obj?.a?.b         // 옵셔널 체이닝 (ES2020)
\`\`\`

## 키의 타입 — 흔한 함정

객체 키는 **문자열 또는 Symbol만** 가능합니다. 다른 값을 넣으면 문자열로 강제 변환됩니다.

\`\`\`js
const o = {};
o[1] = 'a'; o['1'] = 'b';
o                     // { '1': 'b' } — 같은 키로 덮어씀
o[{x:1}] = 'c';       // 키가 "[object Object]"가 됨
\`\`\`

키를 임의 타입으로 쓰려면 **\`Map\`**을 사용하세요. \`Map\`은 객체·함수도 키로 쓸 수 있고, 삽입 순서를 보장하며, \`size\`가 있고, 프로토타입 오염 위험이 없습니다.

## 프로퍼티 어트리뷰트

각 프로퍼티는 값 외에 메타데이터를 가집니다.

\`\`\`js
Object.defineProperty(obj, 'id', {
  value: 1,
  writable: false,     // 값 변경 불가
  enumerable: false,   // for...in / Object.keys에서 제외
  configurable: false, // 삭제·재정의 불가
});
Object.getOwnPropertyDescriptor(obj, 'id');
\`\`\`

리터럴로 만든 프로퍼티는 세 가지 모두 \`true\`입니다.

## 순회 방법

| 방법 | 대상 | 프로토타입 체인 |
| --- | --- | --- |
| \`for...in\` | enumerable 문자열 키 | **포함** ⚠️ |
| \`Object.keys/values/entries\` | 자신의 enumerable 문자열 키 | 제외 |
| \`Object.getOwnPropertyNames\` | 자신의 모든 문자열 키 | 제외 |
| \`Reflect.ownKeys\` | 자신의 모든 키 (Symbol 포함) | 제외 |

\`for...in\`이 상속 프로퍼티까지 읽는 것이 버그의 원천이라, 실무에서는 \`Object.entries\`를 씁니다.

**키 순회 순서**: 정수 형태 키가 오름차순으로 먼저, 그다음 문자열 키가 삽입 순서로, 마지막에 Symbol 키입니다.

## 불변화 3단계

\`\`\`js
Object.preventExtensions(o); // 추가 금지
Object.seal(o);              // + 삭제 금지
Object.freeze(o);            // + 수정 금지 (얕은 동결)
\`\`\`

\`freeze\`는 **1단계만** 얼립니다. 중첩 객체까지 얼리려면 재귀적으로 순회해야 합니다.

## 복사

\`\`\`js
const shallow = { ...obj };              // 얕은 복사 (1단계)
const deep = structuredClone(obj);       // 깊은 복사 (네이티브, 순환참조 OK)
\`\`\`

\`JSON.parse(JSON.stringify(obj))\`는 \`undefined\`·함수·\`Date\`·\`Map\`·순환참조를 잃습니다. \`structuredClone\`을 쓰세요(함수는 여전히 복사 불가).

## 프로토타입

모든 객체는 \`[[Prototype]]\` 내부 슬롯으로 다른 객체를 참조합니다. 프로퍼티를 찾을 때 자신에게 없으면 이 체인을 따라 올라갑니다. 이것이 JS의 상속 메커니즘이며, \`class\` 문법은 이를 감싼 설탕입니다.

> 딕셔너리 용도로 순수한 객체가 필요하면 \`Object.create(null)\`을 쓰세요. 프로토타입이 없어 \`__proto__\`, \`constructor\` 같은 키 충돌과 프로토타입 오염 공격을 피할 수 있습니다.`,
    sub_category: '객체',
    difficulty: 'medium',
    tags: ['객체', '프로퍼티', 'Map', 'freeze', '프로토타입'],
  },
  {
    id: 'q-192',
    question: '호이스팅이란 무엇인가요?',
    answer: `호이스팅(Hoisting)은 **변수·함수 선언이 코드 실행 전에 스코프 최상단으로 끌어올려진 것처럼 동작하는 현상**입니다.

**실제로 코드가 이동하지는 않습니다.** 자바스크립트 엔진이 실행 컨텍스트를 생성하는 **평가 단계**에서 스코프 내 모든 선언을 먼저 스캔해 렉시컬 환경에 등록하기 때문에 그렇게 보이는 것입니다.

## 선언 방식별 동작

\`\`\`js
console.log(a);  // undefined  ← 선언은 끌어올려지고 undefined로 초기화
var a = 1;

console.log(b);  // ❌ ReferenceError: Cannot access 'b' before initialization
let b = 1;

foo();           // ⭕ "hi" — 함수 선언문은 전체가 호이스팅
function foo() { console.log('hi'); }

bar();           // ❌ TypeError: bar is not a function
var bar = function () {};  // var 규칙을 따름 → undefined에 호출
\`\`\`

| 선언 | 호이스팅 | 초기화 시점 | 접근 시 |
| --- | --- | --- | --- |
| \`var\` | ⭕ | 선언 시 즉시 \`undefined\` | \`undefined\` |
| \`let\`/\`const\` | **⭕ (된다)** | 실제 선언문 도달 시 | **TDZ → ReferenceError** |
| \`function\` 선언문 | ⭕ | 함수 객체까지 완성 | 호출 가능 |
| \`class\` | ⭕ | 실제 선언문 도달 시 | **TDZ → ReferenceError** |

## TDZ(Temporal Dead Zone) — 오해 정정

**"\`let\`/\`const\`는 호이스팅되지 않는다"는 흔한 오답입니다.** 호이스팅은 됩니다. 다만 스코프 시작부터 실제 선언문까지 구간에서 **초기화되지 않은 상태로 접근이 금지**되며, 이 구간을 TDZ라 부릅니다.

증거:
\`\`\`js
let x = 'outer';
{
  console.log(x);  // ReferenceError — 호이스팅이 안 됐다면 'outer'가 출력됐어야 함
  let x = 'inner';
}
\`\`\`

## 함수 선언문 vs 함수 표현식

\`\`\`js
// 선언문 — 전체 호이스팅. 조건문 안에 두면 브라우저별 동작이 달라 위험
function a() {}
// 표현식 — 변수 규칙을 따름. 정의 위에서 호출 불가 → 흐름이 명확
const b = function () {};
const c = () => {};
\`\`\`

## 실무 결론

- **\`var\`를 쓰지 않으면 호이스팅 문제의 대부분이 사라집니다.** \`const\` 기본, 재할당이 필요할 때만 \`let\`
- \`let\`/\`const\`의 TDZ는 "선언 전 사용"을 **에러로 잡아주는 안전장치**입니다. 버그가 아니라 기능입니다
- ESLint \`no-use-before-define\` 규칙으로 강제할 수 있습니다

> 면접 답변 요약: "선언이 실행 전 스코프에 등록되는 현상입니다. \`var\`는 \`undefined\`로 초기화까지 되지만 \`let\`/\`const\`는 등록만 되고 초기화가 안 돼 TDZ에 놓입니다. 즉 셋 다 호이스팅은 되고, 초기화 시점이 다릅니다."`,
    sub_category: '스코프/클로저',
    difficulty: 'medium',
    tags: ['호이스팅', 'TDZ', 'var', 'let', 'const'],
  },
  {
    id: 'q-193',
    question: '동등 연산자(==)와 일치 연산자(===)의 차이점은 무엇인가요?',
    answer: `- **\`===\` (일치, strict equality)** — 타입과 값을 **둘 다** 비교. 타입이 다르면 즉시 \`false\`
- **\`==\` (동등, loose equality)** — 타입이 다르면 **암묵적 형변환 후** 비교

\`\`\`js
1 === '1'   // false
1 ==  '1'   // true  — '1'이 1로 변환됨
\`\`\`

## \`==\`의 형변환 규칙 (요약)

1. 타입이 같으면 \`===\`와 동일
2. \`null == undefined\` → **true** (서로에게만, 다른 값과는 false)
3. number vs string → 문자열을 숫자로
4. boolean이 있으면 → boolean을 숫자로 (\`true\`→1, \`false\`→0)
5. object vs primitive → 객체를 \`ToPrimitive\`로 변환(\`valueOf\` → \`toString\`)

## 악명 높은 결과들

\`\`\`js
0 == ''            // true   ('' → 0)
0 == '0'           // true
'' == '0'          // false  (둘 다 문자열이라 형변환 없음) ← 추이성 붕괴
0 == false         // true
null == 0          // false  (null은 undefined하고만 같음)
null == undefined  // true
NaN == NaN         // false  (NaN은 자기 자신과도 다름)
[] == false        // true   ([] → '' → 0)
[] == ![]          // true   (![]는 false → 0, []는 0)
'0' == false       // true
\`\`\`

\`0 == ''\`와 \`0 == '0'\`은 참인데 \`'' == '0'\`은 거짓 — **동치 관계의 추이성이 깨집니다.** \`==\`를 쓰지 말아야 할 결정적 이유입니다.

## 실무 규칙

**항상 \`===\`를 쓰세요.** ESLint \`eqeqeq\` 규칙으로 강제하는 것이 표준입니다.

**유일한 예외 — \`== null\`**

\`\`\`js
if (value == null) { }   // null 또는 undefined 둘 다 체크
// 위와 동등:
if (value === null || value === undefined) { }
\`\`\`

ESLint의 \`eqeqeq: ['error', 'always', { null: 'ignore' }]\` 설정이 이 관용구를 허용합니다. 다만 요즘은 \`??\`와 옵셔널 체이닝으로 대체되는 경우가 많습니다.

## \`Object.is()\` — 세 번째 비교

\`===\`의 두 가지 예외를 바로잡은 버전입니다.

| 비교 | \`===\` | \`Object.is\` |
| --- | --- | --- |
| \`NaN, NaN\` | false | **true** |
| \`+0, -0\` | true | **false** |

React의 리렌더 판단(\`Object.is\` 기반)이 이것을 씁니다. \`useState\`에 \`NaN\`을 같은 값으로 다시 넣어도 리렌더가 안 되는 이유입니다.

## 참조 타입 비교

\`===\`도 객체는 **주소**를 비교합니다.

\`\`\`js
{a:1} === {a:1}   // false
[1,2] === [1,2]   // false
\`\`\`

값 비교가 필요하면 깊은 비교 함수(lodash \`isEqual\`)나 직렬화 비교를 써야 합니다. React의 의존성 배열이 얕은 비교(\`Object.is\`)를 쓰기 때문에 매 렌더마다 새로 만든 객체·배열이 항상 "변경됨"으로 판단되는 것도 같은 이유입니다.`,
    sub_category: '타입',
    difficulty: 'easy',
    tags: ['==', '===', '형변환', 'Object.is', 'NaN'],
  },
  {
    id: 'q-194',
    question: '스코프 체인이란 무엇인가요?',
    answer: `스코프 체인(Scope Chain)은 **식별자를 찾을 때 현재 스코프에서 시작해 상위 스코프로 거슬러 올라가는 단방향 연결 구조**입니다.

## 스코프의 종류

\`\`\`js
const global = 'G';                  // 전역 스코프

function outer() {
  const fn = 'F';                    // 함수 스코프
  if (true) {
    let block = 'B';                 // 블록 스코프 (let/const/class)
    var hoisted = 'V';               // ⚠️ var는 블록을 무시 → 함수 스코프
  }
  console.log(block);                // ReferenceError
  console.log(hoisted);              // 'V'
}
\`\`\`

- **함수 스코프** — \`var\`, 함수 선언
- **블록 스코프** — \`let\`, \`const\`, \`class\`, 함수 선언(strict mode)
- **모듈 스코프** — ESM 파일 최상위. 전역이 아님

## 렉시컬 스코프 — 핵심 개념

JavaScript는 **렉시컬(정적) 스코프**입니다. 스코프는 **함수가 어디서 호출됐는지가 아니라, 어디에 작성됐는지**로 결정됩니다.

\`\`\`js
const x = 'outer';

function foo() { console.log(x); }   // foo가 선언된 위치 기준
function bar() {
  const x = 'inner';
  foo();                              // 'outer' 출력 — 'inner'가 아님
}
bar();
\`\`\`

호출 위치를 따르는 것을 동적 스코프라 하는데, JS에서 동적으로 결정되는 것은 **\`this\`뿐**입니다. 이 대비가 면접 단골입니다.

## 탐색 규칙

1. 현재 스코프의 렉시컬 환경에서 찾음
2. 없으면 **외부 렉시컬 환경 참조**(\`[[OuterEnv]]\`)를 따라 한 단계 위로
3. 전역까지 가서도 없으면 → \`ReferenceError\`
4. **단방향**입니다. 상위에서 하위 스코프의 변수는 볼 수 없습니다

## 섀도잉(Shadowing)

안쪽 스코프가 같은 이름을 선언하면 바깥 것을 가립니다.

\`\`\`js
let v = 1;
{ let v = 2; console.log(v); }  // 2
console.log(v);                  // 1
\`\`\`

## 스코프 체인 = 클로저의 기반

함수는 생성될 때 **자신이 정의된 렉시컬 환경에 대한 참조**(\`[[Environment]]\`)를 내부 슬롯에 저장합니다. 외부 함수가 종료돼도 이 참조가 살아 있으면 해당 환경은 GC되지 않습니다 — **이것이 클로저**입니다.

\`\`\`js
function counter() {
  let count = 0;                 // outer 실행 종료 후에도 살아남음
  return () => ++count;
}
const inc = counter();
inc(); inc();                    // 2
\`\`\`

## 실무 관점

- **깊은 스코프 체인은 탐색 비용**입니다. 반복문 안에서 전역 변수를 계속 참조하면 매번 체인을 끝까지 탑니다. 지역 변수로 캐싱하면 유리합니다(다만 현대 엔진의 최적화로 체감 차이는 대개 미미합니다)
- **전역 오염**은 스코프 체인 최상단을 더럽히는 행위입니다. 모듈 스코프(ESM)와 IIFE가 이를 막습니다
- \`var\`가 블록을 무시하는 성질 때문에 \`for (var i...)\` + 비동기 콜백 조합에서 고전적 버그가 납니다. \`let\`은 **반복마다 새 바인딩**을 만들어 해결합니다

\`\`\`js
for (var i = 0; i < 3; i++) setTimeout(() => console.log(i));  // 3 3 3
for (let i = 0; i < 3; i++) setTimeout(() => console.log(i));  // 0 1 2
\`\`\``,
    sub_category: '스코프/클로저',
    difficulty: 'medium',
    tags: ['스코프체인', '렉시컬 스코프', '클로저', '섀도잉'],
  },
  {
    id: 'q-195',
    question: '실행 컨텍스트를 들어 본 적 있나요?',
    answer: `실행 컨텍스트(Execution Context)는 **JavaScript 코드가 실행되기 위해 필요한 환경 정보를 담은 객체**입니다. 호이스팅·스코프·클로저·\`this\`가 왜 그렇게 동작하는지를 하나로 설명하는 개념입니다.

## 종류 3가지

1. **전역 실행 컨텍스트(GEC)** — 프로그램 시작 시 1개 생성
2. **함수 실행 컨텍스트(FEC)** — 함수가 **호출될 때마다** 생성
3. **eval 실행 컨텍스트** — 실무에서는 사용하지 않음

## 콜 스택

실행 컨텍스트는 **스택(LIFO)**으로 관리됩니다.

\`\`\`js
function a() { b(); }
function b() { console.log('b'); }
a();
\`\`\`

\`\`\`
[ b EC ]  ← 실행 중
[ a EC ]
[ Global EC ]
\`\`\`

b가 끝나면 pop되고 a로 돌아갑니다. 재귀가 끝나지 않으면 이 스택이 넘쳐 \`RangeError: Maximum call stack size exceeded\`가 납니다.

## 구성 요소 (ES2015+ 기준)

\`\`\`
ExecutionContext
├─ LexicalEnvironment          ← let, const, class
│   ├─ EnvironmentRecord       (식별자-값 바인딩)
│   └─ [[OuterEnv]]            (상위 환경 참조 → 스코프 체인)
├─ VariableEnvironment         ← var, 함수 선언 (초기값은 LE와 동일)
└─ ThisBinding                 ← this가 가리킬 값
\`\`\`

\`let\`/\`const\`가 재할당되어도 \`var\` 스냅샷은 유지되도록 두 환경을 분리한 것입니다.

## 2단계 처리 — 여기가 핵심

**① 생성(평가) 단계**
- 스코프 내 모든 선언을 스캔해 EnvironmentRecord에 등록 → **호이스팅의 정체**
- \`var\`는 \`undefined\`로 초기화, \`let\`/\`const\`는 **미초기화 상태(TDZ)**로 등록
- 함수 선언문은 함수 객체까지 완성해 등록
- \`[[OuterEnv]]\`에 상위 환경 연결 → **스코프 체인 형성**
- \`this\` 바인딩 결정 → **호출 방식에 따라 달라지는 이유**

**② 실행 단계**
- 코드를 한 줄씩 실행하며 값을 할당하고 식별자를 참조

## 이 개념이 설명하는 것들

| 현상 | 실행 컨텍스트로 본 원인 |
| --- | --- |
| 호이스팅 | 생성 단계에서 선언이 먼저 등록됨 |
| TDZ | \`let\`/\`const\`가 등록만 되고 초기화가 안 된 구간 |
| 스코프 체인 | \`[[OuterEnv]]\` 참조의 연쇄 |
| 클로저 | 함수의 \`[[Environment]]\`가 외부 LexicalEnvironment를 붙잡고 있어 GC되지 않음 |
| \`this\`가 매번 다름 | 생성 단계에서 **호출 방식**을 보고 ThisBinding을 정하기 때문 |
| 화살표 함수의 \`this\` | 자체 ThisBinding을 만들지 않고 스코프 체인을 타고 올라가 찾음 |

## 비동기와의 관계

**이벤트 루프는 콜 스택이 빈 것을 확인한 뒤에만** 태스크 큐의 콜백을 스택에 올립니다. \`setTimeout(fn, 0)\`이 즉시 실행되지 않는 이유이고, 동기 코드가 오래 걸리면 UI가 멈추는 이유입니다.

> 면접 답변 요약: "코드 실행에 필요한 환경 정보를 담은 객체이고, 콜 스택으로 관리됩니다. 생성 단계에서 선언 등록·스코프 체인 연결·\`this\` 바인딩이 일어나고 실행 단계에서 코드가 돌아갑니다. 호이스팅·TDZ·클로저·\`this\`가 모두 여기서 나옵니다."`,
    sub_category: '실행 컨텍스트',
    difficulty: 'hard',
    tags: ['실행컨텍스트', '콜스택', '렉시컬 환경', '호이스팅', 'this'],
  },
  {
    id: 'q-196',
    question: 'JavaScript에서 클래스를 사용하는 이유는 무엇인가요?',
    answer: `\`class\`(ES6)는 **프로토타입 기반 상속을 감싼 문법 설탕(syntactic sugar)**입니다. 새로운 객체지향 모델을 추가한 것이 아니라, 기존 프로토타입 패턴을 더 명확하게 쓰도록 만든 것입니다.

## 사용하는 이유

**1. 가독성과 의도 표현**

\`\`\`js
// ES5 프로토타입 방식
function Person(name) { this.name = name; }
Person.prototype.greet = function () { return 'hi ' + this.name; };
function Student(name, school) { Person.call(this, name); this.school = school; }
Student.prototype = Object.create(Person.prototype);
Student.prototype.constructor = Student;

// class 방식
class Person {
  constructor(name) { this.name = name; }
  greet() { return \`hi \${this.name}\`; }
}
class Student extends Person {
  constructor(name, school) { super(name); this.school = school; }
}
\`\`\`

상속 관계가 \`extends\` 한 단어로 드러나고, \`prototype.constructor\` 재설정 같은 실수하기 쉬운 절차가 사라집니다.

**2. \`super\` 키워드** — 부모 메서드 호출이 \`Parent.prototype.m.call(this)\` 대신 \`super.m()\`

**3. 안전장치가 내장됨**
- \`new\` 없이 호출하면 **TypeError** (일반 생성자 함수는 조용히 전역을 오염시킴)
- 클래스 본문은 **항상 strict mode**
- 메서드는 \`enumerable: false\` → \`for...in\`에 노출되지 않음
- 클래스 선언은 호이스팅되지만 **TDZ**에 놓여 선언 전 사용이 에러

**4. 최신 기능**

\`\`\`js
class Counter {
  #count = 0;                      // private 필드 (진짜 은닉, 런타임 강제)
  static instances = 0;            // static 필드
  static #registry = new Map();    // static private
  get value() { return this.#count; }
  increment() { this.#count++; return this; }
  static { /* static 초기화 블록 */ }
}
\`\`\`

\`#\` private 필드는 클로저나 \`Symbol\` 트릭 없이 **언어 차원에서 접근을 막습니다**. 외부에서 접근하면 문법 에러입니다.

## 여전히 프로토타입이다 — 오해 방지

\`\`\`js
class A { m() {} }
typeof A                                   // "function"
Object.getOwnPropertyNames(A.prototype)    // ['constructor', 'm']
\`\`\`

메서드는 인스턴스가 아니라 \`A.prototype\`에 올라갑니다. 인스턴스 1만 개를 만들어도 메서드는 하나만 존재합니다 — 메모리 효율의 근거입니다.

## 함정 — \`this\` 바인딩

클래스 메서드는 **자동 바인딩되지 않습니다.**

\`\`\`js
class Btn {
  label = 'click';
  handle() { console.log(this.label); }
}
const b = new Btn();
element.addEventListener('click', b.handle);        // ❌ this === undefined
element.addEventListener('click', () => b.handle());// ⭕
// 또는 클래스 필드로 화살표 함수 정의
class Btn2 { handle = () => { /* this 고정 */ }; }
\`\`\`

단, 클래스 필드 화살표 함수는 **인스턴스마다 함수를 새로 만들므로** 프로토타입 공유 이점을 잃습니다.

## 언제 쓰고 언제 안 쓰는가

**쓰는 경우**
- 상태와 동작이 함께 묶이고 인스턴스가 여러 개 필요할 때 (도메인 모델, 에러 클래스, 상태 머신)
- \`extends Error\`로 커스텀 에러를 만들 때
- 라이브러리 공개 API (Map, Set 같은 명확한 객체 계약)

**안 쓰는 경우 — 프론트엔드 실무의 대세**
- React는 함수 컴포넌트 + 훅으로 전환했습니다. 클래스 컴포넌트는 레거시입니다
- 순수 데이터는 plain object + 타입, 로직은 순수 함수가 테스트·트리셰이킹·직렬화에 유리합니다
- 상속보다 **합성(composition)**이 대체로 낫습니다. 깊은 상속 계층은 변경에 취약합니다

> 면접 답변: "프로토타입 상속의 문법 설탕이고, 가독성·\`super\`·private 필드·strict mode 같은 이점 때문에 씁니다. 다만 프론트엔드에서는 함수형 접근이 주류라 도메인 모델이나 커스텀 에러처럼 인스턴스 개념이 명확한 곳에 제한적으로 사용합니다."`,
    sub_category: '객체',
    difficulty: 'medium',
    tags: ['class', '프로토타입', 'private 필드', '상속', 'this'],
  },
  {
    id: 'q-197',
    question: '일반 함수와 화살표 함수의 가장 큰 차이점은 무엇입니까?',
    answer: `**가장 큰 차이는 \`this\` 바인딩입니다.** 일반 함수는 **호출 시점**에 \`this\`가 동적으로 결정되지만, 화살표 함수는 **자신의 \`this\`를 갖지 않고** 선언된 위치의 상위 스코프에서 렉시컬하게 가져옵니다.

## 차이 전체 정리

| 항목 | 일반 함수 | 화살표 함수 |
| --- | --- | --- |
| \`this\` | 호출 방식에 따라 동적 결정 | **상위 스코프에서 렉시컬 참조** |
| \`arguments\` | ⭕ | ❌ (나머지 매개변수 \`...args\` 사용) |
| \`new\` 생성자 | ⭕ | ❌ TypeError |
| \`prototype\` 프로퍼티 | ⭕ | ❌ |
| \`super\` | 메서드에서 사용 가능 | 자체 없음 (상위에서 참조) |
| 호이스팅 | 선언문은 전체 호이스팅 | 변수 규칙(TDZ) |
| 제너레이터 | \`function*\` 가능 | ❌ |
| \`call/apply/bind\`로 \`this\` 변경 | ⭕ | **❌ 무시됨** |

## \`this\` 동작 비교

\`\`\`js
const obj = {
  name: '단우',
  regular() { console.log(this.name); },   // this = obj
  arrow: () => console.log(this?.name),    // this = 모듈/전역 → undefined
};
obj.regular();  // '단우'
obj.arrow();    // undefined  ← 객체 메서드에 화살표 함수를 쓰면 안 되는 이유
\`\`\`

**콜백에서는 반대로 화살표가 정답입니다.**

\`\`\`js
class Timer {
  seconds = 0;
  start() {
    setInterval(() => { this.seconds++; }, 1000);        // ⭕ this = 인스턴스
    setInterval(function () { this.seconds++; }, 1000);  // ❌ this = undefined/Window
  }
}
\`\`\`

과거 \`const self = this\`나 \`.bind(this)\`로 해결하던 문제를 화살표 함수가 언어 차원에서 없앴습니다.

## 그 외 함정

**\`addEventListener\`의 \`this\`**
\`\`\`js
btn.addEventListener('click', function () { console.log(this); });  // this = btn 요소
btn.addEventListener('click', () => console.log(this));             // this = 상위 스코프
\`\`\`
이벤트 대상 요소가 필요하면 일반 함수를 쓰거나 \`e.currentTarget\`을 쓰세요.

**객체를 반환할 때 괄호 필요**
\`\`\`js
const f = () => ({ a: 1 });   // ⭕ 중괄호를 블록이 아닌 객체로 인식시킴
const g = () => { a: 1 };     // ❌ undefined 반환 (블록 + 레이블로 해석)
\`\`\`

**프로토타입 메서드로 부적합** — \`Foo.prototype.m = () => {}\`는 \`this\`가 인스턴스를 가리키지 않습니다.

## 선택 기준

| 상황 | 선택 |
| --- | --- |
| 객체 메서드 | 축약 메서드 \`m() {}\` |
| 클래스 메서드 | 일반 메서드 |
| 콜백 (map, setTimeout, Promise then) | **화살표** |
| React 이벤트 핸들러 | **화살표** |
| 생성자 | 일반 함수 / class |
| \`arguments\`가 필요할 때 | 일반 함수 (또는 \`...args\`) |
| 이벤트 리스너에서 \`this\`로 요소 접근 | 일반 함수 |

> 한 줄 요약: **"화살표 함수는 \`this\`를 만들지 않는다."** \`this\`를 안 만들기 때문에 \`bind\`도 안 먹고, 생성자도 될 수 없고, 콜백에서는 오히려 편리합니다.`,
    sub_category: '함수',
    difficulty: 'medium',
    tags: ['화살표함수', 'this', 'arguments', '바인딩'],
  },
  {
    id: 'q-198',
    question: '스프레드 문법과 레스트 문법의 차이점은 무엇인가요?',
    answer: `**같은 \`...\` 기호지만 방향이 정반대입니다.**

- **스프레드(Spread)** — 이터러블/객체를 **펼쳐서 개별 요소로 흩뿌림** (묶음 → 낱개)
- **레스트(Rest)** — 흩어진 값들을 **하나로 모음** (낱개 → 묶음)

**구분법: 할당의 왼쪽(매개변수·구조분해 대상)에 있으면 레스트, 오른쪽(값·인자 자리)에 있으면 스프레드입니다.**

## 스프레드

\`\`\`js
// 배열 복사·병합
const merged = [...a, ...b];
const copy = [...arr];                   // 얕은 복사

// 함수 인자로 펼치기
Math.max(...[1, 5, 3]);                  // Math.max(1, 5, 3)

// 객체 병합 — 뒤에 오는 값이 이김
const next = { ...state, count: 1 };

// 이터러블 → 배열
[...'abc']                               // ['a','b','c']
[...new Set([1,1,2])]                    // [1,2]
[...document.querySelectorAll('li')]     // NodeList → Array
\`\`\`

## 레스트

\`\`\`js
// 나머지 매개변수 — 반드시 마지막
function sum(first, ...rest) { return rest.reduce((a, b) => a + b, first); }

// 배열 구조분해
const [head, ...tail] = [1, 2, 3];       // head=1, tail=[2,3]

// 객체 구조분해 — 특정 키 제외하기
const { password, ...safeUser } = user;  // password를 뺀 나머지
\`\`\`

## 실무에서 중요한 포인트

**1. 얕은 복사입니다**

\`\`\`js
const orig = { a: { b: 1 } };
const copy = { ...orig };
copy.a.b = 2;
orig.a.b;      // 2 — 중첩 객체는 참조 공유
\`\`\`

깊은 복사는 \`structuredClone(obj)\`를 쓰세요. React 상태에서 중첩 객체를 갱신할 때 스프레드만 쓰고 안심하다 생기는 버그가 흔합니다.

\`\`\`js
setState(prev => ({ ...prev, user: { ...prev.user, name } }));  // 단계마다 펼쳐야 함
\`\`\`

**2. \`arguments\`를 대체합니다**

\`\`\`js
function old() { const args = Array.prototype.slice.call(arguments); }  // ES5
function now(...args) { }   // 진짜 배열이고, 화살표 함수에서도 동작
\`\`\`

**3. 객체 스프레드는 자신의 enumerable 프로퍼티만 복사합니다.** 프로토타입, getter/setter(값만 복사됨), non-enumerable 프로퍼티는 넘어가지 않습니다. 클래스 인스턴스를 스프레드하면 메서드가 사라집니다.

**4. 성능** — 반복문 안에서 스프레드로 배열을 누적하면 매번 새 배열을 만들어 O(n²)가 됩니다.

\`\`\`js
items.reduce((acc, x) => [...acc, x], []);   // ❌ O(n²)
items.reduce((acc, x) => { acc.push(x); return acc; }, []);  // ⭕ O(n)
\`\`\`

**5. 스프레드는 이터러블만** 펼칩니다(객체 스프레드는 ES2018의 별도 문법). \`{...null}\`은 \`{}\`로 안전하지만 \`[...null]\`은 TypeError입니다.

> 정리: 같은 기호, 반대 방향. 스프레드는 **펼치고**, 레스트는 **모읍니다.**`,
    sub_category: '문법',
    difficulty: 'easy',
    tags: ['스프레드', '레스트', '구조분해', '얕은복사'],
  },
  {
    id: 'q-199',
    question: '불변성이란 무엇이고, 자바스크립트에서 중요한 이유는 무엇인가요?',
    answer: `불변성(Immutability)은 **생성된 데이터를 변경하지 않고, 변경이 필요하면 새 데이터를 만드는** 원칙입니다.

## JS에서 왜 문제가 되는가

원시 타입은 이미 불변이지만, **객체와 배열은 가변(mutable)이며 참조로 공유**됩니다.

\`\`\`js
const a = { n: 1 };
const b = a;
b.n = 2;
a.n;        // 2 — 의도치 않은 원격 변경(side effect)
a === b;    // true — 참조가 같아 "바뀐 걸 감지할 수 없음"
\`\`\`

## 중요한 이유 4가지

**1. 변경 감지가 O(1)이 됩니다 — 프론트엔드에서 가장 중요**

React·Redux·Zustand·Jotai는 모두 **얕은 비교(\`Object.is\`)**로 리렌더 여부를 판단합니다.

\`\`\`js
// ❌ 원본 변경 — 참조가 그대로라 React가 변화를 못 알아챔
state.items.push(newItem);
setState(state.items);        // 리렌더 안 됨

// ⭕ 새 참조 생성
setState(prev => [...prev.items, newItem]);
\`\`\`

객체 전체를 깊이 비교하면 O(n)이지만, 불변성을 지키면 **주소 비교 한 번**으로 끝납니다. 이 성질이 없으면 가상 DOM 최적화·메모이제이션이 성립하지 않습니다.

**2. 예측 가능성 · 디버깅**
함수가 인자를 변경하지 않으면 호출자는 안심할 수 있습니다. "어디선가 값이 바뀌었는데 범인을 못 찾는" 상황이 사라집니다.

**3. 시간 여행 · Undo/Redo**
과거 상태를 그대로 보관할 수 있어 Redux DevTools의 상태 되감기, 편집기 실행취소가 가능해집니다.

**4. 동시성 안전**
Web Worker와 값을 주고받을 때 공유 변경으로 인한 경합이 없습니다.

## 실천 방법

**배열 — 변경 메서드 vs 비변경 메서드**

| 변경(❌ 피하기) | 비변경(⭕ 사용) |
| --- | --- |
| \`push\`, \`pop\`, \`shift\`, \`unshift\` | \`[...arr, x]\`, \`arr.slice(0,-1)\`, \`arr.concat()\` |
| \`splice\` | \`filter\`, \`slice\`, \`toSpliced()\` |
| \`sort\`, \`reverse\` | \`toSorted()\`, \`toReversed()\` (ES2023) |
| \`arr[i] = v\` | \`with(i, v)\` (ES2023), \`map\` |

\`sort()\`와 \`reverse()\`가 **원본을 바꾼다**는 것이 대표적인 함정입니다. \`[...arr].sort()\`로 감싸거나 \`toSorted()\`를 쓰세요.

**객체**
\`\`\`js
const next = { ...prev, name };            // 갱신
const { removed, ...rest } = prev;         // 삭제
const deep = { ...prev, a: { ...prev.a, b } }; // 중첩은 단계마다
\`\`\`

**도구**
- \`Object.freeze()\` — 얕은 동결. 개발 환경에서 실수 감지용
- **Immer** — 변경하는 것처럼 쓰면 내부적으로 불변 업데이트를 생성. 중첩이 깊을 때 가독성이 크게 개선됩니다. Redux Toolkit에 내장
- \`structuredClone()\` — 네이티브 깊은 복사

\`\`\`js
// Immer — 겉보기엔 mutable, 결과는 immutable
setState(produce(draft => { draft.user.profile.name = '단우'; }));
\`\`\`

## 주의 — 맹목적 적용의 비용

- **대용량 배열을 매 프레임 복사하면 오히려 느립니다.** 지역 변수처럼 외부에 노출되지 않는 데이터는 변경해도 안전합니다
- \`reduce\` 안에서 스프레드로 누적하면 O(n²)입니다
- 불변성은 **공유되는 상태**에 적용할 원칙이지, 모든 변수에 적용할 교리가 아닙니다

> 면접 답변: "참조 비교만으로 변경을 감지할 수 있게 만들어 주기 때문입니다. React의 리렌더 판단, 메모이제이션, Redux의 상태 추적이 전부 이 전제 위에 있습니다."`,
    sub_category: '함수형',
    difficulty: 'medium',
    tags: ['불변성', 'immutable', 'React', 'Immer', '얕은비교'],
  },
];
