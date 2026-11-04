export const SECURITY = [
  {
    id: 'q-212',
    question: '서버리스 함수로 API 키와 같은 민감한 정보를 어떻게 관리할까요?',
    answer: `## 대전제 — 클라이언트에 보낸 순간 비밀이 아닙니다

번들 난독화, 환경변수 주입, localStorage 저장 모두 **비밀 유지 수단이 아닙니다.** 브라우저 개발자도구 Network 탭과 소스맵으로 전부 드러납니다. 유일한 해법은 **비밀을 클라이언트에 보내지 않는 것**입니다.

## 프록시 패턴 — 기본 구조

\`\`\`
브라우저 → (키 없음) → 서버리스 함수 → (키 첨부) → 외부 API
\`\`\`

\`\`\`ts
// app/api/weather/route.ts  (서버에서만 실행)
export async function GET(req: Request) {
  const city = new URL(req.url).searchParams.get('city');
  if (!city) return Response.json({ error: 'city 필요' }, { status: 400 });

  const res = await fetch(\`https://api.weather.com?q=\${encodeURIComponent(city)}&key=\${process.env.WEATHER_API_KEY}\`);
  if (!res.ok) return Response.json({ error: '조회 실패' }, { status: 502 });

  const data = await res.json();
  return Response.json({ temp: data.temp, desc: data.desc });   // 필요한 필드만 반환
}
\`\`\`

브라우저는 \`/api/weather?city=seoul\`만 호출하며 키를 알 수 없습니다.

## Next.js 환경변수 규칙 — 사고의 단골 원인

\`\`\`
NEXT_PUBLIC_*  → 빌드 시 클라이언트 번들에 문자열로 인라인됨 (완전 공개)
그 외          → 서버 런타임에서만 접근 가능
\`\`\`

**\`NEXT_PUBLIC_\`을 시크릿에 붙이는 순간 유출입니다.** Supabase의 \`anon key\`처럼 **공개가 설계 전제인 값**만 붙이고(이 경우 RLS가 실제 방어선), \`SUPABASE_SERVICE_ROLE_KEY\`는 절대 붙이면 안 됩니다.

## 반드시 지킬 것들

**1. 저장 위치**
- \`.env.local\`은 **\`.gitignore\`에 등록**하고 절대 커밋하지 않습니다
- 실제 값은 플랫폼 시크릿 스토어에 둡니다(Vercel Environment Variables, AWS Secrets Manager, GitHub Actions Secrets)
- 저장소에는 \`.env.local.example\`에 **키 이름만** 남깁니다

**2. 프록시를 오픈 프록시로 만들지 말 것**
키를 숨겨도 **엔드포인트 자체가 무료 API 게이트웨이가 되면** 요금 폭탄을 맞습니다. 반드시 함께 구현하세요:
- **인증·인가** — 로그인 사용자만, 그리고 본인 리소스만
- **레이트 리밋** — IP·사용자 단위 (Upstash Redis 등)
- **입력 검증** — zod로 파라미터 화이트리스트
- **응답 최소화** — 외부 API 응답을 그대로 흘려보내지 말고 필요한 필드만
- **CORS 제한** — 허용 오리진 명시

**3. 로그에 비밀을 남기지 말 것**
\`console.log(process.env)\`, 에러 객체에 담긴 요청 URL(쿼리에 키가 있으면), Sentry 컨텍스트 모두 유출 경로입니다. 키는 **쿼리스트링이 아니라 헤더**로 보내세요.

**4. 유출 시 대응 — 순서**
1. **즉시 키 폐기(revoke) 후 재발급.** 커밋을 지우는 것이 먼저가 아닙니다
2. Git 히스토리 정리(\`git filter-repo\`, BFG). 단 이미 클론된 사본은 회수 불가
3. 해당 키의 접근 로그 확인
4. 재발 방지 — pre-commit 시크릿 스캐너(gitleaks, trufflehog), GitHub Secret Scanning 활성화

**5. 회전(rotation)과 최소 권한**
- 키에 **필요한 스코프만** 부여하고 가능하면 IP·도메인 제한을 겁니다
- 주기적으로 회전하고, 회전이 가능하도록 코드에서 키를 한 곳에서만 읽게 만듭니다
- 장기 정적 키보다 **단기 토큰 발급**(STS, OIDC)이 가능하면 그쪽이 낫습니다

## 특수 케이스

**클라이언트가 외부 서비스에 직접 연결해야 할 때** (S3 업로드, 실시간 스트리밍)
→ 서버가 **단기 유효 자격증명**을 발급합니다: presigned URL, 짧은 TTL의 임시 토큰. 영구 키를 내려보내지 않습니다.

**서드파티 SDK가 공개 키를 요구할 때** (Stripe publishable key, Google Maps key)
→ 설계상 공개 키입니다. 대신 **서비스 콘솔에서 도메인·리퍼러 제한**을 반드시 걸어 남용을 막습니다.

**LLM API 호출** — 특히 위험합니다. 키가 유출되면 즉시 비용이 발생합니다. 반드시 서버 프록시 + 사용자별 쿼터 + 스트리밍 릴레이 구조로 만드세요.

> 면접 답변: "비밀은 서버 경계 안에만 둡니다. 서버리스 함수를 프록시로 두고 클라이언트는 키 없는 자체 엔드포인트만 호출하게 합니다. 다만 **프록시가 오픈 게이트웨이가 되지 않도록 인증·레이트 리밋·입력 검증이 세트**로 들어가야 하고, \`NEXT_PUBLIC_\` 접두사의 의미를 정확히 아는 게 중요합니다."`,
    sub_category: '시크릿 관리',
    difficulty: 'medium',
    tags: ['API 키', '서버리스', '환경변수', '프록시', '레이트리밋'],
  },
  {
    id: 'q-213',
    question: '프런트엔드 영역에서 발생할 수 있는 웹 사이트의 보안 위협은 어떤 것이 있을까요?',
    answer: `## 1. XSS (Cross-Site Scripting) — 프론트엔드 최대 위협

공격자의 스크립트가 피해자 브라우저에서 **우리 오리진의 권한으로** 실행됩니다. 쿠키·토큰 탈취, 화면 위조, 요청 위조가 모두 가능합니다.

- **Stored** — DB에 저장된 스크립트가 다른 사용자에게 전달 (게시글, 댓글, 프로필)
- **Reflected** — URL 파라미터가 그대로 화면에 출력
- **DOM-based** — 서버를 거치지 않고 클라이언트 JS가 위험한 싱크에 값을 넣음

**방어**
- 출력 시 컨텍스트에 맞는 이스케이프 (React/Vue의 기본 보간이 HTML 컨텍스트를 처리)
- \`dangerouslySetInnerHTML\`·\`v-html\`·\`innerHTML\` 사용 시 **DOMPurify** 통과
- **CSP** 헤더로 인라인 스크립트 차단 (nonce 기반)
- 쿠키에 **HttpOnly** → JS가 토큰을 읽지 못하게

## 2. CSRF (Cross-Site Request Forgery)

사용자가 로그인된 상태를 이용해 다른 사이트에서 요청을 위조합니다.

**방어**: \`SameSite=Lax|Strict\` 쿠키(기본 방어), CSRF 토큰, \`Origin\`/\`Referer\` 검증. **Authorization 헤더 기반 인증은 자동 전송되지 않아 구조적으로 CSRF에 강합니다.**

## 3. 민감 정보 노출

- **번들에 시크릿 포함** — \`NEXT_PUBLIC_\` 오용, 하드코딩된 키
- **소스맵을 프로덕션에 배포** — 원본 코드와 주석 노출
- **API 과다 응답** — 사용자 목록에 이메일·전화번호·해시가 함께 내려옴 (프론트에서 안 보여줘도 Network 탭에는 보임)
- **에러 메시지에 스택 트레이스·내부 경로**

## 4. 안전하지 않은 토큰 저장

| 저장소 | XSS | CSRF | 평가 |
| --- | --- | --- | --- |
| \`localStorage\` | ❌ 취약 | 안전 | JS로 읽히므로 XSS 한 번에 전부 탈취 |
| \`sessionStorage\` | ❌ 취약 | 안전 | 동일 |
| **HttpOnly 쿠키** | ⭕ 안전 | SameSite로 방어 | **권장** |
| 메모리(변수) | 비교적 안전 | 안전 | 새로고침 시 소실 |

**권장 조합**: Access Token은 메모리, Refresh Token은 \`HttpOnly; Secure; SameSite=Lax\` 쿠키.

## 5. 클릭재킹 (Clickjacking)

투명 iframe으로 우리 사이트를 덮어 사용자가 의도치 않은 버튼을 누르게 합니다.
**방어**: \`Content-Security-Policy: frame-ancestors 'none'\` (또는 \`X-Frame-Options: DENY\`).

## 6. 공급망 공격 (Supply Chain)

- **악성 npm 패키지** — 타이포스쿼팅(\`reakt\`), 계정 탈취된 인기 패키지에 악성 코드 삽입
- **CDN 변조** — 서드파티 스크립트가 바뀜
- **의존성 취약점** — 오래된 패키지의 알려진 CVE

**방어**: 락파일 커밋, \`npm audit\`/Dependabot, CDN 스크립트에 **SRI(Subresource Integrity)**, 새 의존성 추가 전 실재·유지보수 상태 확인.

## 7. 오픈 리다이렉트

\`\`\`js
// ❌ ?next=https://evil.com 으로 피싱 사이트 이동
router.push(searchParams.get('next'));
\`\`\`
**방어**: 리다이렉트 대상을 화이트리스트 검증하거나 **상대 경로만 허용**.

## 8. 프로토타입 오염 (Prototype Pollution)

사용자 입력으로 \`__proto__\`를 조작해 모든 객체의 동작을 바꿉니다. 깊은 병합(deep merge) 유틸이 주요 진입점입니다.
**방어**: \`Object.create(null)\`, 키 검증, 검증된 라이브러리 사용.

## 9. 정규식 DoS (ReDoS)

백트래킹이 폭발하는 정규식에 긴 입력을 주면 메인 스레드가 멈춥니다. 사용자 입력 검증 정규식에 중첩 수량자(\`(a+)+\`)를 쓰지 마세요.

## 10. 그 외

- **CORS 설정 오류** — \`Access-Control-Allow-Origin: *\` + \`credentials\` 조합
- **HTTPS 미적용 / Mixed Content** — 중간자 공격, 스크립트 주입
- **postMessage 오리진 미검증** — \`event.origin\` 확인 필수
- **취약한 CSP** — \`unsafe-inline\`, \`unsafe-eval\`이 있으면 CSP가 사실상 무력

## 방어 우선순위 (실무)

1. **HTTPS + 보안 헤더** (CSP, HSTS, X-Content-Type-Options, frame-ancestors) — 설정 한 번으로 광범위 방어
2. **HttpOnly + SameSite 쿠키** — 토큰 저장 전략 확정
3. **출력 이스케이프 + 입력 검증(zod)** — XSS/인젝션 근본 대응
4. **의존성 관리 자동화** — Dependabot + audit을 CI 게이트로
5. **최소 권한 응답 설계** — 서버가 필요한 필드만 내려보내기

> 중요한 관점: **프론트엔드 검증은 UX이지 보안이 아닙니다.** 클라이언트 코드는 사용자가 전부 통제할 수 있으므로 모든 검증은 **서버에서 다시** 해야 합니다. 프론트엔드의 보안 책임은 "브라우저 안에서 벌어지는 공격(XSS·클릭재킹·토큰 탈취)"과 "비밀을 클라이언트에 보내지 않는 것"에 집중됩니다.`,
    sub_category: '보안 개요',
    difficulty: 'medium',
    tags: ['XSS', 'CSRF', '클릭재킹', '공급망', '보안헤더', '토큰저장'],
  },
  {
    id: 'q-214',
    question: '서드 파티 스크립트를 추가할 때 발생할 수 있는 성능과 보안 위험은 무엇일까요?',
    answer: `분석 도구(GA, Amplitude), 광고, 챗봇, A/B 테스트, 태그 매니저 — 대부분의 서비스가 붙이지만 **우리 오리진의 전권을 남에게 주는 행위**입니다.

## 보안 위험

**1. 우리 오리진의 모든 권한을 갖습니다**
서드파티 스크립트는 우리 페이지에서 실행되므로:
- DOM 전체 읽기·조작 (입력 폼 값, 결제 정보)
- **HttpOnly가 아닌 쿠키**와 \`localStorage\` 접근
- 우리 오리진 이름으로 API 호출 (세션 쿠키 자동 첨부)
- 사용자 몰래 다른 스크립트 추가 로드

**2. 공급망 공격 (Magecart)**
공격자가 서드파티 CDN이나 벤더 계정을 침해해 스크립트를 변조하면, **우리는 코드를 한 줄도 안 바꿨는데** 결제 정보가 유출됩니다. 실제로 브리티시 에어웨이·티켓마스터 등의 대형 유출 사고가 이 방식이었습니다(공개된 사건 사례 기준).

**3. 태그 매니저의 위험**
GTM은 **개발자 배포 없이 마케터가 임의 JS를 프로덕션에 주입**할 수 있는 통로입니다. 편의성이 곧 리스크이며, 코드 리뷰·CI를 우회합니다.

**4. 개인정보·규제 리스크**
서드파티가 수집하는 데이터가 개인정보처리방침에 없거나, 국외 이전 동의가 없으면 문제가 됩니다. **국내는 개인정보보호법상 수집·이용 동의와 국외이전 고지 의무가 있으므로, 도입 전 법무·개인정보 담당 검토가 필요합니다.** (이 부분은 실제 서비스 성격·수집 항목에 따라 판단이 달라지므로 단정하기 어렵습니다.)

## 성능 위험

**1. 메인 스레드 점유**
서드파티 JS 파싱·실행은 우리 코드와 같은 스레드를 씁니다. **INP·TBT가 직접 악화**됩니다.

**2. 렌더 블로킹**
\`<head>\`에 일반 \`<script>\`로 넣으면 HTML 파싱이 멈춥니다.

**3. 네트워크 워터폴**
스크립트가 또 다른 스크립트를 부르는 연쇄가 흔합니다. 태그 매니저 하나가 10개 스크립트를 끌어오는 경우도 있습니다.

**4. 통제 불가능한 가용성**
서드파티 서버가 느리거나 죽으면 우리 페이지가 함께 느려집니다. **SLA가 없습니다.**

**5. 레이아웃 시프트(CLS)**
광고·챗봇 위젯이 나중에 삽입되며 콘텐츠를 밀어냅니다.

## 대응 방법

**로딩 전략 — Next.js \`next/script\`**

\`\`\`tsx
import Script from 'next/script';

<Script src="https://analytics.example.com/a.js" strategy="afterInteractive" />
<Script src="https://chat.example.com/w.js" strategy="lazyOnload" />
\`\`\`

| strategy | 시점 | 용도 |
| --- | --- | --- |
| \`beforeInteractive\` | 하이드레이션 전 | 봇 탐지, 폴리필 (꼭 필요할 때만) |
| \`afterInteractive\` | 하이드레이션 직후 (기본) | 분석 도구 |
| \`lazyOnload\` | 유휴 시간 | 챗봇, 위젯 |
| \`worker\` (실험적) | Web Worker | Partytown 기반 |

**보안 통제**

\`\`\`html
<!-- SRI: 파일이 변조되면 실행 거부 -->
<script src="https://cdn.example.com/lib.js"
        integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC"
        crossorigin="anonymous"></script>
\`\`\`

**주의**: SRI는 **버전 고정된 파일**에만 유효합니다. GA처럼 내용이 계속 바뀌는 스크립트에는 쓸 수 없습니다 — 그런 스크립트는 애초에 SRI로 보호가 안 된다는 뜻이고, 그만큼 신뢰에 의존한다는 의미입니다.

\`\`\`
Content-Security-Policy:
  script-src 'self' https://trusted-cdn.com;
  connect-src 'self' https://api.trusted.com;
\`\`\`

CSP로 **허용된 출처만** 스크립트를 로드·통신하게 제한합니다. \`connect-src\`까지 걸어야 데이터 유출 채널을 막을 수 있습니다.

**격리**
- **Partytown** — 서드파티 스크립트를 Web Worker로 옮겨 메인 스레드를 비웁니다. GA 같은 분석 도구에 효과적
- **iframe + sandbox** — 위젯을 별도 오리진으로 격리. 가장 강한 격리이지만 통합이 어려움
- **서버사이드 태깅** — 브라우저 대신 서버가 분석 데이터를 전송. 스크립트를 아예 없앰

## 도입 체크리스트

1. **정말 필요한가** — 이미 있는 도구와 중복되지 않는가
2. **자체 구현으로 대체 가능한가** — 간단한 이벤트 수집이라면 직접 만드는 것이 가볍고 안전
3. 벤더의 보안·가용성 이력, 스크립트 크기
4. **CSP·SRI 적용 가능 여부**
5. 로딩 전략 결정 (\`lazyOnload\`가 기본, 예외를 정당화)
6. **도입 전후 Lighthouse·RUM 지표 비교** — 숫자로 비용을 확인
7. 수집 데이터와 개인정보처리방침 정합성
8. **제거 조건과 담당자 지정** — 안 쓰는 스크립트가 몇 년째 남아 있는 것이 가장 흔한 문제

> 면접 답변: "서드파티 스크립트는 **우리 오리진의 전권을 주는 것**이라 XSS와 동등한 위험을 상시 안고 가는 셈입니다. 성능은 \`next/script\` 전략과 Partytown으로, 보안은 **CSP + SRI + 최소 도입 원칙**으로 관리하고, 도입 전후를 RUM으로 측정해 비용을 숫자로 확인하는 게 실무 방식입니다."`,
    sub_category: '서드파티',
    difficulty: 'medium',
    tags: ['서드파티', 'CSP', 'SRI', 'Partytown', '공급망', '성능'],
  },
];
