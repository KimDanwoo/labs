---
title: 'HTTPS 환경에서 413 Error'
date: 2023-08-10
description: '내가 만난 413 error'
thumbnail: ./thumbnail.png
category: 'frontend'
isHidden: false
---

# 발생원인

## HTTPS 환경에서 413 request entity too large Error

413에러는 서버에서 클라이언트로 받은

요청의 **본문 크기가 서버가 처리할 수 있는 한계를 초과** 했을때 발생한다.

이 오류는 주로 웹서버에서 발생한다.

https프로토콜에서는 https의 데이터 암호화를 위해 사용되는

SSL/TLS 프로토콜에서 추가되는 오버해드 때문에 발생한다.

SSL/TLS 프로토콜은

**데이터 암호화를 위해 패킷의 크기를 늘리고 패킷의 끝에 추가 데이터를 붙이는 작업을 수행**하는데

이로인해 HTTPS에서는 요청의 크기가 허용 범위를 추가할 수 있다.

http는 이 작업이 없기 때문에 본문 크기를 더 크게 허용할 수 있다.

# 해결

### nginx 문제

nginx를 사용하는 환경에서 발생하는 원인은

nginx 기본 body size가 1M이기 때문에 더 큰 용량을 허용해줘야 한다.

```jsx
server {
  listen 443 ssl http2;
  listen [::]:443 ssl http2;

  client_max_body_size 10M; // 사이즈가 없으면 무한

  ...
```
