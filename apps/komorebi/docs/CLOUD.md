# 휴대폰에서 이어서 작업하기

이 게임의 클라우드 개발 설정은 `.devcontainer/komorebi/devcontainer.json`입니다.

1. GitHub Codespaces에서 이 브랜치를 선택하고 **Komorebi — 여름빛 산책** 구성을 사용합니다.
2. 최초 생성 때 의존성이 설치되고 개발 서버가 자동 실행됩니다. 재시작해도 자동 실행됩니다.
3. **Ports** 탭의 **3011 / 여름빛 산책** 링크를 휴대폰 브라우저에서 엽니다. 포트 공개 범위는 **Private**으로 둡니다. 같은 GitHub 계정으로 로그인해야 합니다.
4. 게임은 화면의 드래그 이동 패드와 달리기·점프 버튼으로 조작합니다. 코드는 Codespaces의 브라우저 편집기에서 수정합니다.
5. 작업 후 Source Control에서 커밋하고 Push합니다. Codespace를 삭제하기 전에 변경 사항을 반드시 Push하세요.

자동 실행에 실패하면 터미널에서:

```sh
npx --yes pnpm@9.12.1 --filter komorebi dev --hostname 0.0.0.0
```

자동 실행 로그: `/tmp/komorebi-dev.log`

로컬 Codex 대화가 Codespaces로 자동 이전되지는 않습니다. 클라우드 편집기에서 별도 AI 도구를 쓰려면 해당 도구의 로그인/설정이 필요합니다.
