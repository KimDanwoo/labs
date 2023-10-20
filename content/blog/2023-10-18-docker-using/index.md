---
title: '[Docker] 도커 작성예시'
date: 2023-10-18
description: '[Docker] 도커 작성예시'
thumbnail: './thumbnail.png'
---

## 1. Dockerfile이란?

Dockerfile이란 docker에서 이용하는 이미지를 기반으로 하여 새로운 이미지를 스크립트 파일을 통해 내가 설정한 나만의 이미지를 생성할 수 있는 일종의 이미지 설정 파일이다.

dockerfile을 이용하면 컨테이너 생성 시 기존 이미지로 생성하였을 경우 추가로 설정해줘야 할 것들을 미리 설정 및 사전 준비가 가능하므로 잘 이용할 수 있다면 무궁무진한 형태의 이미지를 좀 더 간편하고 손쉽게 만들어 낼 수 있다.

## 2. Dockerfile 작성

### 2-1. 디렉토리 및 dockerfile 생성

```jsx
[root@techsmile-26919 ~] # mkdir doc_build
[root@techsmile-26919 ~] # cd doc_build
[root@techsmile-26919 doc_build] # touch dockerfile
[root@techsmile-26919 doc_build] #
```

dockerfile의 경우 파일이 있는 디렉토리를 context로 인식하여 작업이 진행되므로 작성 및 빌드까지 새로운 디렉토리를 만들어서 해당 디렉토리 내부에서 작업을 진행하는 것이 좋다.

dockerfile자체에 다른 확장자가 있는 것은 아니므로 원하는 파일 이름으로 생성을 진행하면 된다.

### 2-2. dockerfile 작성

```docker
FROM contos:latest
MAINTAINER newbnewbe

# yum 업데이트 및 apache, php 설치
RUN yum update && yum install -y httpd php

# php 연동
RUN cp -arp /etc/httpd/conp/httpd.conf /etc/httpd/conf/httpd.conf.ori
RUN sed -i 's/#ServerName www.example.com:80/SercerName localhost/g' /etc/httpd/conf/httpd.conf
RUN sed -i 's/DirectoryIndex index.html/DirectoryIndex index.html index.php index.jsp/g' /etc/httpd/conf/httpd.conf
RUN sed -i 's/#AddHandler cgi-script .cgi/AddHandler cgi-script .cgi/g' /etc/httpd/conf/httpd.conf
RUN sed -i 'AddType application\/x-gzip .tgz/a\ #php Enable' /etc/httpd/conf/httpd.conf'
RUN sed -i '/\  #php Enable/a \ AddType application/xhttpd-php-source .phps' /etc/httpd/conf/httpd.conf
RUN sed =i '/\ #PHP Enable/a\ AddType application/x-httpd-php .php .jsp .html' /etc/httpd/conf/httpd.conf

# 공유할 볼륨 지정
VOLUME ['/var/www/html','/etc/httpd']

# 포워딩 할 포트 지정
EXPOSE 80 443

# Context 에서 Index.html과 phpinfo 페이지 가져오기
ADD index.html /var/www/html
ADD phpinfo.php /var/www/html

# Docker run 시 apache 시작
ENTRYPOINT ['/usr/sbin/apachect|','-D','FOREGROUND']
```

- FROM

docker 이미지 생성에 있어서 기초가 되는 이미지를 지정한다. Dockerfile작성에 있어서 가장 기초가 되는 부분이며 이미지를 로컬에 가지고 있을 경우 그냥 사용하지만, 없다면 도커 허브에서 제공하는 이미지를 불러오게 되아 있다. 위 예시에서는 contos의 최신 버전을 이용하고 있다.

- MAINTAINER

해당 이미지의 생성, 유지, 보수, 등의 즉 관리자를 뜻하는 란이다. 실질적으로 아무런 효과가 없다.

- RUN

쉘 명령어를 사용 할 수 있도록 해준다. 위에 예시에서는 다중 run 구문을 이용하여 가독성을 높였으나 &나 |, \ 등을 통해 보여줄 수 있다면, 줄여주는게 좋다. 주로 package설치나 기본 설정에 사용된다.

- VOLUME

이 이미지로 만든 컨테이너와 호스트 간의 연결이 가능한 볼륨을 지정해준다.

위 예시에서는 httpd의 RootDirectory인 /var/www/html 과 설정 폴더가 있는 /etc/httpd를 공유할 수 있도록 하였다. 이는 이미지 생성 후 docker run 명령어 사용 시 -v 옵션과 함께 <호스트 볼륨>:<컨테이너 볼륨> 의 모양으로 설정하게 되며, 설정이 없을 경우 이미지에서 제공하는 파일들이 들어가있게 된다.

- EXPOSE

컨테이너와 호스트 간 연결이 가능한 포트를 지정해주게 된다.

현재 제작하려는 이미지는 httpd와 php를 설치한 웹 서비스 컨테이너이므로, 80번과 443번 포트를 매칭할 수 있도록 지정해주었다.

- ADD와 COPY

이 둘은 이미지로 파일을 불러오는 기능을 한다.

차이점이라면 COPY의 경우 실제 로컬에서만 파일을 불러 올 수 있으며, 파일 자체를 가져오게 된다. ADD의 경우 url을 사용하여 외부에서도 파일을 가져올 수 있으며, tar로 압축 된 파일을 풀어서 가져오게 된다. 다만 인터넷 URL을 통해 가져온 파일의 경우는 tar의 경우에도 원본으로 가져온다.

위 예시에서는 볼륨 지정 없이 이미지만 올렸을 경우 띄울 index,html페이지와, php연동이 잘 되었는지 확인하기 위한 phpinfo페이지를 로컬 즉, dockerfile이 있는 doc_build라는 디렉토리에서 가져오도록 설정하였다.

- ENTRYPOINT와 CMD

docker run 명령어 실행, 멈춰있던 컨테이너가 다시 시작될 경우 등에 쉘 명령어 및 스크립트를 변수에 받아 사용할 수 있다. 이 두 명령어의 경우 용도 및 사용법이 매우 비슷하여 언뜻 구분이 어려울 수 있다. 우선 위 예시를 보자.

ENTRYPOINT [’usr/sbin/apachectl’,’-D’,’FOREGROUND]

/usr/sbin/apachectl 이라는 쉘 스크립트를 -D, FOREGROUND 라고 하는 인자 값들을 받아 실행시키겠다는 의미이다.

ENTRYPOINT apachectl -D FOREGROUND

이렇게 입력을 해줘도 되지만 위와 같이 입력을 해주는 것이 좀 더 정확하게 인식을 한다고 한다. 왜냐하면 이렇게 입력하는 것은 기본을 /bin/sh -c 명령어로 호출하여 실행하기 때문이다.

작성 방식은 RUN,ENTRYPOINT,CMD 가 동일하다.

다면 RUN 명령어는 위에서 언급했듯 기초 셋팅에 필요한 부분에서 이용하는 것이 좋다.

ENTRYPOINT의 경우 dockerfile 내에 단 1개만 작동한다.

CMD의 경우 여러개를 선언하여도 override가 가능하다.

ENTRYPOINT와 CMD가 같이 쓰이기도 하는데,

```docker
ENTRYPOINT['/bin/echo','Hello']
CMD['world']
```

라고 작성할 경우 결과물로 컨테이너 실행시 Hello World를 볼 수 있다.

### 2-3. dockerfile build

```bash
[root@techsmile-26919 doc_build] # docker build -t apa-php:test
Sending build context to Docker deamon 5.12KB
Step 1/17 : FROM centos:latest
 ---> 49f79603b7e4
Step 2/17 : MAINTAINER newbnewbe
 ---> Running in df6f1e2758a3
Removing intermediate container df6f1e2758a3
 ---> 2c5c61a542c9
Step 3/17 : RUN yum update && yum install -y httpd php
 ---> Running in c8b491175337
Loaded plugins : fastestmirror, ovl
Determining fastest mirror
 * base : mirror.kakao.com
 * extras : mirror.kakao.com
 * updates: mirror.kakao.com
No packages marked for update
```

- docker build -t 이미지명 : 라벨명

위 명령어로 이미지 파일을 만들 수 있다.

```jsx
[root@techsmile-26919 doc_build]# docker images
```

- docker run 실행 및 확인

docker run -it -d -name 컨테이너 명 -p 80:80 -p 443:443 이미지명:라벨명

위 명령어로 docker 실행및 확인 할 수 있다.
