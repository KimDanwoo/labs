import { NextResponse } from 'next/server';
import { spawn } from 'node:child_process';

/**
 * 로컬 Claude Code(구독 인증)로 답변 피드백을 생성하는 dev 전용 API.
 * CLI 스폰(~2-3초)이 병목이라, 프로세스를 미리 띄워두는 warm standby로 요청 경로에서 스폰 비용을 제거한다.
 * 프로세스는 대화 히스토리가 쌓이지 않게 1회용 — 응답을 받으면 죽이고 다음 요청용을 새로 예열한다.
 */
const IS_DEV = process.env.NODE_ENV === 'development';

const CLAUDE_TIMEOUT_MS = 90_000;
const MAX_INPUT_LENGTH = { question: 500, modelAnswer: 8_000, recall: 4_000 } as const;

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

type FeedbackInput = Record<keyof typeof MAX_INPUT_LENGTH, string>;

function spawnClaude() {
  return spawn('claude', CLAUDE_ARGS, {
    env: { ...process.env, MAX_THINKING_TOKENS: '0' },
    stdio: ['pipe', 'pipe', 'ignore'] as const,
  });
}

type ClaudeProcess = ReturnType<typeof spawnClaude>;

/** HMR로 모듈이 다시 로드돼도 대기 프로세스가 중복 생성되지 않게 globalThis에 보관한다. */
const standbyStore = globalThis as unknown as { __aiFeedbackStandby?: ClaudeProcess | null };

/** 대기 중인 프로세스를 꺼내고, 다음 요청을 위해 새 프로세스를 바로 예열한다. */
function takeClaude(): ClaudeProcess {
  const standby = standbyStore.__aiFeedbackStandby;
  standbyStore.__aiFeedbackStandby = spawnClaude();

  if (standby && standby.exitCode === null && !standby.killed) return standby;
  standby?.kill();
  return spawnClaude();
}

function generateFeedback(prompt: string): Promise<string> {
  const proc = takeClaude();

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      proc.kill();
      reject(new Error('claude timeout'));
    }, CLAUDE_TIMEOUT_MS);

    let buffer = '';
    proc.stdout.on('data', (chunk: Buffer) => {
      buffer += chunk.toString();
      let newlineIndex = buffer.indexOf('\n');
      while (newlineIndex >= 0) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);
        newlineIndex = buffer.indexOf('\n');
        if (!line) continue;

        let event: { type?: string; result?: string };
        try {
          event = JSON.parse(line) as { type?: string; result?: string };
        } catch {
          continue;
        }
        if (event.type !== 'result') continue;

        clearTimeout(timer);
        proc.kill();
        resolve((event.result ?? '').trim());
        return;
      }
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

function parseInput(body: unknown): FeedbackInput | null {
  if (typeof body !== 'object' || body === null) return null;

  const record = body as Record<string, unknown>;
  const entries = Object.entries(MAX_INPUT_LENGTH).map(([key, maxLength]) => {
    const value = record[key];
    if (typeof value !== 'string' || value.length > maxLength) return null;
    return [key, value] as const;
  });
  if (entries.some((entry) => entry === null)) return null;

  const input = Object.fromEntries(entries.filter(Boolean) as [string, string][]) as FeedbackInput;
  return input.question.trim() && input.recall.trim() ? input : null;
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

export async function POST(request: Request) {
  if (!IS_DEV) {
    return NextResponse.json({ error: '로컬 개발 환경에서만 사용할 수 있습니다.' }, { status: 404 });
  }

  const input = parseInput(await request.json().catch(() => null));
  if (!input) {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  try {
    const feedback = await generateFeedback(buildPrompt(input));
    if (!feedback) throw new Error('empty response');
    return NextResponse.json({ feedback });
  } catch {
    return NextResponse.json(
      { error: 'Claude 실행에 실패했습니다. 로컬에 Claude Code가 설치·로그인되어 있는지 확인하세요.' },
      { status: 503 },
    );
  }
}
