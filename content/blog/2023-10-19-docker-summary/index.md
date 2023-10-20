---
title: '[Docker] 도커 간략히 요약'
date: 2023-10-19
description: '[Docker] 도커 간략히 요약'
thumbnail: './thumbnail.png'
---

## 1. docker 지시자

### 주요 지시자 종류

| #          | 설명                                                      |
| ---------- | --------------------------------------------------------- |
| FROM       | 베이스 이미지 지정                                        |
| MAINTAINER | 이미지를 생성한 사람의 이름 및 정보                       |
| LABEL      | Key-value 형식으로 작성된 메타 데이터                     |
| RUN        | 컨테이너 빌드를 위한 실행 Commands                        |
| COPY       | 컨테이너 빌드시 호스트 파일을 복사                        |
| ADD        | 컨테이너 빌드시 호스트 (tar,url)을 복사                   |
| WORKDIR    | 컨테이너 빌드시 명령이 실행될 작업 디렉토리               |
| ENV        | 환경 변수                                                 |
| USER       | 명령 및 컨테이너 실행시 적용할 유저 설정(기본 :root)      |
| VOLUME     | 컨테이너 내의 특정 디렉토리를 컨테이너 외부 경로에 마운트 |
| EXPOSE     | 컨테이너 동작 시 외부에서 사용할 포트 지정                |
| CMD        | 컨테이너 동작 시 자동으로 실행할 서비스 및 스크립트 지정  |
| ENTRYPOINT | CMD와 함께 사용하면서 Command 지정 시 사용                |

### DockerFile 작성

```docker
// DockerFile

FROM node : 16
RUN apk update
// COPY or ADD
COPY hello.js
ADD hello.js

// 실행
CMD ['node','/hello.js']
```

명령들에 대한 설명은 다음과 같다.

**FROM node:16**

FROM 명령어로 베이스 이미지를 지정한다. 이미지가 로컬에 존재하지 않으면 도커 허브에서 다운로드한다.

**RUN apk update**

RUN 명령어는 컨테이너에서 실행할 명령어를 지정한다. 이 구문에 대한 뜻은 패키지 매니저를 업데이트 한다.

**COPY hello.js / or ADD hello.js**

COPY와 ADD 명령어에 대한 차이는 이력 추정이 가능한지 아닌지에 따라 차이점이 있다.

COPY는 파일을 그대로 복사하고, ADD는 압축파일이면 압축을 해제한 상태로 복사한다.

그래서 관리자가 파일이 어디서 생겼는지 추정 할 수 없다. 이러한 이유로 일반적으로 COPY를 선호해서 사용하는 경우가 많다.

위에 명령어에 대한 설명은 hello.js파일을 배치할 곳을 ‘/’ 디렉토리로 지정한다.

CMD [”node”,”hello.js”]

컨테이너가 동작된 직후에 실행되는 커맨드를 지정한다.

### 이미지 빌드

```docker
docker build -t imagename:latest
```

: (점). 앞에 빈칸을 넣어야한다.

### 이미지 실행

위에 이미지 빌드로 만들어진 이미지를 통해 컨테이너를 실행해 보도록 하자.

```docker
docker run imagename:latest
```

## 정리

위에 내용을 정리해서 컨테이너 빌드하는 실행 순서는 다음과 같다.

1. 디렉터리를 준비하여 이미지를 생성할 파일들을 정리 및 추가
2. DockerFile을 작성
3. 컨테이너에서 실행할 애플리케이션 코드를 작성
4. 이미지를 빌드
5. 이미지 실행하여 동작을 확인

DockerFile 파일 내용

1. 베이스 이미지 repo
2. 설치할 패키지
3. 애플리케이션 코드 및 ENV 설정 파일
4. 컨테이너 가동 직후 실행될 명령어
