---
title: 'Node.js 16 지원종료'
date: 2023-10-16
description: 'Node.js 16 지원종료'
thumbnail: './thumbnail.png'
category: 'node'
isHidden: false
---

신규 프로젝트에서는 node 18을 사용해야 될 때이다.

node.js의 node.js end-of-life날짜를 2023년 9월 11일로 7개월 앞당기기로 결정했다. 이유는 OpenSSL 1.1.1 지원 종료와 맞추기 위해서 이다.

node.js 16은 openSSL 1.1.1 버전과 함께 출시되었다. 그런데 OpenSSL1.1.1의 지원은 Node.js 16의 예정된 (2024.04)일보다 7개월 정도 앞당겨졌다.

1. node.js 는 마지막 7개월동안 OpenSSL1.1.1 의 취약점에 노출될 가능성이 있다.
2. Node.js 지원을 2023년 9 월로 종료하는 이유는 OpenSSL 1.0.2의 End-of-Life와 함께 맞추는 선례가 있다.
3. OpenSSL 3으로 전환하면 Node.js 17,18에서 보고된 문제와 호환성 문제가 발생할 수 있다.
4. CentOs Stream 8 의 OpenSSL 1.1.1 로 교체하면 이 옵쳔 또한 몇몇 응용 프로그램에서 호환성 문제를 일으킬 수 있다.

이를 고려한 결과, 릴리즈 중 OpenSSL전환으로 인한 호환성 문제를 피하고 가장 안정적인 선택은 16버전의 종료날자를 앞당기는 것으로 결정되었다.

이제는 신규 프로젝트에서 node 18을 사용해야 될 때이다.

참고

https://nodejs.org/en/blog/announcements/nodejs16-eol
