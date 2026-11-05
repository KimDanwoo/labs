---
title: "클라우드 기반 배포 자동화 여정: AWS S3부터 GitHub Actions까지"
description: "S3와 CloudFront, IAM, GitHub Actions로 빌드·배포 자동화를 구축한 과정과 캐시 무효화, 슬랙 알림까지 넓혀간 경험을 정리했어요."
publishedAt: "2024-12-11T13:27:04+09:00"
updatedAt: "2025-08-04T13:36:07+09:00"
category: "dev"
tags: ["ci-cd"]
legacyUrl: "https://dansoon-dev.tistory.com/10"
---

## 1\. 문제

AWS를 활용한 CI/CD 파이프라인 구축 프로젝트를 진행했다.

다양한 클라우드 서비스 중에서 AWS를 선택한 이유는 실제 업무 환경에서 가장 널리 사용되고 있으며,

S3와 CloudFront의 조합이 비용 효율적이면서도 확장성이 뛰어나기 때문이다.

AWS 아키텍처는 S3 버킷을 기반으로 정적 웹사이트 호스팅 설정을 구성하고, CloudFront를 통한 글로벌 CDN 배포망을 구축했다.

IAM을 통해 최소 권한 원칙에 따른 보안 설정을 적용하고, GitHub Actions를 활용하여 완전 자동화된 배포 파이프라인을 구현했다.

특히 GitHub Actions 워크플로우를 통해 코드 변경 시 자동으로 빌드, 테스트, 배포가 이루어지는 시스템을 구축했으며, 시크릿 키와 환경 변수의 안전한 관리 체계를 마련했다.

## 2\. 시도

GitHub Actions의 경우, 간단한 예제부터 시작해서 점진적으로 기능을 추가하는 방식으로 접근했다. 처음에는 단순히 S3에 배포하는 것부터 시작해서, 점차 **CloudFront 캐시 무효화**, **슬랙 알림** 등의 기능을 추가했다. 이 과정에서 YAML 문법과 GitHub Actions의 다양한 기능들을 자연스럽게 익힐 수 있었다.

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

성능 최적화를 위해서는 **CloudFront의 캐시 설정**을 세밀하게 조정했다. 특히 정적 자산과 동적 콘텐츠의 캐시 전략을 다르게 가져가면서, 최적의 성능과 실시간성의 균형을 맞추려 노력했다.

## 3\. 해결

시행착오 끝에 안정적이고 효율적인 CI/CD 파이프라인을 구축할 수 있었다.

특히 인상적이었던 것은 CloudFront 도입 후의 극적인 성능 개선이었다.

**평균 로딩 시간이 81.4% 감소**했고, 특히 이미지와 폰트 같은 정적 리소스의 전송 속도가 크게 향상되었다.

**보안 면**에서도 **OAI(Origin Access Identity)를 활용한 S3 접근 제어**, **GitHub 시크릿**을 통한 민감 정보 관리 등을 통해 안전한 시스템을 구축할 수 있었다. 특히 IAM 권한 설정에서 겪었던 시행착오는 AWS의 보안 모델을 이해하는 데 큰 도움이 되었다.

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

## 4\. 배운 점

이번 과제를 통해 **현대적인 클라우드 인프라 구축의 전체 과정**을 경험할 수 있었다.

특히 인상 깊었던 것은 각 서비스들이 독립적으로 존재하는 것이 아니라, 서로 긴밀하게 연결되어 하나의 시스템을 이루고 있다는 점이었다.

GitHub Actions를 통한 **CI/CD 자동화의 가치**도 실감할 수 있었다.

초기 설정에 시간이 들더라도, 한번 구축해 놓으면 이후의 배포 과정이 매우 편리해진다는 것을 체감했다.

특히 인프라 구성을 코드로 관리하는 **IaC(Infrastructure as Code)의 장점**을 직접 경험할 수 있었다.

## 5\. Keep: 앞으로도 유지할 부분

앞으로도 새로운 기술을 도입할 때는 이번처럼 **충분한 조사와 계획**을 바탕으로 진행하고 싶다.

특히 보안과 성능 최적화는 항상 가장 우선순위에 두고 고려해야 할 것 같다.

또한 이번에 구축한 CI/CD 파이프라인은 다른 프로젝트에서도 재사용할 수 있도록 **템플릿화하여 관리**할 계획이다.

특히 GitHub Actions 워크플로우는 조금 더 모듈화하여 재사용성을 높이고 싶다.

이번 주는 클라우드 인프라와 CI/CD에 대한 실전 경험을 쌓을 수 있는 값진 시간이었다.

특히 AWS 서비스들의 실제 활용 방법과 GitHub Actions를 통한 자동화의 가치를 직접 체감할 수 있었던 것이 가장 큰 수확이었다.
