#!/bin/sh
# main/master 직접 커밋 차단 — 커밋 전 브랜치를 파도록 강제.
# PreToolUse(Bash) 훅: git commit 명령이고 현재 브랜치가 main/master 면 exit 2 로 차단.

CMD=$(jq -r '.tool_input.command // ""')

echo "$CMD" | grep -qE 'git[[:space:]]+commit' || exit 0

BR=$(git branch --show-current 2>/dev/null)
if [ "$BR" = main ] || [ "$BR" = master ]; then
  echo "main 직접 커밋 금지 — 'git switch -c <type>/<kebab-요약>' 로 브랜치를 판 뒤 커밋하세요." >&2
  exit 2
fi
