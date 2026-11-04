<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Unicorn Rush 렌더링 규칙

- 공통 구조·타입·커밋 규칙은 루트 `AGENTS.md`를 따른다.
- 배경 HDR은 로컬 파일을 사용하고 출처·라이선스를 `public/environments/README.md`에 기록한다. 모바일은 1K만 요청해야 한다.
- 원경 산맥은 구운 프로파일 텍스처를 사용한다. 프레임마다 다중 옥타브 노이즈를 다시 계산하지 않는다.
- 렌더 픽셀 상한과 인스턴싱 예산을 유지한다. 새 지오메트리·텍스처·후처리 패스에는 해제 경로가 있어야 한다.
- 프레임별 이동·카메라·셰이더 변경은 ref/Three 객체에 반영한다. HUD는 반올림한 값을 제한된 주기로 구독한다.
- 시각/조작 변경 후 앱 lint·타입·테스트·빌드를 확인하고 `pnpm --filter prairie test:e2e`로 배포 빌드의 실제 프레임과 키보드·터치 흐름을 검증한다.
