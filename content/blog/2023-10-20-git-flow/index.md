---
title: '[Git] Git-flow 이해하기'
date: 2023-10-20
description: '[Git] Git-flow 이해하기'
thumbnail: './thumbnail.png'
category: 'git'
isHidden: false
---

## 1. Git-flow

Git-flow는 Git이 새롭게 활성화되기 시작하는 10년전 쯤에 Vincent Driessen이라는 사람의 블로그 글에 의해 널리 퍼지기 시작했고 현재는 **Git으로 개발할 때 거의 표준과 같이 사용되는 방법론**이다.

Git-flow는 기능이 아니고 **서로간의 약속인 방법론**이다.

Git-flow는 총 5가지의 브랜치를 사용해서 운영을 한다.

- **master** : 기준이 되는 브랜치로 제품을 배포하는 브랜치이다.
- **develop** : 개발 브랜치로 개발자들이 이 브랜치를 기준으로 각자 작업한 기능들을 합친다. (Merge)
- **feature** : 단위 기능을 개발하는 브랜치로 기능 개발이 완료되면 develop 브랜치에 합친다.
- **release** : 배포를 위해 master 브랜치로 보내기 전에 QA(품질검사)를 하기위한 브랜치이다.
- **hotfit** : master 브랜치로 배포를 했는데 버그가 생겼을 때 긴급 수정하는 브랜치이다.

> **master**와 **develop**이 중요한 매인 branch이고 나머지는 필요에 의해서 운영하는 branch라고 보면된다.

![gitflow.png](./gitflow.png)

1. 일단 master branch에서 시작을 한다.
2. 동일한 브랜치를 develop에도 생성을 한다. 개발자들은 이 develop branch에서 개발을 진행한다.
3. 개발을 하다가 기능 구현이 필요한 경우 A개발자는 develop branch에서 feature branch를 하나 생성해서 기능을 구현하고 B개발자도 develop branch에서 feature branch를 하나 생성해서 기능을 구현한다.
4. 완료된 feacher branch에서 검토를 다시 거쳐 다시 develop branch에 합친다.
5. 모든 기능이 완료되면 develop branch를 release branch로 만든다. 그리고 QA를 하면서 보완점을 보완하고 버그를 fix한다.
6. 모든것이 완료되면 이제 release branch를 master branch와 develop branch로 보낸다. master branch에서 버전추가를 위해 태그를 하나 생성하고 배포를 한다.
7. 배포를 했는데 미처 발견하지 못한 버그가 있을 경우 hotfixes branch를 만들어 긴급 수정 후 태그를 생성하고 바로 수정후 배포한다.
