---
title: 'package.json 정리'
date: 2023-12-07
description: 'package.json은 현재 프로젝트에 관한 정보와, 패키지 매니저(npm,yarn)을 통해 설치한 모듈들의 의존성을 관리하는 파일이다. 일반적으로 루트 디렉토리에 위치한다. 직접 작성할 수 있으나, npm init을 통해 생성할 수 있다.'
thumbnail: ./thumbnail.png
category: 'javascript'
---

## 📃 package.json

package.json은 현재 프로젝트에 관한 정보와, 패키지 매니저(npm,yarn)을 통해 설치한 모듈들의 의존성을 관리하는 파일이다. 일반적으로 루트 디렉토리에 위치한다. 직접 작성할 수 있으나, npm init을 통해 생성할 수 있다.

프로젝트에 대한 명세이며 프로젝트와 패키지 정보를 담고 있다.

## 1. 생성방법

```bash
npm init // 프로젝트명, 설명 등 작성할 내용이 있을 경우
npm init -y // 입력 내용 없이 package.json 생성

yarn init
yarn init -y
```

## 2. package.json의 기본 정보

```json
  {
    "name": "project", // 필수영역 214자보다 짧아야 하고 점이나 밑줄로 시작할 수 없다.
    "version" : "1.0.0",
    "description": "project description",
    "keywords": ['react'],
    "main": "index.js",
    "homepage": "...",
    "config": {
      "port": "8000",
    },
    "scripts": {
      "dev": "react develop",
      "start": "react develop",
      "serve": "react serve",
      ...
    },
    "dependencies": { // 프로덕트 환경에서 응용 프로그램에 필요한 패키지, 의존성 명시 영역
      "react": "^18.0.2",
      ...
    },
    "devDependencies": { //로컬 개발 및 테스트에만 필요한 패키지.
      "types/react": "^18.0.2"
      ...
    },
    "peerDependencies":{
      ...
    }
    "author": "",
    "licence": "MIT
  }
```

### 💻 name & version

package.json 파일에서 name과 version필드는 각각 사용자들이 npm install 명령어로 해당 패키지를 설치할 때 사용할 패키지 이름과 버전을 명시한다. 필수영역

### 💻 description & keywords

설명을 문자열로 기술한다. npm search로 검색된 리스트에 표시되기 때문에 사람들이 내가 만든 패키지를 찾아내고 이해하는데 도움이 된다.

### 💻 main

해당 프로젝트의 시작점이 되는 모듈의 ID이다.

### 💻 config

config 객체는 패키지의 버전에 관계없이 패키지 스크립트에서 사용될 수 있는 설정 정보이다.

### 💻 script

package.json 파일의 scripts필드는 프로젝트에서 빈번하게 수행해야하는 작업을 스크립트로 등록하기 위해사용된다.

### 💻 dependencies

프로덕트 환경에서 응용 프로그램에 필요한 패키지. 일반적인 경우 의존성을 명시하는 영역이다.

### 💻 devDependencies

로컬 개발 및 테스트에만 필요한 패키지. 개발 모드일 때만 의존성을 명시하는 영역이다. 실제로 배포할 때는 필요없는 테스트 도구나 웹팩, 바벨 같은 것들을 넣어주면 된다.

### 💻 peerDependencies

라이브러리는 개발하다 보면, 해당 라이브러리에서 직접적으로 의존하지는 않지만, 해당 라이브러리가 사용자 측에선 제대로 작동하려면 사용자가 다른 라이브러리를 설치해 주어야 하는 경우가 있는데, 대표적으로 다른 라이브러리를 보조하거나 확장하는 플러그인이나 애드온 류의 라이브러리를 들 수 있다.

이럴때는 package.json 파일의 peerDependencies 필드를 통해서 반드시 같이 설치해줘야 하는 패키지를 명시할 수 있다.

### 💻 private

package.json 파일의 private 필드는 프로젝트가 npm 패키지 저장소로 발행해도 되는지 여부를 지정하기 위해서 사용된다. 기본값은 false이기 때문에 따로 명시해주지 않으면 해당 프로젝트가 실수로 npm패키지 저장소로 업로드되는 사고가 발생할 수 있다. 따라서 npm패키지 저장소로 올리면 안 되는 프로젝트에서는 private 필드의 값을 반드시 true로 설정하는 것이 보안 측면에서 권장된다.

### 💻 description & keywords

package.json 파일에서 name과 version필드는 각각 사용자들이 npm search 명령어로 해당 패키지를 검색할 때 보여질 패키지 설명과 키워드 목록을 명시한다. 따라서 npm 패키지 저장소에 올리지 않을 프로젝트라면 크게 신경 쓸 필요가 없는 설정이다.

### 💻 homepage & repository

package.json 파일의 homepage 옵션에는 해당 프로젝트의 홈페이지나 문서 페이지의 URL을 설정할 수 있다. 그러면 터미널에서 npm docs 명령어를 실행하여 간편하게 해당 URL을 열어볼 수 있다.

반면에 package.json 파일의 repository 옵션에는 해당 프로젝트의 코드 저장소의 URL을 설정할 수 있다. 그러면 터미널에서 npm repo 명령어를 실행하여 간편하게 해당 URL을 열어볼 수 있다.

이 두개의 옵션은 특히 npm 패키지 저장소에 프로젝트를 발행할 때 상당히 중요한데. npm 웹사이트에서 패키지 상세 페이지에 들어가면 homepage와 repository 항목에 이 두개의 URL이 링크되기 때문이다. 사용자들이 좀 더 안심하고 미리 패키지에 대한 정보를 확인 후에 설치할 수 있도록 돕기 위함이다.

### 💻 license

package.json 파일의 license 필드를 통해서는 해당 프로젝트의 라이센스를 표시할 수 있다. 아무리 좋은 패키지라도 라이센스가 명시되어 있지 않으면 쓰기가 꺼려지기 때문에 npm에 발행할 패키지라면 반드시 명시하는 것이 좋다.

### 💻 author & contributors

해당 프로젝트의 저자 및 공헌자는 각각 author와 contributors 필드에 명시할 수 있다.
