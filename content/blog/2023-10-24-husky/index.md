---
title: 'Husky + Lint-Staged를 활용 git hook 걸기'
date: 2023-10-24
description: 'Git Hook을 도와주는 Husky와 Link-Staged'
thumbnail: './thumbnail.png'
category: 'git'
isHidden: false
---

## 1. git Hook을 도와주는 Husky와 link-staged

### 1-1. Husky ?

**Git Hook 설정을 도와주는 npm package이다**. Git Hook 설정을 쉽게 해준다. 다른 팀원이 프로젝트를 받았을 때 npm install을 하면 저절로 Git Hook 설정이 되도록 해줄 수도 있다. 즉 한명이 Git Hook을 적용한 프로젝트를 만들면, 다른 팀원은 npm install만 하면 Git Hook이 적용된 상태에서 개발을 시작할 수 있게 된다.

### 1-2. Git Hook ?

**git commit, git push 등 git 이벤트 발생 전, 후로 특정 스크립트(Hook)를 실행 시킬 수 있다.** 이러한 스크립트를 Git Hook이라고 한다.

### 1-3. link-staged ?

stage 상태는 파일들이 git add로 커밋 대상이 된 상태를 stage 상태라고 한다. **stage상태의 git 파일에 대해서만 우리가 설정해둔 명령어를 실행**해주는 라이브러리이다.

## 2. Husky, Prettier, link-stated 설치 및 설정

### 2-1. 설치

```bash
// 설치
npm i -D husky // husky 설치
npm i -D prettier // prettier 설치
npm i -D lint-staged // link-staged 설치

// husky 실행
npx husky install
```

설치 완료 후 package.json에 아래의 설정을 추가해준다.

```jsx
// package.json
"scripts": {
  ...
  "prepare": "husky install", // 추가
}
```

.prettierrc 에 prettier관련 설정을 추가해준다.

```bash
// .prettierrc
{
  {설정} : {상태}
}
```

### 2-2. lint-staged 내용 추가

그리고 lint-staged에 pre-commit 하고 싶은 내용들을 추가한다.

```json
{
  ...
  "scripts": {
	  ...
	  "lint-staged": "lint-staged"
  },
  "lint-staged": {
    "**/*.{tsx,ts,jsx,js,vue}": [ // 포맷팅할 확장자 설정
      "eslint --fix", // lint 설정 수정
      "prettier --write" // prettier 설정 검사
    ]
  }
}
```

### 2-3. Husky pre-commit 파일 설정

이제 마지막단계인 husky를 작업해주면 된다.

아래를 터미널에 실행해 준다.

```bash
npx husky add .husky/pre-commit "npm run lint-staged"
```

위와같이 작성해주면 위에서 설정한 package.json script에 적어놓은 명령어를 실행시켜준다.

그럼 git add 로 스테이지에 올라가있는 파일들을 commit시 검사해서 prettier가 적용되지 않았으면 경고를 띄워준다.

## 3. dependency와 devDependency의 차이 (번외)

설치할 패키지에 -D를 붙이면 devDependency에 추가가 된다.

이 둘의 차이는 배포된 프로젝트에 해당 패키지가 들어가나, 안들어가나의 차이이다. ESLint나 Prettier, Husky는 개발할 때 유용한 도구이다. 프로젝트의 핵심 로직에는 아무런 영향이 없다. 컨벤경이 맞춰진 상태로 배포를 하고 나면, 그 배포된 프로젝트에는 이 도구들이 필요가 없다. 그 땐 **컨벤션이 다 맞춰진 상태이고 로직에 아무런 영향을 끼치지 않기 때문에 devDependencies에 넣어 배포될 때에는 이 패키지들이 포함되지 않도록 하여 용량을 줄일 수 있다.**
