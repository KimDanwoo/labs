---
title: "FSD 패턴으로 상태 관리 리팩토링하기: react-query와 zustand"
description: "상태와 API, UI가 얽힌 코드를 FSD 구조로 나누고 react-query와 zustand로 상태 관리를 개선한 리팩토링 과정을 돌아봐요."
publishedAt: "2024-12-11T13:25:30+09:00"
updatedAt: "2026-11-11T12:48:16+09:00"
category: "dev"
tags: ["fsd","state-management"]
legacyUrl: "https://dansoon-dev.tistory.com/7"
thumbnail: "./thumbnail.jpg"
cover: "./cover.webp"
---

## 기존 코드의 문제: 상태·API·UI가 한 파일에 얽힘

이번 주 과제는 기존의 상태 관리와 컴포넌트 구조를 FSD(Feature-Sliced Design) 패턴으로 리팩토링하고, react-query와 zustand를 활용해 상태 관리 방식을 개선하는 것이었다. FSD 자체는 [FSD 가이드](/posts/fsd-guide/)에 정리해 두었다. 이를 진행하면서 겪은 문제는 다음과 같다.

1.  코드 구조의 복잡성
    -   상태 관리와 API 호출, UI 로직이 한 파일에 얽혀 있어 코드가 길어지고, 컴포넌트별로 코드를 이해하기 어려운 점이 많았다.
    -   프로젝트가 커질수록 파일 간 의존성이 높아지고 변경 사항을 적용할 때 발생할 수 있는 오류 가능성 또한 높아졌다.
2.  유지보수성 저하
    -   상태 관리와 관련된 로직이 분산되어 있어 특정 기능이나 컴포넌트를 수정할 때 관련된 코드를 모두 찾아 수정해야 하는 번거로움이 있었다.
    -   여러 곳에서 필요한 상태를 공유할 때 상태 관리가 어려웠고, 상태 변경을 추적하기가 쉽지 않았다.

---

## 시도: FSD 구조 적용과 react-query·zustand 도입

### FSD 패턴 적용하여 폴더 구조 개선

-   프로젝트의 폴더 구조를 app, entities, features, shared, widgets 등으로 분리하고, 각 폴더 내에 필요한 파일들을 모듈화하였다.
-   특히 entities 폴더에는 게시물, 댓글, 사용자 등 도메인 모델별로 API, 모델, UI 컴포넌트를 관리하여 코드의 일관성을 높였다.
-   features 폴더에서는 각 도메인 모델의 세부 기능을 위한 상태와 UI 컴포넌트를 별도로 관리하여 코드가 독립적으로 관리될 수 있도록 구성하였다.

### 예시: 폴더 구조

```text
src/
├── entities/
│   ├── post/
│   │   ├── api/
│   │   │   ├── postApi.ts      # 게시물 API 호출 관련 함수
│   │   │   ├── queries.ts      # react-query로 데이터 fetching 설정
│   │   │   ├── mutations.ts    # react-query로 데이터 mutation 설정
│   │   │   └── index.ts
│   │   ├── model/
│   │   │   └── post.types.ts   # 게시물 관련 타입 정의
│   │   └── ui/
│   │       ├── PostReactions.tsx
│   │       ├── PostTableHeader.tsx
│   │       └── index.ts
└── features/
    ├── post/
    │   ├── model/
    │   │   ├── hooks/
    │   │   │   └── usePosts.ts         # react-query로 게시물 데이터 관리
    │   │   └── stores/
    │   │       └── postStore.ts        # zustand로 클라이언트 상태 관리
    │   └── ui/
    │       ├── PostCardHeader.tsx
    │       ├── add-post-dialog/
    │       │   ├── AddPostDialog.tsx   # 게시물 추가 모달
    │       │   └── AddPostForm.tsx
    │       └── update-post-dialog/
```

이렇게 파일과 폴더 구조를 구분하여 각 기능이 독립적으로 관리될 수 있도록 하였다.

### 코드 예시: usePosts와 postStore

### usePosts.ts

```ts
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { fetchPosts, addPost } from '@/entities/post/api/postApi';

// 게시물 목록 가져오기
export const usePosts = (params) => {
  return useQuery(['posts', params], () => fetchPosts(params));
};

// 게시물 추가하기
export const useAddPost = () => {
  const queryClient = useQueryClient();
  return useMutation(addPost, {
    onSuccess: () => {
      queryClient.invalidateQueries('posts');
    },
  });
};
```

### postStore.ts

```tsx
import create from 'zustand';

interface PostState {
  searchQuery: string;
  selectedTag: string;
  setSearchQuery: (query: string) => void;
  setSelectedTag: (tag: string) => void;
}

export const usePostStore = create<PostState>((set) => ({
  searchQuery: '',
  selectedTag: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedTag: (tag) => set({ selectedTag: tag }),
}));
```

이처럼 usePosts에서는 react-query를 활용해 서버 상태를 관리하고, postStore에서는 zustand로 클라이언트 상태를 관리하였다.

### react-query와 zustand로 서버 상태·클라이언트 상태 나누기

-   서버 상태는 react-query를 사용하여 fetching, caching, 동기화 로직을 단순화하였다.
-   클라이언트 상태는 zustand를 사용하여 zustand store에서 모달 상태, 검색 필터, 페이지네이션 등 UI 중심의 상태를 관리하였다.
-   예를 들어, post와 관련된 서버 상태는 usePosts.ts에서 react-query로, selectedTag나 searchQuery 같은 클라이언트 상태는 postStore.ts에서 zustand로 관리하도록 하였다.

### 커스텀 훅과 공통 컴포넌트 활용

-   여러 컴포넌트에서 재사용할 수 있도록 공통 UI 컴포넌트를 shared/ui 폴더에 배치하고, UI 로직이 복잡한 부분은 커스텀 훅으로 추출하였다.
-   게시물 목록이나 검색 기능처럼 여러 컴포넌트에서 사용되는 로직은 커스텀 훅으로 분리하여 코드의 간결성을 높였다.

---

## 조회 로직과 검색 상태의 수정 위치가 나뉘었다

게시물 조회와 추가 후 캐시 무효화는 `usePosts`와 `useAddPost`에, 검색어와 선택 태그는 `postStore`에 두었다. 컴포넌트에 섞여 있던 서버 데이터 처리와 화면 입력 상태를 각각 따라갈 수 있게 됐다.

이번에 정리한 기준은 상태가 어디에서 오고 누가 바꾸는지였다. 서버에서 받은 게시물 목록과 사용자가 입력하는 검색어는 같은 화면에서 쓰이지만 갱신되는 이유가 다르다. 이 둘을 나누니 조회 코드를 바꿀 곳과 검색 조건을 바꿀 곳이 구분됐다.

이 구조에 테스트를 붙이면서 보완한 내용은 [MSW로 테스트 코드를 작성하며 FSD 구조 보완하기](/posts/test-code-fsd-refactoring/)에 이어서 정리했다.
