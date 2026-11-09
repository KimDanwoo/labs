---
title: "SEO의 구조적 진화: SPA·SSR, 구글·네이버 크롤러와 Next.js의 한계"
description: "HTML부터 SPA, SSR까지 SEO의 변천과 구글·네이버 크롤러 차이를 짚고, Next.js만으로 해결되지 않는 부분과 실무 설계를 정리해요."
publishedAt: "2025-09-17T10:49:05+09:00"
updatedAt: "2025-10-27T17:23:04+09:00"
category: "dev"
tags: ["seo"]
legacyUrl: "https://dansoon-dev.tistory.com/20"
thumbnail: "./thumbnail.jpg"
cover: "./cover.jpg"
---

## Next.js만 쓰면 SEO가 해결될까

"Next.js를 쓰면 SEO가 해결된다"는 말을 자주 듣습니다. 하지만 실무에서 경험해보면 이는 절반만 맞는 이야기입니다.

Next.js는 분명히 SEO에 유리한 환경을 제공하지만 검색엔진 최적화의 본질적 문제들을 자동으로 해결해주지는 않습니다. 더 중요한 것은 웹 크롤러가 어떻게 우리 사이트를 읽는지 이해하는 것입니다.

## 1\. HTML 시대, 단순했던 SEO

초기 웹에서 SEO는 단순했습니다. 정적 HTML 문서에 적절한 메타 태그와 제목, 그리고 의미있는 마크업만 있으면 되었습니다.

```html
<!DOCTYPE html>
<html>
<head>
  <title>회사명 - 주요 서비스</title>
  <meta name="description" content="서비스 설명">
  <meta name="keywords" content="키워드1, 키워드2">
</head>
<body>
  <h1>메인 제목</h1>
  <p>내용...</p>
</body>
</html>
```

이 시대의 SEO는 구조 자체가 최적화였습니다. 검색엔진 크롤러는 HTML을 직접 읽고 개발자는 그 구조에 맞춰 콘텐츠를 배치하면 되었습니다.

## 2\. JavaScript와 SPA의 등장, SEO의 암흑기

jQuery를 거쳐 React, Vue 같은 SPA 프레임워크가 등장하면서 SEO는 큰 도전에 직면했습니다.

```tsx
// 전형적인 SPA 구조
function App() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchData().then(setData);
  }, []);

  if (!data) return <div>Loading...</div>;

  return (
    <div>
      <h1>{data.title}</h1>
      <p>{data.description}</p>
    </div>
  );
}
```

이때 크롤러가 보는 것은

```html
<!DOCTYPE html>
<html>
<head>
  <title>Loading...</title>
</head>
<body>
  <div id="root">Loading...</div>
  <script src="bundle.js"></script>
</body>
</html>
```

콘텐츠가 JavaScript 실행 후에야 나타나는 구조가 되면서 검색엔진은 빈 페이지만 보게 되었습니다.

### 웹 크롤러는 어떻게 사이트를 읽을까?

```ts
// 크롤러의 동작 과정 (단순화)
1. HTTP 요청 → 서버에서 HTML 응답받음
2. HTML 파싱 → DOM 구조 파악
3. 메타데이터 추출 → title, description, structured data 등
4. 링크 발견 → 다음 페이지 탐색 대상 수집
5. JavaScript 실행 (일부 크롤러만, 제한적)
```

크롤러는 최초 HTTP 응답에서 받은 HTML을 기준으로 판단합니다.

### 크롤러의 한계

크롤러가 어려워하는 것들

-   복잡한 JavaScript 상호작용 처리
-   비동기 데이터 로딩 대기
-   사용자 이벤트(클릭, 스크롤) 기반 콘텐츠
-   무한 스크롤, Lazy Loading
-   클라이언트에서만 생성되는 동적 콘텐츠

이런 한계 때문에 CSR(Client-Side Rendering) 방식의 SPA는 SEO에 불리할 수밖에 없었습니다.

## 3\. SSR의 부활, 완성된 책을 주는 방식

이 문제를 해결하기 위해 SSR(Server-Side Rendering)이 다시 주목받았습니다. Next.js는 이 흐름의 선두주자였습니다.

### CSR vs SSR, 비유로 이해하기

CSR은 펜과 종이에 비유할 수 있습니다. 크롤러가 서버에 요청하면 빈 종이(빈 HTML)와 펜(JavaScript)을 받습니다. 글을 써서 완성하려면 시간이 걸리고, 크롤러는 보통 기다리지 않습니다.

```html
<!-- 크롤러가 받는 CSR 응답 -->
<!DOCTYPE html>
<html>
<head>
  <title>로딩중...</title>
</head>
<body>
  <div id="root">Loading...</div>
  <script src="/static/js/bundle.js"></script>
</body>
</html>
```

SSR은 완성된 책에 비유할 수 있습니다. 크롤러가 서버에 요청하면 이미 완성된 책(완성된 HTML)을 받습니다. 책을 펴자마자 모든 내용을 읽을 수 있습니다.

```html
<!-- 크롤러가 받는 SSR 응답 -->
<!DOCTYPE html>
<html>
<head>
  <title>실제 상품명 - 쇼핑몰</title>
  <meta name="description" content="실제 상품 설명...">
</head>
<body>
  <h1>실제 상품명</h1>
  <p>실제 상품 설명</p>
  <div>가격: 29,000원</div>
</body>
</html>
```

### Next.js의 해결책

```tsx
// Next.js의 SSR 접근법
export async function getServerSideProps() {
  const data = await fetchData();
  return { props: { data } };
}

export default function Page({ data }) {
  return (
    <div>
      <Head>
        <title>{data.title}</title>
        <meta name="description" content={data.description} />
      </Head>
      <h1>{data.title}</h1>
      <p>{data.description}</p>
    </div>
  );
}
```

Next.js는 동적 웹앱의 UX와 정적 HTML의 SEO 친화성을 동시에 제공하는 구조적 해결책을 제시했습니다.

## 4\. 구글 vs 네이버, 크롤러별 특성 이해하기

각 검색엔진의 크롤러는 서로 다른 특성을 가지고 있어 대응 전략도 달라져야 합니다.

### 4-1. 구글 크롤러 (Googlebot)

```ts
const googlebotCharacteristics = {
  javascript: {
    support: '높음',
    execution: 'Chromium 기반, 최신 ES6+ 지원',
    waitTime: '5초 내외 (제한적)',
    rendering: 'SPA도 어느정도 인덱싱 가능'
  },
  crawling: {
    frequency: '높음',
    depth: '깊음',
    budget: '상대적으로 큼'
  },
  preferences: {
    coreWebVitals: '매우 중요',
    mobileFirst: '모바일 우선 인덱싱',
    structuredData: '적극 활용 (JSON-LD)'
  }
};
```

구글 크롤러의 특징

-   JavaScript 실행 능력이 뛰어남 (하지만 완벽하지 않음)
-   페이지 로딩 속도와 사용자 경험을 중시
-   구조화 데이터(JSON-LD)를 적극적으로 활용
-   Core Web Vitals 성능 지표를 랭킹 요소로 사용

### 4-2. 네이버 크롤러 (Yeti)

```ts
const naverYetiCharacteristics = {
  javascript: {
    support: '제한적',
    execution: '기본적인 수준만',
    waitTime: '매우 짧음',
    rendering: 'SSR 강력 권장'
  },
  crawling: {
    frequency: '보통',
    depth: '상대적으로 얕음',
    budget: '제한적'
  },
  preferences: {
    htmlStructure: '매우 중요',
    koreanContent: '한국어 최적화',
    naverEcosystem: '네이버 서비스와의 연동성'
  }
};
```

네이버 크롤러의 특징

-   JavaScript 실행 능력이 매우 제한적
-   정적 HTML 구조를 더 중시
-   한국어 콘텐츠와 문화적 맥락에 대한 이해도가 높음
-   네이버 자체 서비스(블로그, 카페 등)와의 연동성을 중시

## 5\. Next.js가 해결하는 것과 한계

### 5-1. Next.js가 해결하는 것

```tsx
// Next.js App Router의 현대적 접근
export async function generateMetadata({ params }) {
  const data = await fetchData(params.id);
  return {
    title: data.title,
    description: data.description
  };
}

export default async function Page({ params }) {
  const data = await fetchData(params.id);
  
  return (
    <div>
      <h1>{data.title}</h1>
      <p>{data.description}</p>
    </div>
  );
}
```

-   서버사이드 렌더링: 크롤러가 완성된 HTML을 받을 수 있음
-   자동 코드 스플리팅: 로딩 성능 개선으로 Core Web Vitals 향상
-   Image 컴포넌트: 이미지 최적화로 성능 개선
-   메타데이터 API: 구조화된 메타태그 관리

### 5-2. Next.js가 해결하지 못하는 것

복잡한 SEO 로직은 여전히 개발자 몫입니다.

```ts
// 실제 실무에서 필요한 복잡한 메타데이터 로직
export async function generateMetadata({ params }) {
  const product = await getProduct(params.id);

  // 제목 길이 최적화 (구글: 60자, 네이버: 50자)
  const title = product.name.length > 60
    ? `${product.name.slice(0, 57)}...`
    : product.name;

  // 설명 최적화 (구글: 160자, 네이버: 120자)
  const description = optimizeDescription(product.description);
  
  // 키워드 추출 및 최적화
  const keywords = extractSEOKeywords(product);

  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    keywords,
    openGraph: {
      title,
      description,
      images: [{
        url: optimizeImageForOG(product.image),
        width: 1200,
        height: 630
      }]
    }
  };
}
```

구조화 데이터는 JSON-LD로 페이지 내용을 schema.org 어휘에 맞춰 적어두는 방식이 대표적입니다. 검색엔진이 페이지의 의미를 읽는 데 쓰이며, 직접 정확하게 구현해야 합니다.

```ts
// JSON-LD 스키마는 여전히 수동으로 작성해야 함
const productSchema = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: product.name,
  description: product.description,
  image: product.images,
  brand: {
    '@type': 'Brand',
    name: product.brand
  },
  offers: {
    '@type': 'Offer',
    price: product.price,
    priceCurrency: 'KRW',
    availability: product.stock > 0
      ? 'https://schema.org/InStock'
      : 'https://schema.org/OutOfStock'
  }
};
```

## 6\. 실무 SEO 시스템 설계: 메타데이터와 구조화 데이터 관리

### 6-1. 중앙화된 SEO 관리

```ts
// lib/seo-config.ts
export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME!,
  description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION!,
  url: process.env.NEXT_PUBLIC_BASE_URL!,
  defaultImage: '/og-default.jpg'
};

export function createMetadata({
  title,
  description,
  path = '',
  image = siteConfig.defaultImage,
  targetCrawler = 'both' // 'google', 'naver', 'both'
}: MetadataProps) {
  const url = `${siteConfig.url}${path}`;
  
  const baseMetadata = {
    title: title ? `${title} | ${siteConfig.name}` : siteConfig.name,
    description: description || siteConfig.description,
    alternates: { canonical: url }
  };

  // 크롤러별 최적화
  if (targetCrawler === 'google' || targetCrawler === 'both') {
    Object.assign(baseMetadata, {
      openGraph: {
        title,
        description,
        url,
        images: [{ url: image, width: 1200, height: 630 }]
      }
    });
  }

  return baseMetadata;
}
```

### 6-2. 구조화 데이터 생성기

```ts
// lib/schema-generators.ts
export function createProductSchema(product: Product) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images,
    brand: {
      '@type': 'Brand',
      name: product.brand
    },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'KRW',
      availability: getAvailabilitySchema(product.stock)
    }
  };
}

export function createBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${siteConfig.url}${item.path}`
    }))
  };
}
```

### 6-3. 메타데이터 병합 전략

실제 운영 단계에서는 상위 layout의 메타와 페이지 개별 메타가 섞이면서 관리가 복잡해지는 경우가 많습니다. layout 설계가 운영에 미치는 영향은 [Next.js App Router 레이아웃·라우팅과 SEO](/posts/nextjs-app-router-layout-seo/)에서 따로 다뤘습니다.

이를 단순화하기 위해 저는 페이지 단위 선언을 기본으로 두고, 상위/기본 메타는 보조적으로 합성하는 방식을 권장합니다.

핵심 규칙은 세 가지입니다.

-   title: 페이지 값이 있으면 교체
-   OG 이미지: 페이지 값이 우선, 없으면 기본 이미지 fallback
-   robots: index/follow는 보수적 AND (둘 중 하나라도 false면 false)

robots의 index는 검색 결과 노출 허용, follow는 페이지 안 링크 추적 허용을 뜻합니다.

```typescript
// lib/seo-merge.ts
export function mergeMeta(pageMeta) {
  return {
    title: pageMeta.title ?? defaultMeta.title,
    description: pageMeta.description ?? defaultMeta.description,
    og: { image: pageMeta.og?.image ?? defaultMeta.og.image },
    robots: {
      index: pageMeta.robots?.index ?? defaultMeta.robots.index,
      follow: pageMeta.robots?.follow ?? defaultMeta.robots.follow,
    },
  };
}
```

## 7\. SEO 성과를 좌우하는 요소

SEO는 단순한 마케팅 기법에서 제품 설계의 핵심 요소로 진화했습니다.

웹 크롤러의 특성을 이해하고, 각 검색엔진에 맞는 최적화 전략을 수립하는 것이 중요합니다. Next.js 같은 프레임워크는 SEO 친화적인 기술적 환경을 제공하지만 실제 검색 성과는 다음 요소들의 통합적 설계에 달려 있습니다:

-   크롤러 특성 이해: 구글과 네이버 크롤러는 다르게 작동합니다
-   기술적 기반: SSR을 통한 완성된 HTML 제공
-   정보 구조: 사용자가 찾는 정보를 논리적으로 구성
-   콘텐츠 품질: 검색 의도에 부합하는 깊이있는 내용
-   사용자 경험: Core Web Vitals와 접근성 고려

과거의 SEO가 "검색엔진을 속이는" 기술이었다면, 현재의 SEO는 "크롤러와 사용자 모두에게 가치를 제공하는" 구조적 접근법이 되었습니다.

Next.js는 이런 구조적 SEO의 출발점을 제공할 뿐, 진짜 최적화는 개발자와 기획자의 전략적 사고에서 나온다고 생각합니다.

---

이 기준으로 개인 블로그를 직접 점검한 결과는 [블로그 최적화 점검](/posts/blog-optimization-check/)에 정리했습니다.

## 참고 자료

-   [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
-   [Next.js SEO Documentation](https://nextjs.org/learn/seo/introduction-to-seo)
-   [Core Web Vitals](https://web.dev/vitals/)
-   [네이버 웹마스터 가이드](https://searchadvisor.naver.com/guide)
