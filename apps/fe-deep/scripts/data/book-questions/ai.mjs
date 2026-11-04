export const AI = [
  {
    id: 'q-219',
    question: 'LLM의 응답 지연 문제를 사용자 경험 측면에서 어떻게 해결할 수 있나요?',
    answer: `LLM 응답은 수 초에서 수십 초가 걸립니다. **지연 자체를 없앨 수 없다면, 체감 지연(perceived latency)을 줄이는 것**이 프론트엔드의 역할입니다.

## 1. 스트리밍 — 가장 효과적

전체 응답을 기다리지 않고 **첫 토큰이 오는 즉시** 화면에 표시합니다. 총 소요 시간은 같아도 체감은 완전히 달라집니다.

핵심 지표는 **TTFT(Time To First Token)**입니다. 전체 완료 시간보다 TTFT가 사용자 만족도에 훨씬 크게 기여합니다.

\`\`\`tsx
const [text, setText] = useState('');
for await (const chunk of stream) setText(prev => prev + chunk);
\`\`\`

## 2. 즉각적 피드백 (Optimistic UI)

전송 버튼을 누른 **즉시** 사용자 메시지를 목록에 추가하고 입력창을 비웁니다. 서버 왕복을 기다리지 않습니다.

\`\`\`tsx
const [optimisticMessages, addOptimistic] = useOptimistic(messages);
\`\`\`

## 3. 단계별 상태 노출

스피너 하나만 돌리지 말고 **지금 무엇을 하는지** 보여주세요. 진행 상황이 보이면 같은 시간도 짧게 느껴집니다.

\`\`\`
🔍 문서 검색 중… → 📄 3개 문서 참조 → ✍️ 답변 작성 중…
\`\`\`

RAG 파이프라인이라면 각 단계를 이벤트로 스트리밍해 표시할 수 있습니다.

## 4. 스켈레톤 · 타이핑 인디케이터

빈 화면 대신 응답이 들어올 자리를 미리 잡아두면 **CLS도 방지**됩니다.

## 5. 스트리밍 텍스트 렌더링 최적화

토큰마다 setState하면 초당 수십 번 리렌더가 발생합니다.

\`\`\`tsx
// 버퍼링 후 rAF 단위로 flush
const buffer = useRef('');
const flush = useCallback(() => { setText(t => t + buffer.current); buffer.current = ''; }, []);
// chunk 수신 시 buffer.current += chunk; requestAnimationFrame(flush)
\`\`\`

**마크다운 파싱은 특히 무겁습니다.** 스트리밍 중에는 평문으로 그리다가 완료 시 파싱하거나, 파싱 결과를 메모이제이션하세요.

## 6. 프리페칭 · 사전 연결

- 채팅 화면 진입 시 \`<link rel="preconnect">\`로 API 오리진에 미리 연결 (TLS 핸드셰이크 비용 선지불)
- 사용자가 입력을 시작하면 세션·컨텍스트를 미리 준비

## 7. 취소 가능성

**언제든 멈출 수 있다는 통제감**이 대기 스트레스를 크게 줄입니다. 정지 버튼은 필수입니다.

## 8. 모델·라우팅 전략

- 간단한 질의는 작은 모델로, 복잡한 것만 큰 모델로 라우팅
- 자주 반복되는 프롬프트는 **프롬프트 캐싱** 활용 (Anthropic·OpenAI 모두 지원)
- 동일 질의는 결과 캐싱

## 9. 백그라운드 처리 + 알림

수 분 걸리는 작업(문서 전체 분석 등)은 대기시키지 말고 백그라운드로 돌린 뒤 완료 알림을 주는 편이 낫습니다.

## 10. 실패 대비

타임아웃, 재시도(지수 백오프), 부분 응답 보존. **스트리밍 중 끊겨도 이미 받은 텍스트는 유지**해야 합니다.

## 지표로 관리하기

| 지표 | 목표 감각 |
| --- | --- |
| TTFT | 1초 이내가 이상적, 3초 넘으면 이탈 |
| 토큰 생성 속도 | 사람의 읽기 속도(~10 tok/s)보다 빠르면 체감 지연 없음 |
| 취소율 | 높으면 응답 품질 또는 속도 문제 |

> 면접 답변: "핵심은 **스트리밍으로 TTFT를 줄이는 것**입니다. 여기에 낙관적 UI, 단계별 진행 표시, 취소 버튼을 더하면 총 소요 시간이 같아도 체감이 크게 달라집니다. 그리고 스트리밍 자체가 리렌더 폭탄이 될 수 있어 버퍼링·메모이제이션으로 렌더 비용을 관리해야 합니다."`,
    sub_category: 'UX',
    difficulty: 'medium',
    tags: ['LLM', '스트리밍', 'TTFT', '낙관적 UI', '체감성능'],
  },
  {
    id: 'q-220',
    question: 'AI의 환각 현상으로 잘못 만든 UI 컴포넌트가 렌더링될 위험을 방지하는 방안은 무엇인가요?',
    answer: `LLM이 생성한 데이터로 UI를 구성할 때, 모델이 **존재하지 않는 컴포넌트 타입·잘못된 스키마·악의적 콘텐츠**를 내놓을 수 있습니다. **LLM 출력은 사용자 입력과 동일한 신뢰 수준으로 다뤄야 합니다.**

## 1. 구조화 출력 강제 (첫 번째 방어선)

자유 텍스트를 파싱하지 말고, 모델이 **스키마를 따르도록 강제**합니다.

- **Tool use / Function calling** — 모델이 정의된 도구 스키마에 맞춰 인자를 채움
- **JSON mode / Structured output** — 응답 형식을 JSON 스키마로 제약

## 2. 런타임 스키마 검증 (zod) — 필수

모델이 스키마를 따른다고 **믿지 말고 검증**하세요.

\`\`\`ts
import { z } from 'zod';

const ComponentSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), content: z.string().max(5000) }),
  z.object({ type: z.literal('chart'), data: z.array(z.object({ x: z.number(), y: z.number() })).max(500) }),
  z.object({ type: z.literal('table'), rows: z.array(z.record(z.string())).max(200) }),
]);

const result = ComponentSchema.safeParse(llmOutput);
if (!result.success) return <Fallback error={result.error} />;
\`\`\`

**\`safeParse\`를 쓰고 예외를 던지지 마세요.** 검증 실패는 예외 상황이 아니라 **예상된 경로**입니다.

## 3. 화이트리스트 렌더링 — 핵심 패턴

**동적으로 컴포넌트를 생성하지 않고, 미리 등록된 것만 매핑**합니다.

\`\`\`tsx
const REGISTRY = {
  text: TextBlock,
  chart: ChartBlock,
  table: TableBlock,
} as const;

function Renderer({ node }: { node: z.infer<typeof ComponentSchema> }) {
  const Component = REGISTRY[node.type];
  if (!Component) return <UnknownBlock />;   // 등록되지 않은 타입은 렌더 안 함
  return <Component {...node} />;
}
\`\`\`

모델이 \`type: "script"\`를 내놓아도 레지스트리에 없으므로 **아무 일도 일어나지 않습니다.**

## 4. 절대 하면 안 되는 것

\`\`\`tsx
<div dangerouslySetInnerHTML={{ __html: llmOutput }} />   // ❌ XSS
eval(llmGeneratedCode);                                    // ❌
new Function(llmOutput)();                                 // ❌
window[llmOutput.handler]();                               // ❌ 임의 함수 호출
\`\`\`

LLM 출력에 HTML이 필요하면 **DOMPurify**를 반드시 통과시키고, 허용 태그를 최소화하세요.

\`\`\`ts
DOMPurify.sanitize(html, { ALLOWED_TAGS: ['p','strong','em','ul','ol','li','code','pre','a'], ALLOWED_ATTR: ['href'] });
\`\`\`

**마크다운 렌더링도 안전하지 않습니다.** \`react-markdown\`에서 \`rehype-raw\`를 켜면 HTML이 통과하고, 링크의 \`javascript:\` 스킴도 별도 검증이 필요합니다.

## 5. 값 범위·형태 방어

스키마를 통과해도 값이 UI를 깨뜨릴 수 있습니다.
- 배열 길이 상한 (10만 행 테이블 → 브라우저 정지)
- 문자열 길이 상한
- 숫자 범위 (\`NaN\`, \`Infinity\`, 음수 크기)
- URL은 스킴 화이트리스트(\`https:\`만)

## 6. Error Boundary로 격리

검증을 통과해도 렌더 중 터질 수 있습니다. **블록 단위로 감싸** 하나가 실패해도 대화 전체가 죽지 않게 합니다.

\`\`\`tsx
<ErrorBoundary fallback={<BlockError />}>
  <Renderer node={node} />
</ErrorBoundary>
\`\`\`

## 7. 스트리밍 중 부분 JSON 처리

스트리밍하면 JSON이 중간에 잘린 상태로 도착합니다. 불완전한 상태로 파싱을 시도하다 에러가 나거나, 더 나쁘게는 **잘못 해석된 UI가 깜빡입니다.**
- 완성될 때까지 버퍼링하거나
- partial JSON 파서를 쓰되 **불완전한 블록은 렌더하지 않음**

## 8. 사람이 개입할 지점 두기

파괴적 동작(삭제, 결제, 외부 전송)은 **LLM이 결정해도 사용자가 확인**하게 합니다. 모델이 도구를 호출하면 실행 전 확인 UI를 띄우는 방식입니다.

## 9. 관측

검증 실패율, 알 수 없는 타입 발생 빈도, Error Boundary 발동 횟수를 로깅하세요. **프롬프트 회귀를 감지하는 유일한 방법**입니다.

## 방어 계층 정리

\`\`\`
① 구조화 출력 강제 (tool use / JSON schema)
② 런타임 검증 (zod safeParse)
③ 화이트리스트 매핑 (레지스트리)
④ 값 범위 제한
⑤ 새니타이징 (DOMPurify)
⑥ Error Boundary 격리
⑦ 사람 확인 게이트 (파괴적 동작)
\`\`\`

> 면접 답변: "핵심 원칙은 **LLM 출력을 신뢰하지 않는 것**입니다. 스키마 강제 → zod 검증 → 화이트리스트 렌더 → Error Boundary의 다층 방어를 쓰고, \`dangerouslySetInnerHTML\`이나 \`eval\`처럼 임의 코드를 실행하는 경로는 아예 만들지 않습니다."`,
    sub_category: '안전성',
    difficulty: 'hard',
    tags: ['환각', 'zod', '스키마검증', 'XSS', 'Error Boundary'],
  },
  {
    id: 'q-221',
    question: '생성형 AI 채팅 UI에서 중단 기능을 구현한다면 어떤 기술을 사용할 수 있나요?',
    answer: `## 핵심 도구: \`AbortController\`

Fetch API의 표준 취소 메커니즘입니다.

\`\`\`tsx
function useChat() {
  const [text, setText] = useState('');
  const [isStreaming, setStreaming] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  async function send(prompt: string) {
    controllerRef.current?.abort();               // 이전 요청 정리
    const controller = new AbortController();
    controllerRef.current = controller;
    setStreaming(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
        signal: controller.signal,                 // ⭐
      });
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setText(prev => prev + decoder.decode(value, { stream: true }));
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        // 사용자가 의도적으로 멈춤 — 에러 UI를 띄우지 않는다
      } else {
        setError(e);
      }
    } finally {
      setStreaming(false);
      controllerRef.current = null;
    }
  }

  const stop = () => controllerRef.current?.abort();
  return { text, isStreaming, send, stop };
}
\`\`\`

**\`AbortError\`를 일반 에러와 구분하는 것**이 UX상 중요합니다. 사용자가 멈춘 건데 "오류가 발생했습니다"가 뜨면 안 됩니다.

## 언마운트 정리

\`\`\`tsx
useEffect(() => () => controllerRef.current?.abort(), []);
\`\`\`

React 18 StrictMode는 개발 모드에서 effect를 두 번 실행하므로, cleanup이 없으면 요청이 중복됩니다.

## 서버 측 처리 — 여기가 핵심

**클라이언트에서 abort해도 서버가 LLM API 호출을 멈추지 않으면 토큰 비용은 계속 발생합니다.**

\`\`\`ts
// app/api/chat/route.ts
export async function POST(req: Request) {
  const upstream = await fetch(LLM_API, {
    method: 'POST',
    body: JSON.stringify(payload),
    signal: req.signal,        // ⭐ 클라이언트 연결 끊김이 상류로 전파됨
  });
  return new Response(upstream.body, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  });
}
\`\`\`

\`req.signal\`을 상류 fetch에 넘기면 클라이언트가 끊을 때 LLM 요청도 함께 취소됩니다. **비용 절감의 실질적 지점**입니다.

## 전송 방식별 중단 방법

| 방식 | 중단 방법 | 비고 |
| --- | --- | --- |
| **fetch + ReadableStream** | \`AbortController\` | **권장.** POST 가능, 헤더 자유 |
| \`EventSource\` (SSE) | \`es.close()\` | GET만 가능, 커스텀 헤더 불가 |
| **WebSocket** | \`ws.send({type:'cancel'})\` 또는 \`ws.close()\` | 양방향 필요할 때 |

\`EventSource\`는 간편하지만 POST와 헤더 제약이 커서, 실무 LLM 채팅은 대부분 **fetch + ReadableStream**을 씁니다.

## UX 세부사항

**1. 부분 응답 보존**
중단 시점까지 받은 텍스트는 **지우지 말고 유지**하세요. "중단됨" 표시와 함께 남깁니다.

\`\`\`tsx
{stopped && <span className="text-muted">— 사용자가 중단함</span>}
\`\`\`

**2. 버튼 상태 전환**
전송(▶) ↔ 중지(■)를 **같은 자리에서** 토글하면 즉시 누를 수 있습니다. 별도 버튼보다 낫습니다.

**3. 키보드 단축키** — Esc로 중단

**4. 이어서 생성** — 중단 후 "계속" 버튼으로 이어가려면 부분 응답을 컨텍스트에 포함해 재요청합니다

**5. 대화 기록 저장** — 중단된 응답도 저장할지 정책을 정하세요. 저장한다면 "미완성" 플래그를 남깁니다

**6. 새 메시지 전송 시 자동 중단** — 사용자가 답변 도중 새 질문을 하면 이전 스트림을 자동으로 끊습니다

## 주의점

- **\`reader.cancel()\`도 필요할 수 있습니다.** \`abort()\`가 fetch를 끊지만, 이미 만들어진 reader를 명시적으로 정리하면 더 안전합니다
- **여러 요청이 겹칠 때** race condition에 주의하세요. 요청마다 ID를 부여해 "현재 활성 요청의 응답만 반영"하도록 가드합니다
- **AI SDK**(Vercel)를 쓰면 \`useChat\`의 \`stop()\`이 이 전부를 처리합니다. 직접 구현 전에 검토할 만합니다

> 면접 답변: "\`AbortController\`가 표준 도구이고, \`signal\`을 fetch에 넘기면 됩니다. 실무에서 놓치기 쉬운 두 가지는 **\`AbortError\`를 일반 에러와 구분하는 것**과 **서버 라우트에서 \`req.signal\`을 상류 LLM 호출로 전파해 실제 토큰 비용을 멈추는 것**입니다."`,
    sub_category: '스트리밍',
    difficulty: 'medium',
    tags: ['AbortController', '중단', '스트리밍', 'SSE', '비용'],
  },
  {
    id: 'q-222',
    question: '길게 대화할 때 토큰 소모를 줄이는 프런트엔드 컨텍스트 관리 전략은 무엇인가요?',
    answer: `LLM API는 **매 요청마다 전체 대화 이력을 다시 보냅니다.** 대화가 길어지면 입력 토큰이 선형(사실상 누적하면 제곱)으로 증가해 비용과 지연이 함께 늘어납니다.

\`\`\`
1턴: [Q1]                        → 100 토큰
2턴: [Q1, A1, Q2]                → 500 토큰
10턴: [Q1..A9, Q10]              → 8,000 토큰   ← 매번 전부 재전송
\`\`\`

## 1. 슬라이딩 윈도우 — 가장 단순

최근 N턴만 유지합니다.

\`\`\`ts
const recent = messages.slice(-MAX_TURNS * 2);
const payload = [systemPrompt, ...recent];
\`\`\`

간단하지만 **초반 맥락이 통째로 사라집니다.** 사용자가 "아까 말한 그거"라고 하면 실패합니다.

## 2. 요약 압축 (Summarization)

오래된 대화를 요약본으로 대체합니다.

\`\`\`
[시스템 프롬프트]
[요약: 사용자는 Next.js 마이그레이션을 진행 중이며 App Router를 선택함…]
[최근 6턴 원문]
\`\`\`

임계치(예: 컨텍스트의 60%)를 넘으면 백그라운드에서 요약을 생성해 교체합니다. **요약 자체도 LLM 호출 비용**이므로 빈도를 조절해야 합니다.

## 3. 하이브리드 — 실무 권장

\`\`\`
① 시스템 프롬프트          (항상 유지, 캐싱 대상)
② 고정 컨텍스트            (사용자 프로필, 프로젝트 설정 — 잘 안 바뀜)
③ 누적 요약                (오래된 대화의 압축본)
④ 최근 N턴 원문            (정확도가 중요한 구간)
⑤ 현재 질문
\`\`\`

## 4. 프롬프트 캐싱 활용 — 비용 절감 폭이 가장 큼

Anthropic·OpenAI 모두 **반복되는 프롬프트 접두사(prefix)를 캐싱**해 대폭 할인된 가격으로 재사용합니다.

**설계 원칙: 변하지 않는 것을 앞에, 변하는 것을 뒤에 둡니다.**

\`\`\`
[시스템 프롬프트 — 고정]      ← 캐시 히트
[도구 정의 — 고정]            ← 캐시 히트
[문서 컨텍스트 — 고정]        ← 캐시 히트
[대화 이력]
[현재 질문 — 매번 변함]
\`\`\`

앞부분을 조금이라도 바꾸면 **캐시가 전부 무효화**됩니다. 타임스탬프를 시스템 프롬프트 앞에 넣는 것 같은 실수를 피하세요.

## 5. 프론트엔드에서 할 수 있는 것들

**전송 전 정리**
- 첨부 파일 원문 대신 **요약·발췌**만 전송
- 코드 블록은 관련 부분만 (전체 파일 ❌)
- 이미 전송한 문서는 재전송하지 않고 참조 ID로

**중복 제거** — 같은 문서가 여러 턴에 반복 포함되지 않게 관리

**토큰 카운터 표시**
\`\`\`tsx
<div>컨텍스트 {used.toLocaleString()} / {limit.toLocaleString()} 토큰 ({pct}%)</div>
\`\`\`
사용자가 상황을 인지하면 스스로 새 대화를 시작합니다. **UX가 곧 비용 절감 수단**입니다.

**"새 대화" 유도** — 주제가 바뀌면 새 스레드를 권합니다

**분기(branch) 지원** — 이전 지점에서 갈라진 대화는 그 이후 이력만 포함

## 6. RAG로 대체

긴 문서를 컨텍스트에 계속 넣는 대신, **질문 시점에 관련 청크만 검색해 주입**합니다. 문서가 클수록 효과가 큽니다.

## 7. 모델·출력 측 절감

- 간단한 질의는 저렴한 모델로 라우팅
- \`max_tokens\`로 출력 상한 설정 (출력 토큰이 입력보다 대개 비쌉니다)
- 시스템 프롬프트에서 간결한 답변 지시

## 8. 저장 아키텍처

**클라이언트에 전체 이력을 두고 매번 올려보내는 구조는 피하세요.**
- 이력은 서버/DB에 두고 클라이언트는 표시용만 보유
- 서버가 컨텍스트 구성 정책(윈도우·요약)을 담당
- 클라이언트가 보낸 이력을 그대로 믿으면 **컨텍스트 주입 공격**에 노출됩니다

## 측정

| 지표 | 왜 보는가 |
| --- | --- |
| 요청당 입력 토큰 | 컨텍스트 전략의 효과 |
| 캐시 히트율 | 프롬프트 구조가 캐싱 친화적인지 |
| 대화당 평균 턴 수 | 요약 임계치 튜닝 근거 |
| 요약 호출 비용 | 압축이 오히려 비싸지 않은지 |

> 면접 답변: "핵심은 **매 요청마다 전체 이력이 재전송된다**는 사실을 인지하는 것입니다. 슬라이딩 윈도우 + 요약 하이브리드로 컨텍스트를 관리하고, **프롬프트 캐싱이 먹도록 고정 부분을 앞에 배치**하는 설계가 비용에 가장 큰 영향을 줍니다. 프론트엔드는 여기에 토큰 사용량 가시화와 새 대화 유도로 기여합니다."`,
    sub_category: '컨텍스트 관리',
    difficulty: 'hard',
    tags: ['토큰', '컨텍스트', '프롬프트 캐싱', '요약', 'RAG'],
  },
  {
    id: 'q-223',
    question: 'RAG 구조에서 프런트엔드 개발자의 역할은 무엇이라고 생각하나요?',
    answer: `## RAG란

RAG(Retrieval-Augmented Generation)는 **외부 지식을 검색해 프롬프트에 주입한 뒤 LLM이 답변하게 하는 구조**입니다. 모델이 학습하지 않은 최신·사내 데이터를 다루고, 환각을 줄이며, 출처를 제시할 수 있게 합니다.

\`\`\`
질문 → 임베딩 → 벡터 검색 → 관련 청크 추출 → 프롬프트 조립 → LLM → 답변 + 출처
\`\`\`

검색·임베딩·벡터DB는 대체로 백엔드 영역이지만, **RAG의 성패는 상당 부분 UI에서 갈립니다.**

## 프론트엔드의 역할

### 1. 출처(Citation) UI — RAG의 존재 이유

RAG를 쓰는 가장 큰 이유가 "근거 있는 답변"인데, 이걸 **사용자가 확인할 수 있게 만드는 것이 프론트엔드**입니다.

\`\`\`tsx
<p>
  App Router는 서버 컴포넌트가 기본입니다<Citation id={1} />.
</p>
<SourceList sources={sources} />   {/* 문서명, 페이지, 원문 스니펫, 원본 링크 */}
\`\`\`

- 인라인 각주 → 클릭 시 원문 스니펫 표시
- 답변 문장과 출처의 **매핑**을 시각적으로 연결
- 원본 문서로 이동 + 해당 위치 하이라이트

출처가 없거나 확인이 번거로우면 사용자는 결국 답변을 믿지 못합니다.

### 2. 검색 과정의 투명한 노출

RAG는 단계가 많아 지연이 깁니다. 진행 상황을 스트리밍으로 보여주면 체감이 달라집니다.

\`\`\`
🔍 질문 분석 → 📚 문서 12건 검색 → 🎯 관련 3건 선별 → ✍️ 답변 생성
\`\`\`

### 3. 검색 결과 없음 / 신뢰도 낮음 처리

**가장 중요한 UX 판단**입니다. 관련 문서를 못 찾았는데 LLM이 그럴듯한 답을 지어내면 RAG의 의미가 없습니다.

\`\`\`tsx
if (sources.length === 0) {
  return <NoSourceNotice>관련 문서를 찾지 못했습니다. 일반 지식으로 답변할까요?</NoSourceNotice>;
}
if (topScore < THRESHOLD) {
  return <LowConfidenceBadge>참고 문서의 관련도가 낮습니다</LowConfidenceBadge>;
}
\`\`\`

### 4. 문서 관리 인터페이스

- 업로드(드래그앤드롭, 진행률, 대용량 청크 업로드)
- 인덱싱 상태 표시 (임베딩은 수 분 걸릴 수 있음 — 폴링/웹소켓)
- 문서 목록·삭제·재인덱싱
- 실패한 문서의 원인 표시

### 5. 검색 범위 제어

사용자가 어느 문서에서 찾을지 고를 수 있게 하면 정확도가 크게 오릅니다.

\`\`\`tsx
<FilterBar collections={['제품 문서', '내부 위키']} dateRange={...} tags={...} />
\`\`\`

메타데이터 필터는 벡터 검색 품질을 올리는 가장 저렴한 방법입니다.

### 6. 피드백 루프

👍/👎, "이 출처가 관련 없음" 신고를 수집해 **검색 품질 개선 데이터**로 씁니다. 이 데이터가 없으면 RAG 파이프라인을 개선할 근거가 없습니다.

### 7. 성능·상태 관리

- 스트리밍 렌더 최적화
- 검색 결과 캐싱 (같은 질문 반복)
- 낙관적 UI, 취소 지원
- 대화 이력과 검색 컨텍스트의 상태 분리

### 8. 보안·권한

**RAG의 대표적 사고 지점**: 사용자가 접근 권한이 없는 문서가 검색 결과로 나와 답변에 인용되는 경우입니다.

권한 필터링은 **서버에서 강제**해야 합니다. 프론트엔드는 UI에서 감추는 정도이지 방어선이 아닙니다. 다만 프론트엔드가 할 일은:
- 사용자에게 어떤 문서 범위가 사용됐는지 명시
- 권한 없는 출처가 노출되면 즉시 감지·신고할 수 있는 경로

## 오해 정정

"RAG는 백엔드 일이고 프론트엔드는 결과만 보여준다"는 관점은 부정확합니다. **RAG 제품의 신뢰도는 출처 표시·불확실성 전달·피드백 수집이라는 UI 결정에 크게 좌우됩니다.** 검색 정확도가 90%여도 나머지 10%를 사용자가 알아챌 수 없으면 제품은 신뢰를 잃습니다.

> 면접 답변: "검색 파이프라인 자체는 백엔드지만, **RAG가 약속하는 '근거 있는 답변'을 사용자가 실제로 검증할 수 있게 만드는 건 프론트엔드**입니다. 출처 UI, 검색 과정 노출, 결과 없음/신뢰도 낮음 처리, 피드백 수집이 핵심 역할이라고 생각합니다."`,
    sub_category: 'RAG',
    difficulty: 'medium',
    tags: ['RAG', '출처', 'Citation', '벡터검색', 'UX'],
  },
  {
    id: 'q-224',
    question: '이미지를 멀티모달 모델에 보낼 때 Base64 인코딩 방식과 멀티파트 방식 중 어떤 방식을 선호할까요?',
    answer: `## 두 방식

**Base64 (JSON 인라인)**
\`\`\`json
{
  "messages": [{
    "role": "user",
    "content": [
      { "type": "image", "source": { "type": "base64", "media_type": "image/jpeg", "data": "/9j/4AAQ..." } },
      { "type": "text", "text": "이 이미지를 설명해줘" }
    ]
  }]
}
\`\`\`

**멀티파트 (\`multipart/form-data\`)**
\`\`\`ts
const fd = new FormData();
fd.append('image', file);          // 바이너리 그대로
fd.append('prompt', '설명해줘');
await fetch('/api/vision', { method: 'POST', body: fd });
\`\`\`

## 비교

| 항목 | Base64 | 멀티파트 |
| --- | --- | --- |
| 전송 크기 | **+33%** | 원본 그대로 |
| 메모리 | 전체를 문자열로 적재 | 스트리밍 가능 |
| API 호환성 | **대부분의 LLM API가 요구** | 게이트웨이/자체 서버에 적합 |
| 구현 난이도 | 단순 (JSON 하나) | 폼 구성 필요 |
| 대용량 | 취약 (수십 MB에서 문제) | 유리 |
| 캐싱·재사용 | 매번 재전송 | 업로드 후 URL 재사용 가능 |
| 진행률 표시 | 어려움 | \`XMLHttpRequest\`/스트림으로 가능 |

## 결론 — 구간을 나눠서 답하는 것이 정답

**브라우저 → 우리 서버: 멀티파트**
- 33% 오버헤드 없음
- 파일 스트리밍으로 메모리 효율적
- 업로드 진행률 표시 가능
- 서버에서 리사이즈·포맷 변환·검증을 수행할 수 있음

**우리 서버 → LLM API: Base64 (또는 API가 지원하는 URL 방식)**
- Anthropic·OpenAI의 메시지 API가 대부분 Base64 또는 공개 URL을 요구합니다. 선택지가 아니라 **제약**입니다
- 서버는 이미 최적화된 이미지를 갖고 있으므로 인코딩 비용이 작습니다

\`\`\`
브라우저 --(multipart, 원본)--> 우리 서버 --(리사이즈/압축)--> Base64 --> LLM API
\`\`\`

**Base64를 브라우저에서 직접 만들면 안 되는 이유**를 함께 말하면 좋습니다:
- 메인 스레드에서 큰 파일을 Base64로 만들면 **UI가 멈춥니다**
- 33% 커진 페이로드가 사용자 업로드 대역폭을 그만큼 더 소모합니다 (모바일에서 체감이 큼)
- **API 키를 클라이언트에 둘 수 없으므로** 어차피 서버를 거쳐야 합니다

## 예외 상황

**클라이언트에서 Base64가 합리적인 경우**
- 아주 작은 이미지(수십 KB)
- 미리보기용 (\`FileReader.readAsDataURL\`)
- 프로토타입

**URL 참조 방식이 최선인 경우**
같은 이미지를 여러 번 참조하거나 대용량이라면, **presigned URL로 스토리지에 올린 뒤 URL만 전달**하는 것이 가장 효율적입니다(API가 지원할 때).

\`\`\`
브라우저 --(presigned URL로 S3 직접 업로드)--> S3
서버 --(이미지 URL)--> LLM API
\`\`\`

원본이 우리 서버를 거치지 않아 대역폭·메모리를 아낍니다.

## 함께 챙길 것

- **크기·용량 제한** — 모델마다 상한이 있습니다(픽셀 수, 파일 크기). 초과 시 서버에서 리사이즈
- **MIME 검증** — 확장자가 아니라 **매직 넘버**로 실제 타입 확인. 위장 파일 차단
- **EXIF 처리** — 회전 정보 반영 + **GPS 등 개인정보 메타데이터 제거**
- **압축** — 모델은 대체로 고해상도가 필요 없습니다. 다음 문항의 리사이즈 전략과 연결됩니다

> 면접 답변: "구간을 나눠서 봐야 합니다. **브라우저→서버는 멀티파트**가 33% 오버헤드가 없고 스트리밍·진행률 면에서 낫고, **서버→LLM API는 API 스펙상 Base64**를 쓰게 됩니다. 클라이언트에서 직접 Base64를 만드는 건 메인 스레드 블로킹과 대역폭 낭비 때문에 피하고, 대용량이면 presigned URL 방식을 검토합니다."`,
    sub_category: '멀티모달',
    difficulty: 'medium',
    tags: ['멀티모달', 'Base64', 'multipart', '이미지 업로드', 'presigned URL'],
  },
  {
    id: 'q-225',
    question: '고화질 사진을 업로드할 때 토큰 비용을 아끼고 처리 속도를 높이는 방법은 무엇인가요?',
    answer: `## 왜 중요한가

멀티모달 모델은 이미지를 **타일 단위로 쪼개 토큰으로 환산**합니다. 해상도가 커질수록 토큰이 급증하고, 이는 비용과 지연에 직결됩니다.

\`\`\`
4000×3000 원본  →  수천 토큰
1024×768 리사이즈 →  수백 토큰
\`\`\`

**결정적 사실: 모델의 최대 입력 해상도를 넘는 이미지는 어차피 내부적으로 축소됩니다.** 큰 이미지를 보내는 것은 대역폭만 낭비하고 정확도 이득은 없습니다.

## 1. 클라이언트 리사이즈 — 가장 효과가 큼

업로드 **전에** 브라우저에서 줄입니다.

\`\`\`ts
async function resize(file: File, maxSide = 1568, quality = 0.85): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = new OffscreenCanvas(w, h);      // Worker에서도 사용 가능
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();                                 // 메모리 해제

  return canvas.convertToBlob({ type: 'image/webp', quality });
}
\`\`\`

- \`createImageBitmap\` — 디코딩이 비동기라 메인 스레드 블로킹이 적음
- \`OffscreenCanvas\` — **Web Worker에서 실행 가능** → UI 프리즈 없음
- \`bitmap.close()\` — 고화질 이미지는 메모리를 많이 쓰므로 명시적 해제 필수

**목표 해상도**: 모델 문서에서 권장 최대 변 길이를 확인하세요. 대체로 1024~1568px 선이면 충분합니다.

## 2. 포맷 선택

| 포맷 | 특징 |
| --- | --- |
| **WebP** | JPEG 대비 25~35% 작음. 브라우저 지원 충분 |
| **AVIF** | 더 작지만 인코딩이 느림. 모델 지원 확인 필요 |
| JPEG | 호환성 최고. 사진에 무난 |
| PNG | **사진에는 부적합** (무손실이라 매우 큼). 스크린샷·도표용 |

모델이 지원하는 포맷을 먼저 확인하세요. 지원하지 않으면 서버에서 변환합니다.

## 3. Web Worker로 이동

여러 장을 처리하면 메인 스레드가 확실히 멈춥니다.

\`\`\`ts
// worker.ts
self.onmessage = async ({ data }) => {
  const blob = await resize(data.file);
  self.postMessage(blob);
};
\`\`\`

## 4. 디테일 레벨 조절

일부 API는 \`detail: 'low' | 'high' | 'auto'\` 같은 옵션을 제공합니다. **"이 사진에 고양이가 있나?" 수준의 질문에는 low로 충분**하며 토큰이 크게 줄어듭니다. 문서 OCR처럼 세부가 중요할 때만 high를 쓰세요.

## 5. 크롭 — 관련 영역만

전체 사진 대신 필요한 영역만 잘라 보내면 토큰과 정확도가 **동시에** 개선됩니다. 사용자가 영역을 지정하게 하거나, 문서 스캔이라면 경계 검출로 자동 크롭합니다.

## 6. 캐싱 · 중복 제거

- 같은 이미지를 여러 턴에서 다시 보내지 않기 — 서버에 업로드 후 참조 ID 사용
- 파일 해시로 중복 업로드 감지
- 프롬프트 캐싱을 지원하는 API라면 이미지도 캐시 대상이 될 수 있는지 확인

## 7. 지연 처리 · 배치

- 여러 장은 병렬 업로드하되 **동시 개수 제한**(3~5개)
- 사용자가 전송 버튼을 누르기 전에 리사이즈·업로드를 미리 시작하면 체감 지연이 사라집니다

## 8. EXIF 처리 — 놓치기 쉬움

- **회전 정보(Orientation)** — 무시하면 세로 사진이 눕습니다. \`createImageBitmap(file, { imageOrientation: 'from-image' })\`
- **GPS·촬영 기기 메타데이터 제거** — 개인정보입니다. 캔버스를 거치면 자동으로 제거되지만, 원본을 그대로 보낼 때는 명시적으로 스트립하세요

## 9. 측정

\`\`\`
원본 4.2MB (4032×3024) → 리사이즈 180KB (1568×1176 WebP)
토큰: 약 1,600 → 약 400
업로드 시간: 8.2s → 0.4s (3G 기준)
\`\`\`

**실제 숫자로 확인하세요.** 위 값은 예시이며 조건에 따라 크게 달라집니다.

## 파이프라인 정리

\`\`\`
파일 선택
 → EXIF 회전 보정 + 메타데이터 제거
 → Worker에서 리사이즈 (최대 변 ~1568px)
 → WebP 인코딩 (quality 0.85)
 → 멀티파트 업로드 (진행률 표시)
 → 서버: MIME 매직넘버 검증 + 상한 재확인
 → Base64 변환 → LLM API
\`\`\`

> 면접 답변: "가장 큰 절감은 **클라이언트 리사이즈**입니다. 모델 최대 해상도를 넘는 픽셀은 어차피 버려지므로 보낼 이유가 없습니다. \`createImageBitmap\` + \`OffscreenCanvas\`를 Worker에서 돌려 UI 블로킹 없이 처리하고, WebP로 인코딩합니다. 여기에 detail 파라미터와 크롭으로 토큰을 더 줄이고, EXIF 회전·GPS 제거를 함께 챙깁니다."`,
    sub_category: '멀티모달',
    difficulty: 'medium',
    tags: ['이미지 최적화', 'OffscreenCanvas', 'Web Worker', '토큰비용', 'EXIF'],
  },
  {
    id: 'q-226',
    question: 'LLM의 텍스트 응답을 구현할 때 SSE와 웹소켓 중 어떤 것을 선호하나요?',
    answer: `## 결론 먼저

**LLM 텍스트 스트리밍에는 SSE(정확히는 fetch + ReadableStream)를 선호합니다.** 통신이 본질적으로 **단방향(서버→클라이언트)**이기 때문입니다. 요청-응답 모델에 정확히 맞고 인프라가 단순합니다.

## 비교

| 항목 | SSE | WebSocket |
| --- | --- | --- |
| 방향 | **서버 → 클라이언트 단방향** | 양방향 |
| 프로토콜 | HTTP (그대로) | 별도 핸드셰이크 후 업그레이드 |
| 재연결 | **자동** (\`EventSource\`) + \`Last-Event-ID\` | 직접 구현 |
| 프록시·방화벽 | HTTP라 문제 없음 | 일부 환경에서 차단 |
| HTTP/2 다중화 | ⭕ | ❌ 별도 연결 |
| 인증 | 쿠키·헤더 그대로 | 핸드셰이크 시 별도 처리 필요 |
| 압축·캐싱 | HTTP 인프라 활용 | 별도 |
| 서버 부하 | 연결당 가벼움 | 상태 유지 필요 |
| 데이터 | 텍스트만 | 텍스트 + 바이너리 |
| 로드밸런싱 | 표준 HTTP LB | 스티키 세션 필요할 수 있음 |

## SSE를 고르는 이유

**1. LLM 응답은 단방향입니다.** 사용자 입력은 별도 POST 요청으로 충분하고, 응답만 흘러오면 됩니다. 양방향 채널을 유지할 이유가 없습니다.

**2. 인프라가 단순합니다.** 기존 HTTP 스택(인증 미들웨어, 로드밸런서, CDN, 관측 도구)이 그대로 동작합니다. WebSocket은 별도 게이트웨이·스케일링 전략이 필요합니다.

**3. 서버리스와 궁합이 좋습니다.** Vercel·Cloudflare Workers 같은 환경에서 SSE는 자연스럽지만, 장기 WebSocket 연결은 제약이 많거나 별도 서비스(Durable Objects, Ably)가 필요합니다.

**4. 자동 재연결** — \`EventSource\`가 기본 제공합니다.

## 다만 — 실무에서는 \`EventSource\`가 아니라 fetch를 씁니다

\`EventSource\` API의 제약이 큽니다:
- **GET만 가능** → 긴 프롬프트를 URL에 담을 수 없음
- **커스텀 헤더 불가** → \`Authorization: Bearer\` 사용 불가 (쿠키로만)
- 요청 바디 없음

그래서 실무 LLM 채팅은 **POST + \`fetch\` + \`ReadableStream\`**으로 SSE 포맷을 직접 파싱합니다.

\`\`\`ts
const res = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${token}\` },
  body: JSON.stringify({ messages }),
  signal: controller.signal,
});

const reader = res.body!.getReader();
const decoder = new TextDecoder();
let buf = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  buf += decoder.decode(value, { stream: true });

  const lines = buf.split('\\n\\n');
  buf = lines.pop() ?? '';                    // 불완전한 마지막 조각은 보존
  for (const line of lines) {
    if (!line.startsWith('data: ')) continue;
    const data = line.slice(6);
    if (data === '[DONE]') return;
    handleChunk(JSON.parse(data));
  }
}
\`\`\`

**"SSE를 쓴다"는 것은 대개 이 방식**을 의미합니다. 서버는 \`text/event-stream\`으로 응답하되 클라이언트는 \`EventSource\` 대신 fetch를 씁니다.

## WebSocket이 나은 경우

- **진짜 양방향 실시간**이 필요할 때 — 음성 대화(오디오 스트림 왕복), 실시간 협업 편집, 멀티 사용자 세션
- **한 연결로 여러 스트림 다중화** — 여러 에이전트가 동시에 응답
- **바이너리 전송** — 오디오·이미지 청크
- 서버가 요청 없이도 이벤트를 밀어야 할 때 (알림, 상태 변경)

OpenAI Realtime API처럼 **음성 대화**를 다루는 경우가 대표적입니다.

## 서버 측 주의사항

\`\`\`ts
return new Response(stream, {
  headers: {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',   // no-transform 중요
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',                    // Nginx 버퍼링 비활성화
  },
});
\`\`\`

**버퍼링이 최대 함정입니다.** Nginx나 일부 프록시가 응답을 모아뒀다가 한 번에 보내면 스트리밍이 무의미해집니다. \`X-Accel-Buffering: no\`와 \`no-transform\`을 반드시 설정하세요.

**타임아웃**도 확인하세요. 서버리스 함수의 최대 실행 시간, 로드밸런서의 idle timeout이 긴 응답을 끊을 수 있습니다. 주기적 keep-alive 코멘트(\`: ping\\n\\n\`)를 보내는 것이 일반적인 대응입니다.

> 면접 답변: "LLM 텍스트 응답은 단방향이라 **SSE가 구조적으로 맞습니다.** HTTP 인프라를 그대로 쓸 수 있고 서버리스와도 궁합이 좋습니다. 다만 \`EventSource\`는 GET·헤더 제약이 있어 실무에서는 **POST + fetch + ReadableStream으로 SSE 포맷을 파싱**합니다. WebSocket은 음성 대화처럼 양방향·바이너리가 필요할 때 씁니다."`,
    sub_category: '스트리밍',
    difficulty: 'medium',
    tags: ['SSE', 'WebSocket', 'ReadableStream', '스트리밍', '버퍼링'],
  },
  {
    id: 'q-227',
    question: 'Fetch API를 사용하여 스트리밍 응답을 처리할 때 ReadableStream을 어떻게 다루나요?',
    answer: `\`fetch\`의 \`response.body\`는 **\`ReadableStream<Uint8Array>\`**입니다. 전체 응답을 기다리지 않고 도착하는 청크를 순차 처리할 수 있습니다.

## 기본 형태

\`\`\`ts
const res = await fetch('/api/chat', { method: 'POST', body, signal });
if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
if (!res.body) throw new Error('스트림 미지원');

const reader = res.body.getReader();
const decoder = new TextDecoder();

try {
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });   // ⭐ stream: true
    onChunk(chunk);
  }
} finally {
  reader.releaseLock();
}
\`\`\`

## 반드시 알아야 할 3가지 함정

### ① \`decoder.decode(value, { stream: true })\`

**\`{ stream: true }\`를 빠뜨리면 한글이 깨집니다.** UTF-8에서 한글은 3바이트인데, 청크 경계가 문자 중간을 자를 수 있습니다. \`stream: true\`는 불완전한 바이트를 다음 호출까지 내부 버퍼에 보관합니다.

\`\`\`
청크1: [ED 95] ← '한'의 앞 2바이트
청크2: [9C ...] ← 나머지
stream:true 없으면 각각 �로 디코딩됨
\`\`\`

### ② 청크 경계는 메시지 경계가 아닙니다

TCP 청크는 임의로 잘립니다. SSE의 \`data: ...\\n\\n\` 한 덩어리가 여러 청크에 걸치거나, 한 청크에 여러 메시지가 들어올 수 있습니다. **반드시 버퍼링해서 구분자로 나누세요.**

\`\`\`ts
let buffer = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  buffer += decoder.decode(value, { stream: true });

  const parts = buffer.split('\\n\\n');
  buffer = parts.pop() ?? '';        // ⭐ 마지막은 미완성일 수 있으므로 남겨둠

  for (const part of parts) {
    const line = part.split('\\n').find(l => l.startsWith('data: '));
    if (!line) continue;
    const data = line.slice(6);
    if (data === '[DONE]') return;
    try { onEvent(JSON.parse(data)); } catch { /* 파싱 실패 청크 무시 */ }
  }
}
\`\`\`

### ③ 에러 응답도 스트림입니다

\`res.ok\` 확인을 빠뜨리면 500 에러 본문을 토큰으로 착각해 화면에 뿌립니다.

## 유용한 패턴

**비동기 이터레이터로 감싸기**

\`\`\`ts
async function* streamLines(res: Response) {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) yield line;
    }
    if (buffer) yield buffer;
  } finally {
    reader.releaseLock();
  }
}

for await (const line of streamLines(res)) { /* ... */ }
\`\`\`

**TransformStream으로 파이프라인 구성** (Node 18+/모던 브라우저)

\`\`\`ts
const lines = res.body!
  .pipeThrough(new TextDecoderStream())
  .pipeThrough(new TextLineStream());   // 직접 구현하거나 라이브러리

for await (const line of lines) { }
\`\`\`

\`TextDecoderStream\`은 위의 \`stream: true\` 처리를 알아서 해줍니다. 더 선언적이고 안전합니다.

## React 통합 시 리렌더 최적화

토큰마다 \`setState\`하면 초당 수십 회 리렌더됩니다.

\`\`\`tsx
const buffer = useRef('');
const raf = useRef<number | null>(null);

const append = (chunk: string) => {
  buffer.current += chunk;
  if (raf.current !== null) return;
  raf.current = requestAnimationFrame(() => {
    setText(prev => prev + buffer.current);
    buffer.current = '';
    raf.current = null;
  });
};
\`\`\`

프레임당 최대 1회로 묶여 렌더 비용이 크게 줄어듭니다. 언마운트 시 \`cancelAnimationFrame\` 정리를 잊지 마세요.

## 취소와 정리

\`\`\`ts
const controller = new AbortController();
fetch(url, { signal: controller.signal });

// 중단
controller.abort();
// 또는 스트림만
await reader.cancel();
\`\`\`

\`AbortError\`는 사용자의 의도적 중단이므로 **에러 UI를 띄우지 않도록** 구분하세요.

\`\`\`ts
catch (e) {
  if (e instanceof DOMException && e.name === 'AbortError') return;
  throw e;
}
\`\`\`

## 그 밖의 주의점

- **\`getReader()\`는 스트림을 잠급니다(lock).** 같은 body를 두 번 읽을 수 없습니다. 필요하면 \`res.body.tee()\`로 분기하세요
- **\`finally\`에서 정리**하세요. 예외로 빠져나가도 reader가 해제되어야 합니다
- **Content-Encoding** — 서버가 gzip을 걸면 브라우저가 자동 해제하지만, 프록시가 버퍼링하면 스트리밍이 죽습니다. 서버에서 \`Cache-Control: no-transform\`, \`X-Accel-Buffering: no\`를 설정하세요
- **HTTP/1.1 동시 연결 제한(6개)** — 여러 스트림을 동시에 열면 막힙니다. HTTP/2를 쓰세요

> 면접 답변: "\`response.body.getReader()\`로 청크를 읽으면서 \`TextDecoder\`의 **\`{ stream: true }\`**로 디코딩합니다. 실무에서 놓치기 쉬운 건 **청크 경계가 메시지 경계와 다르다**는 점이라 버퍼링 후 구분자로 분할해야 하고, React에서는 rAF로 setState를 묶어 리렌더 폭발을 막습니다. 취소는 \`AbortController\`로 처리하되 \`AbortError\`를 일반 에러와 구분합니다."`,
    sub_category: '스트리밍',
    difficulty: 'hard',
    tags: ['ReadableStream', 'fetch', 'TextDecoder', 'SSE 파싱', 'AbortController'],
  },
  {
    id: 'q-228',
    question: '스트리밍 도중 네트워크 연결이 끊겼을 때 자연스럽게 재연결하는 전략은 무엇일까요?',
    answer: `## 1. 끊김을 먼저 감지해야 합니다

스트리밍 중단은 여러 형태로 나타납니다.

| 상황 | 감지 방법 |
| --- | --- |
| 연결 끊김 | \`reader.read()\`가 \`TypeError\`로 reject |
| 서버가 조용히 종료 | \`done: true\`인데 \`[DONE]\` 신호 없음 → **정상 종료와 구분 필요** |
| 응답이 멈춤(stall) | 마지막 청크 이후 타임아웃 |
| 오프라인 전환 | \`navigator.onLine\`, \`offline\` 이벤트 |
| 탭 백그라운드 | \`visibilitychange\` |

**가장 놓치기 쉬운 것은 "조용한 종료"입니다.** 서버가 \`[DONE]\`을 보내지 않고 스트림이 끝나면 정상 완료처럼 보입니다. **종료 신호를 프로토콜에 반드시 넣으세요.**

\`\`\`ts
let receivedDone = false;
// ... 루프 안에서 data === '[DONE]' 이면 receivedDone = true
if (!receivedDone) throw new StreamInterruptedError();
\`\`\`

## 2. Stall 감지 — 타임아웃 워치독

\`\`\`ts
let lastChunkAt = performance.now();
const STALL_MS = 15_000;

const watchdog = setInterval(() => {
  if (performance.now() - lastChunkAt > STALL_MS) {
    controller.abort();          // 재연결 로직으로 진입
    clearInterval(watchdog);
  }
}, 2_000);

// 청크 수신 시: lastChunkAt = performance.now();
\`\`\`

서버가 주기적으로 keep-alive(\`: ping\\n\\n\`)를 보내면 정상 대기와 stall을 구분할 수 있습니다.

## 3. 이어받기(Resume) — 핵심 설계

**처음부터 다시 생성하면 토큰 비용이 두 배가 되고 사용자는 앞부분을 또 읽어야 합니다.**

**서버가 이벤트 ID를 부여하고, 클라이언트가 마지막 수신 지점을 알려주는 구조**를 만듭니다.

\`\`\`
서버 → id: 42\\ndata: {"delta":"안녕"}\\n\\n
재연결 시 → Last-Event-ID: 42  (또는 요청 바디에 lastEventId)
서버 → 43번부터 재전송
\`\`\`

\`EventSource\`는 \`Last-Event-ID\` 헤더를 **자동으로** 보냅니다. fetch 방식이라면 직접 넣어야 합니다.

**서버 측 전제**: 생성 결과를 스트리밍하면서 **동시에 저장**해야 이어받기가 가능합니다.

\`\`\`
LLM → 서버: 토큰 스트림
서버 → ① 저장소에 append (Redis/DB)
      → ② 클라이언트로 전달
재연결 → 저장소에서 offset 이후를 먼저 보내고, 이후 실시간 스트림에 합류
\`\`\`

이 구조가 없다면 **차선책**은: 이미 받은 부분 텍스트를 assistant 메시지로 컨텍스트에 넣고 "이어서 작성해줘"로 재요청하는 것입니다. 완벽하지 않지만 처음부터 다시 하는 것보다는 낫습니다.

## 4. 지수 백오프 + 지터

\`\`\`ts
async function withRetry(fn: () => Promise<void>, max = 5) {
  for (let attempt = 0; attempt < max; attempt++) {
    try { return await fn(); }
    catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') throw e;  // 사용자 취소는 재시도 금지
      if (attempt === max - 1) throw e;

      const base = Math.min(1000 * 2 ** attempt, 30_000);
      const jitter = Math.random() * base * 0.3;                          // 동시 재접속 폭주 방지
      await new Promise(r => setTimeout(r, base + jitter));
    }
  }
}
\`\`\`

**지터가 중요한 이유**: 장애 복구 시 모든 클라이언트가 동시에 재접속하면 서버가 다시 무너집니다(thundering herd).

**재시도하면 안 되는 것**: 4xx(400, 401, 403, 422)는 재시도해도 같은 결과입니다. 429는 \`Retry-After\` 헤더를 존중하세요.

## 5. 오프라인 감지와 연동

\`\`\`ts
if (!navigator.onLine) {
  await new Promise<void>(resolve => {
    window.addEventListener('online', () => resolve(), { once: true });
  });
}
\`\`\`

오프라인인 걸 아는데 재시도를 반복하는 것은 배터리 낭비입니다. **네트워크가 돌아올 때까지 대기**했다가 재개하세요. 단 \`navigator.onLine\`은 "랜선이 꽂혔는지" 수준이라 실제 도달 가능성을 보장하지 않으므로, 보조 신호로만 쓰세요.

## 6. UX — 사용자에게 무엇을 보여줄까

**원칙: 이미 받은 텍스트는 절대 지우지 않습니다.**

\`\`\`tsx
{status === 'reconnecting' && (
  <InlineNotice>
    연결이 끊겨 재연결 중입니다… ({attempt}/5)
    <button onClick={retryNow}>지금 다시 시도</button>
  </InlineNotice>
)}
{status === 'failed' && (
  <InlineNotice tone="error">
    연결에 실패했습니다.
    <button onClick={resume}>이어서 생성</button>
    <button onClick={restart}>처음부터</button>
  </InlineNotice>
)}
\`\`\`

- 자동 재연결은 **조용히**, 실패 후에는 **명시적 선택지**를
- 재시도 횟수를 보여주면 사용자가 기다릴지 판단할 수 있습니다
- 수동 재시도 버튼을 항상 제공하세요

## 7. 멱등성

재요청 시 같은 \`requestId\`를 보내 **서버가 중복 생성을 방지**하게 합니다. 이게 없으면 재연결이 곧 이중 과금입니다.

## 8. 관측

재연결률, 평균 재시도 횟수, 이어받기 성공률을 로깅하세요. 특정 지역·통신사에서만 높다면 인프라 문제일 수 있습니다.

## 전체 흐름

\`\`\`
스트림 시작
 ├─ 청크 수신 → lastEventId 갱신, 워치독 리셋, 텍스트 누적
 ├─ [DONE] 수신 → 정상 완료
 └─ 에러 / stall / done without DONE
     ├─ 사용자 취소(AbortError) → 종료
     ├─ 오프라인 → online 이벤트 대기
     ├─ 4xx → 재시도 없이 실패 처리
     └─ 그 외 → 백오프+지터 대기 → Last-Event-ID로 재연결
         └─ 최대 횟수 초과 → 부분 텍스트 유지 + 수동 선택지 제공
\`\`\`

> 면접 답변: "**부분 응답을 절대 버리지 않는 것**이 대전제입니다. 서버가 이벤트 ID를 부여하고 생성 결과를 저장해두면 \`Last-Event-ID\`로 끊긴 지점부터 이어받을 수 있고, 이게 비용과 UX 모두에 결정적입니다. 재연결은 지수 백오프 + 지터로 하되 4xx와 사용자 취소는 재시도하지 않고, \`requestId\` 멱등성으로 중복 생성을 막습니다."`,
    sub_category: '스트리밍',
    difficulty: 'hard',
    tags: ['재연결', '지수 백오프', 'Last-Event-ID', '멱등성', '오프라인'],
  },
];
