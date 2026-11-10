import { spawn } from 'node:child_process';

/**
 * 로컬 Claude Code(구독 인증)로 답변 피드백을 생성한다. dev 전용.
 * CLI 스폰(~2-3초)이 병목이라, 프로세스를 미리 띄워두는 warm standby로 요청 경로에서 스폰 비용을 제거한다.
 * 프로세스는 대화 히스토리가 쌓이지 않게 1회용 — 응답을 받으면 죽이고 다음 요청용을 새로 예열한다.
 */
const CLAUDE_TIMEOUT_MS = 90_000;
const MAX_INPUT_LENGTH = { question: 500, modelAnswer: 8_000, recall: 4_000 } as const;
const RESULT_EVENT = 'result';

/** haiku + thinking 비활성 + MCP·설정 로딩 생략 — 3줄 피드백엔 충분하고 가장 빠른 조합. */
const CLAUDE_ARGS = [
  '-p',
  '--input-format',
  'stream-json',
  '--output-format',
  'stream-json',
  '--verbose',
  '--model',
  'haiku',
  '--strict-mcp-config',
  '--setting-sources',
  '',
];

type FeedbackField = keyof typeof MAX_INPUT_LENGTH;
export type FeedbackInput = Record<FeedbackField, string>;

function spawnClaude() {
  return spawn('claude', CLAUDE_ARGS, {
    env: { ...process.env, MAX_THINKING_TOKENS: '0' },
    stdio: ['pipe', 'pipe', 'ignore'] as const,
  });
}

type ClaudeProcess = ReturnType<typeof spawnClaude>;

declare global {
  /** HMR로 모듈이 다시 로드돼도 대기 프로세스가 중복 생성되지 않게 globalThis에 보관한다. */
  var aiFeedbackStandby: ClaudeProcess | undefined;
}

/** 대기 중인 프로세스를 꺼내고, 다음 요청을 위해 새 프로세스를 바로 예열한다. */
function takeClaude(): ClaudeProcess {
  const standby = globalThis.aiFeedbackStandby;
  globalThis.aiFeedbackStandby = spawnClaude();

  if (standby && standby.exitCode === null && !standby.killed) return standby;
  standby?.kill();
  return spawnClaude();
}

/** stream-json 한 줄이 최종 결과 이벤트면 그 본문을, 아니면 null을 돌려준다. */
function readResult(line: string): string | null {
  let event: unknown;
  try {
    event = JSON.parse(line);
  } catch {
    return null;
  }
  if (typeof event !== 'object' || event === null) return null;
  if (!('type' in event) || event.type !== RESULT_EVENT) return null;
  return 'result' in event && typeof event.result === 'string' ? event.result.trim() : '';
}

function runClaude(prompt: string): Promise<string> {
  const proc = takeClaude();

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      proc.kill();
      reject(new Error('claude timeout'));
    }, CLAUDE_TIMEOUT_MS);

    let buffer = '';
    proc.stdout.on('data', (chunk: Buffer) => {
      const lines = (buffer + chunk.toString()).split('\n');
      buffer = lines.pop() ?? '';

      const result = lines.map(readResult).find((parsed) => parsed !== null);
      if (result === undefined) return;

      clearTimeout(timer);
      proc.kill();
      resolve(result);
    });

    proc.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });

    const userMessage = JSON.stringify({
      type: 'user',
      message: { role: 'user', content: [{ type: 'text', text: prompt }] },
    });
    proc.stdin.write(`${userMessage}\n`);
  });
}

function readText(body: object, field: FeedbackField): string | null {
  const value: unknown = Reflect.get(body, field);
  return typeof value === 'string' && value.length <= MAX_INPUT_LENGTH[field] ? value : null;
}

/** 요청 본문을 검증한다. 형식·길이가 맞지 않거나 질문·답변이 비어 있으면 null. */
export function parseFeedbackInput(body: unknown): FeedbackInput | null {
  if (typeof body !== 'object' || body === null) return null;

  const question = readText(body, 'question');
  const modelAnswer = readText(body, 'modelAnswer');
  const recall = readText(body, 'recall');
  if (question === null || modelAnswer === null || recall === null) return null;

  return question.trim() && recall.trim() ? { question, modelAnswer, recall } : null;
}

function buildPrompt({ question, modelAnswer, recall }: FeedbackInput): string {
  return [
    '당신은 프론트엔드 시니어 면접관이다. 지원자의 답변을 평가하라.',
    '',
    `[질문]\n${question}`,
    modelAnswer.trim()
      ? `[모범 답변]\n${modelAnswer}`
      : '[모범 답변]\n(정해진 답 없음 — 논리와 트레이드오프 관점으로 평가)',
    `[지원자 답변]\n${recall}`,
    '',
    '한국어로 정확히 3줄, 각 줄은 한 문장, 마크다운 강조 없이:',
    '잘 짚은 것: …',
    '놓치거나 틀린 것: …',
    '다음엔 이렇게: …',
    '지원자 답변에 실제로 있는 내용에만 근거하고, 없는 사실을 만들지 마라. 3줄 외에 아무것도 출력하지 마라.',
  ].join('\n');
}

/** 답변 피드백 3줄을 생성한다. 응답이 비었거나 시간 안에 오지 않으면 거부한다. */
export async function generateAiFeedback(input: FeedbackInput): Promise<string> {
  const feedback = await runClaude(buildPrompt(input));
  if (!feedback) throw new Error('empty response');
  return feedback;
}
