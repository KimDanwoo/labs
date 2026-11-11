---
title: "클라우드 기반 배포 자동화 여정: AWS S3부터 GitHub Actions까지"
description: "S3와 CloudFront, IAM, GitHub Actions로 빌드·배포 자동화를 구축한 과정과 캐시 무효화, 슬랙 알림까지 넓혀간 경험을 정리했어요."
publishedAt: "2024-12-11T13:27:04+09:00"
updatedAt: "2026-11-11T12:48:16+09:00"
category: "dev"
tags: ["ci-cd"]
legacyUrl: "https://dansoon-dev.tistory.com/10"
thumbnail: "./thumbnail.jpg"
cover: "./cover.webp"
---

## 1\. 문제: AWS로 CI/CD 파이프라인 구축하기

AWS를 활용한 CI/CD 파이프라인 구축 프로젝트를 진행했다.

다양한 클라우드 서비스 중에서 AWS를 선택한 이유는 실제 업무 환경에서 가장 널리 사용되고 있으며, S3와 CloudFront의 조합이 비용 효율적이면서도 확장성이 뛰어나기 때문이다. CloudFront는 AWS의 CDN(콘텐츠 전송 네트워크)으로, 전 세계 엣지 서버에 파일을 캐시해 사용자와 가까운 곳에서 내려준다.

AWS 아키텍처는 정적 파일을 담는 S3 버킷을 만들고 CloudFront를 통한 글로벌 CDN 배포망을 구축했다.

IAM(AWS의 권한 관리 서비스)을 통해 최소 권한 원칙에 따른 보안 설정을 적용하고 GitHub Actions를 활용하여 완전 자동화된 배포 파이프라인을 구현했다.

GitHub Actions 워크플로우를 통해 코드 변경 시 자동으로 빌드와 배포가 이루어지는 시스템을 구축했으며 시크릿 키와 환경 변수의 안전한 관리 체계를 마련했다.

## 2\. 시도: GitHub Actions로 S3 배포와 CloudFront 캐시 무효화 자동화

GitHub Actions의 경우, 간단한 예제부터 시작해서 점진적으로 기능을 추가하는 방식으로 접근했다. 처음에는 단순히 S3에 배포하는 것부터 시작해서 점차 CloudFront 캐시 무효화, 슬랙 알림 등의 기능을 추가했다. 캐시 무효화는 엣지에 남아 있는 이전 파일 대신 새로 배포한 파일을 내려주도록 캐시를 비우는 작업이다. 이 과정에서 YAML 문법과 GitHub Actions의 다양한 기능들을 자연스럽게 익힐 수 있었다.

```yaml
name: 배포 워크플로우
on:
  push:
    branches:
      - main
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: 코드 체크아웃
        uses: actions/checkout@v2
      
      - name: Node.js 설정
        uses: actions/setup-node@v2
        with:
          node-version: '16'
          cache: 'npm'
          
      - name: 의존성 설치
        run: npm ci
        
      - name: 빌드
        run: npm run build
        
      - name: AWS 자격 증명 설정
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-northeast-2
          
      - name: S3 배포
        run: aws s3 sync ./build s3://my-app-bucket --delete
        
      - name: CloudFront 캐시 무효화
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*"
```

이 워크플로우는 main 브랜치에 push될 때 실행된다. 코드를 체크아웃하고 의존성을 설치해 빌드한 뒤, 빌드 결과물을 S3 버킷에 동기화하고(--delete로 버킷에만 남은 파일은 삭제) CloudFront 캐시를 무효화한다. AWS 키와 배포 ID는 GitHub 시크릿에서 읽어온다.

### 워크플로우 단계별로 읽기

`on.push.branches`가 main으로 지정돼 있어 다른 브랜치의 push는 배포를 일으키지 않는다. 러너는 `ubuntu-latest`이고 모든 단계가 deploy라는 하나의 job 안에서 순서대로 실행된다.

`setup-node`의 `cache: 'npm'` 옵션은 npm이 내려받은 패키지를 저장해 두었다가 다음 실행에서 재사용하게 한다. 캐시 키에는 lock 파일이 쓰이므로 의존성이 바뀌지 않으면 설치 시간이 줄어든다. 설치 단계에서 `npm install` 대신 `npm ci`를 쓰면 lock 파일에 적힌 버전 그대로 설치하고 package.json과 lock 파일이 어긋나 있으면 실패한다. 로컬과 CI에서 같은 의존성 트리가 만들어진다.

`aws s3 sync`는 로컬 디렉터리와 버킷을 비교해 크기나 수정 시각이 다른 파일만 올린다. 빌드할 때마다 전체를 다시 올리지 않아도 되고 `--delete`가 붙어 있어 빌드 결과에 없는 파일이 버킷에 남지 않는다. 마지막 단계의 `--paths "/*"`는 배포 전체를 한 번에 무효화하는 지정이다.

이 워크플로우가 쓰는 자격 증명에는 해당 버킷의 목록 조회·업로드·삭제 권한과 해당 배포의 무효화 생성 권한이 필요하다. 명령어에서 필요한 권한이 그대로 읽히므로, 최소 권한 원칙을 적용할 때는 이 범위를 넘는 권한을 주지 않도록 정책을 좁힌다.

성능 최적화를 위해서는 CloudFront의 캐시 설정을 세밀하게 조정했다. 정적 자산과 동적 콘텐츠의 캐시 전략을 다르게 가져가면서 최적의 성능과 실시간성의 균형을 맞추려 노력했다.

## 3\. 해결: 배포 성능 개선과 보안 구성

빌드 결과를 S3에 올리고 CloudFront로 전달하는 배포 경로를 구성했다. 배포 후에는 이미지와 폰트 같은 정적 리소스의 로딩이 빨라진 것을 확인했다.

S3 버킷은 비공개로 두고 OAI(Origin Access Identity)로 CloudFront의 접근을 허용했다. 자격 증명은 GitHub 시크릿에 두고 워크플로우에서 읽도록 했다. OAI는 S3의 REST 엔드포인트를 오리진으로 쓸 때 적용되고, S3 정적 웹사이트 엔드포인트를 오리진으로 쓰면 OAI(그리고 후속인 OAC)를 쓸 수 없다. 버킷을 비공개로 두려면 REST 엔드포인트와 버킷 정책을 함께 구성해야 한다.

### AWS 보안 아키텍처 구성

```text
┌────────────────┐    ┌────────────────┐    ┌────────────────┐
│                │    │                │    │                │
│  S3 Bucket     │───▶│  CloudFront    │───▶│  End Users     │
│  (Origin)      │    │  (CDN)         │    │                │
│                │    │                │    │                │
└────────────────┘    └────────────────┘    └────────────────┘
       ▲                      │
       │                      │
       │                      ▼
┌────────────────┐    ┌────────────────┐
│                │    │                │
│  GitHub        │    │  IAM/OAI       │
│  Actions       │    │  (보안)        │
│                │    │                │
└────────────────┘    └────────────────┘
```

## 다른 방법과 한계

위 구성에는 바꿔 볼 수 있는 지점이 몇 가지 있다.

캐시 무효화 범위는 그중 하나다. `"/*"`는 가장 단순하지만 매 배포마다 모든 객체의 캐시를 비운다. 빌드 도구가 파일 이름에 해시를 붙여 주는 프로젝트라면, 해시가 붙은 정적 자산에는 긴 `Cache-Control`을 주고 HTML 파일만 짧게 두거나 `no-cache`로 두는 방식이 있다. 새 배포에서 바뀌는 것이 진입 HTML뿐이라 무효화 범위를 좁힐 수 있다. 무효화 요청은 경로 수에 따라 요금이 붙는 구간이 있으므로 요금 정책은 AWS 문서에서 확인해야 한다.

자격 증명 방식도 선택지가 있다. 예제는 액세스 키를 GitHub 시크릿에 넣어 두는 방식이다. 키는 만료되지 않는 장기 자격 증명이라 유출되면 직접 폐기해야 한다. `configure-aws-credentials` 액션은 GitHub의 OIDC로 IAM 역할을 임시로 맡는 방식(`role-to-assume`)도 지원한다. 저장소에 장기 키를 두지 않아도 되지만 AWS 쪽에 OIDC 공급자와 신뢰 정책을 따로 설정해야 한다.

S3 접근 제어에 쓰인 OAI는 CloudFront가 비공개 버킷에 접근하게 하는 기존 방식이다. AWS 문서는 현재 후속 방식인 OAC(Origin Access Control)를 권장하므로 새로 구성한다면 OAC를 먼저 검토하는 편이 좋다.

예제의 Node 16과 `actions/checkout@v2` 같은 버전은 글을 쓴 시점의 것이다. Node 16은 이미 지원이 종료됐으니 지금 적용한다면 지원 중인 LTS와 더 새로운 메이저 버전의 액션으로 바꿔야 한다.

워크플로우가 main에 push되면 곧바로 배포한다는 점도 한계다. 빌드 뒤에 테스트 단계를 넣거나 배포 job을 분리해 승인 절차를 두는 방법이 있다. CloudFront 없이 S3 정적 웹사이트 호스팅만으로 공개하는 구성은 설정이 단순하지만 웹사이트 엔드포인트가 HTTP만 지원한다는 제약이 있다.

## 4. 다음 배포에서도 확인할 것

GitHub Actions에서 빌드한 파일을 S3에 올리고 CloudFront 캐시를 무효화하는 순서를 워크플로우에 남겼다. 이후 배포에서는 이 순서를 수동으로 반복하지 않아도 됐다.

남은 개선은 캐시 무효화 범위를 좁히고, 배포 전에 테스트를 실행하는 것이다. 워크플로우를 다른 프로젝트에 옮길 때도 버킷과 배포 ID, 권한 범위는 각 환경에 맞춰 다시 확인해야 한다.
