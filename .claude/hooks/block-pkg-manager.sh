#!/bin/sh
# npm/yarn 사용 차단 — 이 레포는 pnpm workspace(catalog/engine-strict).
# PreToolUse(Bash) 훅: stdin 으로 들어온 명령에 npm/yarn 이 단어로 있으면 exit 2 로 차단.
# npx / pnpm / pnpm dlx 등은 통과.

CMD=$(jq -r '.tool_input.command // ""')

if echo "$CMD" | grep -qE '(^|[^[:alnum:]_])(npm|yarn)([[:space:]]|$)'; then
  echo 'npm/yarn 금지 — 이 레포는 pnpm workspace(catalog/engine-strict). pnpm 을 쓰세요.' >&2
  exit 2
fi
