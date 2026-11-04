export const REACT = [
  {
    id: 'q-200',
    question: '클래스 컴포넌트와 함수형 컴포넌트의 차이점은 무엇인가요?',
    answer: `React 16.8의 Hooks 도입 이후 **함수형 컴포넌트가 사실상 표준**이 되었습니다. 클래스 컴포넌트는 레거시 유지보수용으로만 남아 있습니다.

## 코드 비교

\`\`\`jsx
// 클래스
class Counter extends React.Component {
  state = { count: 0 };
  componentDidMount() { document.title = this.state.count; }
  componentDidUpdate() { document.title = this.state.count; }
  render() {
    return <button onClick={() => this.setState(s => ({ count: s.count + 1 }))}>{this.state.count}</button>;
  }
}

// 함수형
function Counter() {
  const [count, setCount] = useState(0);
  useEffect(() => { document.title = count; }, [count]);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
\`\`\`

## 차이 정리

| 항목 | 클래스 | 함수형 |
| --- | --- | --- |
| 상태 | \`this.state\` / \`setState\` | \`useState\`, \`useReducer\` |
| 사이드 이펙트 | 생명주기 메서드 3개에 분산 | \`useEffect\` 하나로 통합 |
| \`this\` | 바인딩 필요 (버그 원천) | **없음** |
| 로직 재사용 | HOC, Render Props (래퍼 지옥) | **커스텀 훅** |
| 코드량 | 많음 | 적음 |
| 번들 크기 | 상대적으로 큼 | 작음 |
| 최적화 | \`shouldComponentUpdate\`, \`PureComponent\` | \`React.memo\`, \`useMemo\`, \`useCallback\` |
| 최신 기능 | ❌ Suspense·Concurrent·Server Component 미지원 | ⭕ 전부 지원 |

## 함수형이 이긴 진짜 이유

**1. 관심사가 생명주기가 아니라 "기능" 단위로 묶입니다**

클래스에서는 구독 설정이 \`componentDidMount\`에, 해제가 \`componentWillUnmount\`에 떨어져 있어 짝이 눈에 보이지 않습니다. \`useEffect\`는 설정과 정리(cleanup)를 **한 블록**에 씁니다.

\`\`\`jsx
useEffect(() => {
  const sub = source.subscribe();
  return () => sub.unsubscribe();   // 짝이 바로 옆에
}, [source]);
\`\`\`

**2. 로직 재사용이 커스텀 훅으로 평평해집니다**
HOC를 겹치면 \`<A><B><C><Component/></C></B></A>\` 래퍼 지옥이 되고 props 출처가 불투명해집니다. 커스텀 훅은 그냥 함수 호출입니다.

**3. \`this\`가 없습니다**
클래스의 \`this.handleClick\` 바인딩 누락은 React 초심자의 1순위 버그였습니다.

## 클래스만 할 수 있는 것 — 딱 하나

**Error Boundary**는 아직 클래스 컴포넌트로만 만들 수 있습니다(\`componentDidCatch\`, \`getDerivedStateFromError\`). 실무에서는 \`react-error-boundary\` 라이브러리로 감싸 쓰는 것이 일반적입니다.

## 중요한 개념 차이 — 클로저 캡처

클래스는 \`this.props\`가 **항상 최신**을 가리키지만, 함수형은 **각 렌더의 props/state가 그 렌더에 고정(캡처)**됩니다.

\`\`\`jsx
function Profile({ user }) {
  const show = () => setTimeout(() => alert(user.name), 3000);
  // 3초 안에 user가 바뀌어도 클릭 시점의 user를 보여줌 (대개 이게 올바른 동작)
}
\`\`\`

이 "렌더마다 독립된 스냅샷" 모델이 함수형의 정신 모델이며, 오래된 값을 참조하는 **stale closure** 문제의 원인이기도 합니다. 최신 값이 꼭 필요하면 \`useRef\`나 setter의 함수형 업데이트를 씁니다.

> 면접 답변: "문법 차이보다 중요한 건 사고방식 차이입니다. 클래스는 인스턴스가 계속 살아 있고, 함수형은 렌더마다 새 스냅샷이 만들어집니다. 그래서 로직 재사용이 훅으로 자연스럽고, Concurrent 기능도 함수형에서만 지원됩니다."`,
    sub_category: '핵심 개념',
    difficulty: 'medium',
    tags: ['클래스 컴포넌트', '함수형 컴포넌트', 'Hooks', 'stale closure'],
  },
  {
    id: 'q-201',
    question: '리액트에서 컴포넌트 간 통신을 위해 사용하는 다양한 방법을 설명할 수 있나요?',
    answer: `관계에 따라 방법이 달라집니다. **가장 단순한 것부터 올라가는 것**이 원칙입니다.

## 1. 부모 → 자식 : props

\`\`\`jsx
<Child name="단우" />
\`\`\`
React의 데이터 흐름은 단방향입니다. 기본이자 대부분의 경우 정답입니다.

## 2. 자식 → 부모 : 콜백 props

\`\`\`jsx
function Parent() {
  const [v, setV] = useState('');
  return <Input onChange={setV} />;
}
\`\`\`
"상태 끌어올리기(lifting state up)" 패턴입니다.

## 3. 형제 간 : 공통 부모로 상태 끌어올리기

가장 가까운 공통 조상이 상태를 갖고, 한쪽에는 값을, 다른 쪽에는 setter를 내려줍니다.

## 4. 깊은 트리 : Context API

\`\`\`jsx
const ThemeContext = createContext(null);
<ThemeContext value={theme}>{children}</ThemeContext>   // React 19: .Provider 생략 가능
const theme = use(ThemeContext);                         // 또는 useContext
\`\`\`

**주의 — 성능**: Context 값이 바뀌면 **구독하는 모든 컴포넌트가 리렌더**됩니다. 자주 바뀌는 값과 안 바뀌는 값은 Context를 **분리**하고, 객체 값은 \`useMemo\`로 감싸세요. Context는 "상태 관리 도구"가 아니라 **주입(injection) 도구**입니다.

## 5. 전역 상태 라이브러리

| 라이브러리 | 특징 |
| --- | --- |
| **Zustand** | 훅 기반, 셀렉터로 부분 구독 → 불필요한 리렌더 없음 |
| **Jotai** | atom 단위. 상향식 조합 |
| **Redux Toolkit** | 예측 가능한 흐름, DevTools 시간여행. 대규모 앱 |
| **Recoil/Valtio** | 각각 atom / proxy 기반 |

## 6. 서버 상태 : React Query / SWR

**서버에서 온 데이터는 전역 상태가 아닙니다.** 캐시입니다. 전역 스토어에 API 응답을 쌓는 대신 React Query를 쓰면 캐싱·재검증·로딩/에러 상태·중복 요청 제거를 전부 위임할 수 있습니다. 여러 컴포넌트가 같은 \`queryKey\`를 쓰면 자동으로 데이터를 공유합니다.

## 7. 자식 → 부모 명령형 호출 : ref

\`\`\`jsx
function Modal({ ref }) {           // React 19: ref를 props로 직접 받음
  useImperativeHandle(ref, () => ({ open: () => {}, close: () => {} }));
}
// 부모
const modalRef = useRef(null);
modalRef.current.open();
\`\`\`
포커스·스크롤·미디어 재생처럼 **선언적으로 표현하기 어려운 명령**에만 쓰세요.

## 8. 합성(Composition) — 과소평가된 방법

\`\`\`jsx
<Layout sidebar={<Nav />}>          // children/슬롯으로 넘기기
  <Content />
</Layout>
\`\`\`
prop drilling을 없애는 가장 가벼운 해법입니다. Context를 꺼내기 전에 먼저 검토하세요.

## 9. URL — 화면 상태의 정석

필터·탭·페이지·검색어는 **URL 쿼리스트링**에 두는 것이 맞습니다. 공유·북마크·뒤로가기가 공짜로 따라옵니다. 전역 atom으로 화면을 전환하지 마세요.

## 선택 가이드

\`\`\`
props로 충분한가 → 예: props
  ↓ 아니오
합성(children)으로 풀리는가 → 예: 합성
  ↓ 아니오
서버 데이터인가 → 예: React Query
  ↓ 아니오
URL에 있어야 할 상태인가 → 예: 쿼리스트링
  ↓ 아니오
자주 안 바뀌는 값인가 → 예: Context
  ↓ 아니오
Zustand / Jotai
\`\`\`

> 면접 포인트: "무조건 Redux"가 아니라 **문제 규모에 맞는 최소 도구를 고르는 판단**을 보여주세요. 특히 "서버 상태와 클라이언트 상태를 분리한다"는 관점이 중요합니다.`,
    sub_category: '상태관리',
    difficulty: 'medium',
    tags: ['props', 'Context', '상태끌어올리기', 'Zustand', 'React Query'],
  },
  {
    id: 'q-202',
    question: '리액트 18 버전에 도입된 동시성 기능을 설명할 수 있나요?',
    answer: `React 18의 동시성(Concurrency)은 **렌더링을 중단·재개·폐기할 수 있게 만든 렌더러의 근본적 변화**입니다. "여러 작업을 동시에 실행"하는 것이 아니라(JS는 여전히 싱글 스레드), **렌더링 작업에 우선순위를 두고 급한 일이 오면 하던 렌더를 양보(yield)**하는 것입니다.

## 이전과 무엇이 다른가

**Legacy 모드** — 렌더링은 한 번 시작하면 끝날 때까지 **중단 불가(blocking)**. 큰 트리를 렌더하는 동안 사용자 입력이 밀립니다.

**Concurrent 모드** — 렌더링이 중단 가능(interruptible). 렌더 도중 더 급한 업데이트가 들어오면 진행 중인 작업을 버리고 급한 것부터 처리합니다.

## 핵심 API

**1. \`useTransition\` — 급하지 않은 업데이트 표시**

\`\`\`jsx
const [isPending, startTransition] = useTransition();

function handleChange(e) {
  setQuery(e.target.value);                    // 긴급: 입력값은 즉시 반영
  startTransition(() => setResults(filter(e.target.value)));  // 비긴급: 양보 가능
}
\`\`\`

무거운 목록 필터링 때문에 입력이 버벅이는 문제를 해결합니다. \`isPending\`으로 로딩 표시를 할 수 있습니다.

**2. \`useDeferredValue\` — 값의 지연 사본**

\`\`\`jsx
const deferredQuery = useDeferredValue(query);
const list = useMemo(() => filter(deferredQuery), [deferredQuery]);
\`\`\`

\`useTransition\`은 **업데이트를 감쌀 수 있을 때**, \`useDeferredValue\`는 **값만 받고 setter에 접근할 수 없을 때**(props로 받은 값) 씁니다.

> 디바운스와 다릅니다. 디바운스는 고정 시간을 기다리지만, 이쪽은 **기기 성능에 적응**하고 새 입력이 오면 진행 중이던 렌더를 즉시 폐기합니다.

**3. Automatic Batching**

React 17까지는 이벤트 핸들러 안에서만 상태 업데이트가 묶였습니다. 18부터는 \`setTimeout\`, Promise, 네이티브 이벤트 안에서도 자동으로 묶여 **리렌더 횟수가 줄어듭니다.**

\`\`\`jsx
setTimeout(() => { setA(1); setB(2); }, 0);
// React 17: 2번 렌더 / React 18: 1번 렌더
\`\`\`

즉시 DOM 반영이 필요하면 \`flushSync\`로 배칭을 빠져나올 수 있습니다(성능상 최후의 수단).

**4. Streaming SSR + Suspense**

\`\`\`jsx
<Suspense fallback={<Skeleton />}>
  <SlowComponent />
</Suspense>
\`\`\`

서버에서 준비된 부분부터 HTML을 흘려보내고(\`renderToPipeableStream\`), 늦은 부분은 나중에 채웁니다. **선택적 하이드레이션**으로 사용자가 상호작용한 영역을 우선 hydrate합니다. Next.js App Router의 \`loading.tsx\`가 이 위에 올라가 있습니다.

**5. \`useSyncExternalStore\`** — 외부 스토어를 tearing(같은 렌더 안에서 서로 다른 값을 보는 현상) 없이 구독. Zustand·Redux 등 라이브러리 내부에서 사용합니다.

**6. \`useId\`** — 서버·클라이언트에서 일치하는 안정적 ID 생성. 하이드레이션 불일치 방지용.

## 활성화 방법

\`createRoot\`를 쓰면 동시성 기능이 켜집니다. 다만 **자동으로 빨라지지 않습니다** — \`startTransition\` 등으로 "무엇이 급하지 않은지" 개발자가 알려줘야 효과가 납니다.

\`\`\`jsx
createRoot(document.getElementById('root')).render(<App />);
\`\`\`

## 주의점

- 렌더가 **중단·폐기·재실행**될 수 있으므로 **렌더 함수는 순수해야 합니다.** 렌더 중 사이드 이펙트가 있으면 중복 실행됩니다. StrictMode가 개발 모드에서 이중 렌더를 하는 이유가 이것을 잡기 위함입니다
- 남용하면 오히려 지연이 늘어납니다. 실제로 버벅이는 지점에만 적용하세요

> 한 줄 요약: "동시성은 렌더링을 **중단 가능**하게 만들어 우선순위를 부여하는 것이고, \`useTransition\`/\`useDeferredValue\`로 '이건 급하지 않다'고 표시하는 방식입니다."`,
    sub_category: '렌더링',
    difficulty: 'hard',
    tags: ['React 18', '동시성', 'useTransition', 'Suspense', 'Automatic Batching'],
  },
  {
    id: 'q-203',
    question: 'CSR의 개념과 한계점은 무엇인가요?',
    answer: `CSR(Client Side Rendering)은 서버가 **빈 HTML 껍데기와 JS 번들만** 내려주고, **브라우저에서 JS가 실행되며 DOM을 그리는** 방식입니다. React·Vue의 기본 SPA 모델입니다.

## 동작 흐름

\`\`\`
1. HTML 요청 → <div id="root"></div> 만 있는 빈 문서 수신
2. JS 번들 다운로드 (수백 KB ~ MB)
3. JS 파싱 + 실행
4. API 호출 → 데이터 수신
5. 렌더링 → 화면 표시
\`\`\`

사용자는 2~5 동안 **흰 화면 또는 스피너**를 봅니다.

## 장점

- **부드러운 화면 전환** — 이후 내비게이션은 서버 왕복 없이 클라이언트에서 처리
- **서버 부하 감소** — 정적 파일만 서빙(CDN 배포 가능)
- **프론트/백 분리** — API 계약만 맞추면 독립 배포
- 앱처럼 상호작용이 많은 UI(대시보드, 에디터)에 적합

## 한계점 — 면접 핵심

**1. 초기 로딩이 느림 (FCP/LCP 악화)**
JS를 받고 실행하고 API를 부른 뒤에야 첫 픽셀이 나옵니다. 네트워크가 느리거나 저사양 기기일수록 격차가 커집니다.

**2. SEO 취약**
Googlebot은 JS를 실행하지만 **렌더링 큐에 들어가 지연**되고, 그 외 크롤러(네이버, 다음, SNS 미리보기 봇, 슬랙 언퍼얼)는 대부분 JS를 실행하지 않습니다. 오픈그래프 태그를 JS로 주입하면 공유 카드가 비어 보입니다.

**3. 번들 크기 = 진입 비용**
기능이 늘수록 번들이 커지고 초기 로딩이 선형적으로 나빠집니다.

**4. 워터폴(Waterfall)**
JS 다운로드 → 실행 → API 요청이 **순차적**입니다. 서버는 데이터를 미리 가져올 수 있는데 CSR은 브라우저가 JS를 실행할 때까지 요청조차 시작하지 못합니다.

**5. 저사양 기기에서 불리**
파싱·실행은 CPU 작업입니다. 네트워크는 빨라져도 저가 안드로이드의 JS 실행 속도는 크게 개선되지 않습니다.

**6. 백지 화면 리스크**
JS 로딩이 실패하면 **아무것도 안 보입니다.** SSR은 최소한 콘텐츠는 남습니다.

## 완화 방법

| 문제 | 대응 |
| --- | --- |
| 번들 크기 | 코드 스플리팅(\`React.lazy\`), 트리 셰이킹 |
| 흰 화면 | 스켈레톤 UI, 앱 셸 패턴 |
| 워터폴 | \`<link rel="preload">\`, prefetch, React Query prefetch |
| SEO | 프리렌더링(prerender.io), SSG 전환 |
| 재방문 | Service Worker 캐싱 |

## 다른 방식과 비교

| | CSR | SSR | SSG | RSC |
| --- | --- | --- | --- | --- |
| HTML 생성 | 브라우저 | 요청마다 서버 | 빌드 타임 | 서버(컴포넌트 단위) |
| FCP | 느림 | 빠름 | **가장 빠름** | 빠름 |
| SEO | 취약 | 좋음 | 좋음 | 좋음 |
| 서버 비용 | 낮음 | 높음 | 낮음 | 중간 |
| 실시간 데이터 | ⭕ | ⭕ | ❌(ISR 필요) | ⭕ |
| 적합 | 대시보드, 어드민 | 커머스, 커뮤니티 | 블로그, 문서 | 콘텐츠+상호작용 혼합 |

## 실무 결론

**전부 CSR / 전부 SSR의 이분법은 낡았습니다.** Next.js App Router는 페이지·컴포넌트 단위로 섞습니다 — 마케팅 페이지는 SSG, 상품 목록은 SSR/RSC, 로그인 후 대시보드는 CSR. 인증이 필요한 어드민처럼 SEO가 무의미하고 상호작용이 많은 화면은 CSR이 여전히 최선의 선택입니다.

> 면접 답변: "CSR의 본질적 한계는 **첫 화면까지 JS 실행이 필수 경로에 있다**는 점입니다. 이게 FCP·SEO·저사양 기기 문제의 공통 원인이고, SSR/SSG는 이 의존을 끊는 방식입니다."`,
    sub_category: '렌더링',
    difficulty: 'medium',
    tags: ['CSR', 'SPA', 'SEO', 'FCP', '번들'],
  },
  {
    id: 'q-204',
    question: 'key 속성의 중요성과 정확한 사용법을 설명할 수 있나요?',
    answer: `\`key\`는 React가 **재조정(reconciliation) 과정에서 리스트의 각 항목이 이전 렌더의 어느 항목과 같은 것인지 식별**하는 힌트입니다. DOM 재사용 여부와 컴포넌트 상태 보존 여부가 여기서 결정됩니다.

## 왜 필요한가

React는 형제 노드를 비교할 때 **기본적으로 순서(index)로 짝**을 짓습니다. 리스트 중간에 항목이 삽입되면 그 뒤 전부가 "변경된 것"으로 판단되어 불필요한 재생성이 일어납니다. \`key\`가 있으면 순서가 아니라 **정체성**으로 짝을 지어, 이동한 노드는 이동으로 처리합니다.

## index를 key로 쓰면 안 되는 이유 — 면접 단골

\`\`\`jsx
{items.map((item, i) => <Item key={i} {...item} />)}   // ❌
\`\`\`

\`\`\`
초기:  [A(key=0), B(key=1), C(key=2)]
앞에 Z 삽입 → [Z(key=0), A(key=1), B(key=2), C(key=3)]

React 판단: key=0의 내용이 A→Z로 바뀜, key=1이 B→A로 바뀜 ...
→ 전부 업데이트. 게다가 각 DOM에 붙어 있던 상태는 그 자리에 남음
\`\`\`

**구체적 버그:**

\`\`\`jsx
// 각 항목에 <input>이 있는 리스트
[A, B, C]에서 A의 input에 "hello" 입력
→ 맨 앞에 Z 삽입
→ Z의 input에 "hello"가 들어가 있음 (상태가 위치에 묶였기 때문)
\`\`\`

체크박스 상태, 포커스, 애니메이션, 비제어 input 값이 **엉뚱한 항목으로 옮겨 붙습니다.**

## 올바른 key

\`\`\`jsx
{items.map(item => <Item key={item.id} {...item} />)}   // ⭕ 데이터 고유 ID
\`\`\`

**규칙**
1. **안정적(stable)** — 리렌더 사이에 변하지 않을 것
2. **고유(unique)** — **형제 사이에서만** 고유하면 됨(전역 유일일 필요 없음)
3. **예측 가능(predictable)** — 같은 데이터면 같은 key

## 절대 하면 안 되는 것

\`\`\`jsx
<Item key={Math.random()} />        // ❌ 매 렌더 새 key → 전체 언마운트/재마운트
<Item key={uuid()} />               // ❌ 위와 동일
\`\`\`

DOM이 통째로 버려지고 다시 만들어져 성능·상태·포커스가 모두 깨집니다.

## index를 써도 되는 경우

**세 조건을 모두 만족할 때만**:
1. 목록이 정적이고 순서가 바뀌지 않음
2. 항목이 추가·삭제되지 않음
3. 각 항목에 내부 상태가 없음

정렬·필터·페이지네이션이 있다면 해당하지 않습니다.

## 고유 ID가 없을 때

- 여러 필드를 조합해 합성 key를 만듭니다

\`\`\`jsx
{items.map(item => <Item key={item.type + '-' + item.date} {...item} />)}
\`\`\`

- **데이터를 받는 시점에** ID를 부여(렌더 중이 아니라)
- 최후에 index — 위 3조건 확인 후

## key의 또 다른 용도 — 의도적 리마운트

\`key\`를 바꾸면 React는 다른 컴포넌트로 간주해 **상태를 초기화**합니다. 이를 역이용할 수 있습니다.

\`\`\`jsx
<UserProfile key={userId} userId={userId} />
// userId가 바뀌면 내부 상태(폼 입력 등)가 자동 초기화됨
\`\`\`

\`useEffect\`로 상태를 리셋하는 것보다 깔끔하고, React 공식 문서가 권장하는 패턴입니다.

## 자주 하는 실수

\`\`\`jsx
// ❌ key를 감싼 요소가 아니라 안쪽에 붙임
{items.map(item => <><Item key={item.id} /></>)}
// ⭕ map이 반환하는 최상위 요소에
{items.map(item => <Fragment key={item.id}><Item /></Fragment>)}
\`\`\`

**\`key\`는 props가 아닙니다.** 자식 컴포넌트에서 \`props.key\`로 읽을 수 없습니다. 값이 필요하면 \`id\` 같은 별도 prop으로 한 번 더 넘기세요.

> 면접 답변: "\`key\`는 성능 최적화 힌트를 넘어 **컴포넌트의 정체성**을 정의합니다. index를 쓰면 정체성이 '위치'가 되어 순서가 바뀔 때 상태가 엉뚱한 항목으로 옮겨 가는 버그가 납니다."`,
    sub_category: '렌더링',
    difficulty: 'medium',
    tags: ['key', '재조정', 'reconciliation', 'index', '리마운트'],
  },
];
