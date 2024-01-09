---
title: '[Git] husky와 git hook'
date: 2024-01-08
description: 'husky와  git hook을 알아보자'
thumbnail: './thumbnail.png'
category: 'git'
---

## Git Hooks 란?

**Git Hooks는 Git과 관련한 어떤 이벤트가 발생했을 때 특정 스크립트를 실행할 수 있도록 하는 기능**이다. 크게 **클라이언트 훅** 과 **서버 훅** 으로 나뉘는데 **클라이언트 훅은 커밋, Merge가 발생하거나 push가 발생하기 전 클라이언트에서 실행하는 훅**이다. 반면 **서버 훅은 Git repository로 push가 발생했을 때 서버에서 실행하는 훅**이다.

> 만약 Git Repository 서버를 관리할 수 있는 권한이 있다면 서버 훅을 활용하는 게 더 유용할 수 있다. Git Repository 서버에 있는 모든 프로젝트에 대해 push 정책을 설정할 수 있기 때문이다.

클라이언트 훅은 **커밋 워크플로 훅**, **이메일 워크플로 훅**, 그리고 **기타 훅**으로 **분류**할 수 있다.

커밋 워크플로 훅은 **git commit 명령으로 커밋을 할 때 실행하는 훅**이고, 이메일 워크플로 훅은 **git am명령으로 이메일을 통해 patch 파일을 적요할 때 실행하는 훅**이다. 기타 훅은 **Rebase, Merge, Push 와 같은 이벤트를 실행할 때 실행하는 훅을 포함**한다.

| 분류                   | 훅                 | 설명                                                                                                                          |
| ---------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| **커밋 워크플로 훅**   | pre-commit         | commit 을 실행하기 전에 실행                                                                                                  |
|                        | prepare-commit-msg | commit 메세지를 생성하고 편집기를 실행하기 전에 실행                                                                          |
|                        | commit-msg         | commit 메세지를 완성한 후 commit을 최종 완료하기 전에 실행                                                                    |
|                        | post-commit        | commit을 완료한 후 실행                                                                                                       |
| **이메일 워크플로 훅** | applypatch-msg     | git am 명령 실행 시 가장 먼저 실행                                                                                            |
|                        | pre-applypatch     | patch 적용 후 실행하며, patch를 중단시킬 수 있음                                                                              |
|                        | post-applypatch    | git am 명령에서 마지막으로 실행하며, patch를 중단시킬 수 없음                                                                 |
| **기타 훅**            | pre-rebase         | Rabase하기 전에 실행                                                                                                          |
|                        | post-rewrite       | git commit -amend, git rebase와 같이 커밋을 변경하는 명령을 실행한 후 실행                                                    |
|                        | post-merge         | Merge가 끝나고 실행                                                                                                           |
|                        | pre-push           | git push 명령 실행 시 동작하며 리모트 정보를 업데이트 하고 난 후 리모트로 데이터를 전송하기 전에 실행 push를 중단시킬 수 있음 |

## Git Hooks를 적용하려면?

Git Hooks는 .git/hooks 디렉토리 안에 저장한다. hook은 실행가는한 스크립트이며, 설정하고자 하는 훅 이름을 확장자 없이 파일명으로 지정하면 Git Hooks를 적용할 수 있다.

.git/hooks/pre-commit

```css
#!/bin/sh
echo 'Hello world!'
exit 0 # Exit 코드가 0 이 아니면 커밋이 취소됨
```

위 파일을 저장하고 프로젝트에서 커밋을 실행해보면, 터미널에 Hello world!가 출력되는 걸 확인할 수 있다.

## master로 직접 push방지하기

push를 실행하는 경우 동작하는 pre-push를 사용해서 master에 직접 push를 방지할 수 있다.

pre-push훅은 리모트이름과 주소를 파라미터로 전달받으며 stdin을 통해 업데이트할 해시 리스트를 전달받는다. 리모트 주소와 브랜치명을 조사하여 push를 통과시키거나 중단시키면 된다.

.git/hooks/pre-push

```css
#!/bin/sh

FORBIDDEN_HTTPS_URL="https://github.com/[해당repository]" # insert your remote url (https)
FORBIDDEN_SSH_URL="git@github.com:[해당repository]" # insert your remote url (ssh)
FORBIDDEN_REF="refs/heads/master" # insert branch ref

remote="$1"
url="$2"

if [ "$url" != "$FORBIDDEN_HTTPS_URL" -a "$url" != "$FORBIDDEN_SSH_URL" ]
then
    exit 0 # Forked Project 에서는 제한하지 않음
fi

if read local_ref local_sha remote_ref remote_sha
then
    if [ "$remote_ref" == "$FORBIDDEN_REF" ]
    then
        echo "DO NOT PUSH it master"
        exit 1 # 금지된 ref 로 push 를 실행하면 에러
    fi
fi

exit 0
```

훅을 적용한 후 원본 프로젝트의 master로 push를 시도하면 에러 메세지와 함께 push가 실패하는 것을 확인할 수 있다.

## Git Hooks를 공유하는 방법

Git Hooks는 .git 디렉토리에 저장한다. 그런데 .git디렉토리는 버전관리 대상이 아니므로 Repositories에 올라가지 않는다. 기본적인 Git 체계 하에서는 Git Hooks를 공유할 수 없다는 뜻이다.

Git Hooks를 공유하는 효과적인 방법은 다음과 같다.

1. ⚠️ Git Hooks를 설정하는 스크립트 공유
2. ⚠️ Git Template 활용
3. **✅ husky 활용**

### ⚠️ Git Hooks를 설정하는 스크립트 공유

방법1. Git Hooks를 설정하는 스크립트 공유는 Git Hooks를 공유하는 방법 중 가장 단순한 접근이다. Git Hooks를 별도 디렉토리에 넣어 버전을 관리하고, 이 훅을 .git/hooks 로 복사하는 스크립트를 함께 공유하는 방식이다.

```css
./githooks/ - pre-commit - pre-push;
```

그리고 다음 스크립트를 함께 공유한다.

./setup_hooks.sh

```css
#!/bin/sh
cp githooks/* .git/hooks
```

이 스크립트는 단순히 git hooks 디렉토리에 있는 모든 파일을 .git/hooks 디렉토리로 복사할 뿐이다.

하지만 설정 스크립트를 실행하지 않으면 훅을 적용할 수 없다.

### ⚠️ Git Template를 활용

방법2: git Template 활용은 git clone시 —template 옵션을 통해 .git 디렉토리를 초기화할 수 있다는 점을 활용한다.

우선 프로젝트와 독립된 경로에 다음과 같이 Template 디렉토리를 구성하고 Git Hooks를 넣어둔다.

```css
/home/temp/git_templates/
 - hooks/
   - pre-commit
   - pre-push
```

그리고 프로젝트를 clone할 때 —template옵션에 위에서 생성한 template디렉토리를 경로로 지정한다.

```css
git clone --template=/home/temp/git_templates https://github.com/[user]/[project]
```

이제 .git/hooks디렉토리를 확인해보면 Git Hooks가 정상적으로 설정돼있는걸 볼 수 있다.

이 방법은 Git/Hooks를 별도 경로에서 관리하고자 할 때 유용하다. 하지만 Template를 미리 공유해야 하며, —template 옵션을 빠트리는 경우 훅을 적용할 수 없다는 문제가 있다.

## ✅ Husky를 사용하자!

앞에 설명한 두 가지 방법은 유용하지만 치명적인 문제가 있따. 작업자가 실수로든 고의로든 Git Hooks를 적용하지 않을 가능성이 크다.

Git Hooks를 반드시 적용하게끔 강제할 수 없을까? 만약 **프로젝트가 모듈 의존성을 관리하기 위해 npm을 사용하고 있다면 husky는 좋은 선택이 될 수 있다.**

```css
npm install -D husky
```

그리고 명령어를 통해 파일을 생성해주자.

```css
npx husky add .husky/pre-commit "echo 'Hello World!'"
```

이제 commit을 실행해보면, 터미널에 Hello World! 를 출력하는 것을 확인할 수 있다.

이 방법을 통해 사용자는 프로젝트별로 commit, push등 정책을 관리하고 공유할 수 있다.

또한 작업자가 의존 모듈을 설치하는 것만으로 husky가 적용된다. **더 이상 설치 스크립트를 실행하지 않거나 옵션을 빠뜨려서 Git Hooks를 적용하지 못하는 상황은 발생하지 않는다.**

### Husky의 동작 방식

**단지 모듈을 설치하고 정책을 정의했을 뿐인데 git hooks처럼 동작하고 있다.** 왜 그럴까? husky의 구조를 살펴보자.

설치한 husky 모듈의 package.json을 확인해보면 **install스크립트를 정의하고 있음을 알 수 있다.**

./node_modules/husky/package.json

```css
 {
  ...,
	'scripts': {
    ...,"install": 'node husky install';
  }
}
```

install 스크립트는 npm 스크립트 중 하나로서 npm install명령을 통해 해당 모듈을 설치하면 자동으로 실행하는 스크립트이다. husky를 설치하면 install스크립트인 node husky install을 실행한다.

node husky install을 따라가보면 **최종적으로는 자체적으로 구현해놓은 Git Hooks를 .git/hooks디렉토리에 쓴다.**

실제로 husky를 설치한 뒤 .git/hooks디렉토리 안을 살펴보면 hooks가 설정돼 있다. 각 hooks는 husky.sh를 실행하며, husky.sh는 package.json **.huskyrc 등에 정의한 훅을 husky모듈로 실행한다.**

### **husky를 활용하여 master로 직접 push 방지하기**

husky를 사용하여 master로 직접 push하기를 방지해보자.

huskyhooks디렉토리를 생성 후 디렉토리 안에 pre-push 스크립트를 작성한다. 이때 인자를 받는 방식이 기존 pre-push 훅과 다르므로 주의한다.

```css
// huskyhooks/pre-push

FORBIDDEN_HTTPS_URL="https://github.com/[깃허브 디렉토리]" # insert your remote url (https)
FORBIDDEN_SSH_URL="git@github.com:[깃허브 디렉토리]" # insert your remote url (ssh)
FORBIDDEN_REF="refs/heads/master" # insert branch ref

ARR_GIT_PARAMS=($(echo $HUSKY_GIT_PARAMS))
ARR_GIT_STDIN=($(echo $HUSKY_GIT_STDIN))

remote=${ARR_GIT_PARAMS[0]}
url=${ARR_GIT_PARAMS[1]}

local_ref=${ARR_GIT_STDIN[0]}
local_sha=${ARR_GIT_STDIN[1]}
remote_ref=${ARR_GIT_STDIN[2]}
remote_sha=${ARR_GIT_STDIN[3]}

if [ "$url" != "$FORBIDDEN_HTTPS_URL" -a "$url" != "$FORBIDDEN_SSH_URL" ]
then
    exit 0 # Forked Project 에서는 제한하지 않음
fi

if [ "$remote_ref" == "$FORBIDDEN_REF" ]
then
    echo "DO NOT PUSH it master"
    exit 1 # 금지된 ref 로 push 를 실행하면 에러
fi

exit 0
```

훅을 적용한 후 원본 프로젝트의 master로 push를 시도하면 에러가 뜨며 push가 실패하는것을 확인할 수 있다.
