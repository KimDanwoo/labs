---
title: 'FSD 패턴과 상태 관리 리팩토링'
date: 2024-11-02
description: 'FSD 패턴과 상태 관리 리팩토링'
thumbnail: './thumbnail.png'
category: 'WIL'
isHidden: false
---

## **1. 문제**

이번 주 과제는 기존의 상태 관리와 컴포넌트 구조를 **FSD(Folder Structure Design) 패턴으로 리팩토링**하고, **react-query와 zustand를 활용해 상태 관리 방식을 개선**하는 것이었다. 이를 진행하면서 다음과 같은 문제들이 있었다:

1. **코드 구조의 복잡성**
   - 상태 관리와 API 호출, UI 로직이 한 파일에 얽혀 있어 코드가 길어지고, 컴포넌트별로 코드를 이해하기 어려운 점이 많았다.
   - 프로젝트가 커질수록 파일 간 의존성이 높아지고, 변경 사항을 적용할 때 발생할 수 있는 오류 가능성 또한 높아졌다.
2. **유지보수성 저하**
   - 상태 관리와 관련된 로직이 분산되어 있어 특정 기능이나 컴포넌트를 수정할 때 관련된 코드를 모두 찾아 수정해야 하는 번거로움이 있었다.
   - 여러 곳에서 필요한 상태를 공유할 때 상태 관리가 어려웠고, 상태 변경을 추적하기가 쉽지 않았다.

</br>

---

</br>

## **2. 시도**

### 1. **FSD 패턴 적용하여 폴더 구조 개선**

- 프로젝트의 폴더 구조를 `app`, `entities`, `features`, `shared`, `widgets` 등으로 분리하고, 각 폴더 내에 필요한 파일들을 모듈화하였다.
- 특히 `entities` 폴더에는 게시물, 댓글, 사용자 등 **도메인 모델별로 API, 모델, UI 컴포넌트를 관리**하여 코드의 일관성을 높였다.
- `features` 폴더에서는 **각 도메인 모델의 세부 기능을 위한 상태와 UI 컴포넌트를 별도로 관리**하여 코드가 독립적으로 관리될 수 있도록 구성하였다.

```bash
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

이렇게 파일과 폴더 구조를 명확히 구분하여 각 기능이 독립적으로 관리될 수 있도록 하였다.

### `usePosts.ts`

```tsx
import { useQuery, useMutation, useQueryClient } from 'react-query'
import {
  fetchPosts,
  addPost,
  updatePost,
  deletePost
} from '@/entities/post/api/postApi'

// 게시물 목록 가져오기
export const usePosts = params => {
  return useQuery(['posts', params], () => fetchPosts(params))
}

// 게시물 추가하기
export const useAddPost = () => {
  const queryClient = useQueryClient()
  return useMutation(addPost, {
    onSuccess: () => {
      queryClient.invalidateQueries('posts')
    }
  })
}
```

### `postStore.ts`

```tsx
import create from 'zustand'

interface PostState {
  searchQuery: string
  selectedTag: string
  setSearchQuery: (query: string) => void
  setSelectedTag: (tag: string) => void
}

export const usePostStore = create<PostState>(set => ({
  searchQuery: '',
  selectedTag: '',
  setSearchQuery: query => set({ searchQuery: query }),
  setSelectedTag: tag => set({ selectedTag: tag })
}))
```

이처럼 `usePosts`에서는 `react-query`를 활용해 서버 상태를 관리하고, `postStore`에서는 `zustand`로 클라이언트 상태를 관리하였다.

### 2. **react-query와 zustand를 활용한 상태 관리**

- 서버 상태는 **react-query**를 사용하여 **fetching, caching, 동기화 로직을 단순화**하였다.
- 클라이언트 상태는 **zustand**를 사용하여 `zustand store`에서 모달 상태, 검색 필터, 페이지네이션 등 **UI 중심의 상태를 관리**하였다.
- 예를 들어, `post`와 관련된 서버 상태는 `usePosts.ts`에서 `react-query`로, `selectedTag`나 `searchQuery` 같은 클라이언트 상태는 `postStore.ts`에서 `zustand`로 관리하도록 하였다.

### 3. **커스텀 훅과 공통 컴포넌트 활용**

- 여러 컴포넌트에서 재사용할 수 있도록 **공통 UI 컴포넌트**를 `shared/ui` 폴더에 배치하고, UI 로직이 복잡한 부분은 **커스텀 훅으로 추출**하였다.
- 게시물 목록이나 검색 기능처럼 **여러 컴포넌트에서 사용되는 로직은 커스텀 훅으로 분리**하여 코드의 간결성을 높였다.

</br>

---

</br>

## **3. 해결**

1. **코드의 가독성과 유지보수성 개선**
   - FSD 패턴을 도입하면서 **각 기능이 분리**되어 코드가 한눈에 들어왔고, 필요한 기능을 빠르게 찾을 수 있었다.
   - 또한, `zustand`와 `react-query`로 **상태 관리를 분리**하면서 컴포넌트별로 불필요한 상태 의존성이 줄어들었고, 더 작은 단위로 상태를 관리할 수 있게 되었다.
2. **재사용성과 확장성 확보**
   - 커스텀 훅과 공통 컴포넌트를 활용한 덕분에 **동일한 기능을 여러 컴포넌트에서 재사용**할 수 있었다.
   - 상태 관리 로직이 모듈화되면서 기능 확장이나 변경이 필요할 때 **관련 파일만 수정**하면 되어 확장성이 높아졌다.
3. **클린 아키텍처 구현**
   - FSD 패턴과 상태 관리 개선을 통해 **각 기능이 독립적이고 의존성이 최소화된 클린 아키텍처**를 구현할 수 있었다.
   - 덕분에 코드 변경 시 발생할 수 있는 부수 효과가 줄어들었고, 코드의 안정성도 높아졌다.

</br>

---

</br>

## **4. 배운 점**

1. **폴더 구조의 중요성과 코드 컨벤션**
   - FSD 패턴을 적용하면서 코드의 **가독성**과 **관리 편의성**이 크게 향상됨을 느꼈다. 특히 프로젝트 초기에 팀 내에서 코드 컨벤션을 명확히 정리하고 FSD 패턴을 도입하면 팀원 간의 코드 일관성이 유지될 뿐 아니라, 프로젝트의 확장성도 자연스럽게 확보된다는 것을 깨달았다.
2. **상태 관리의 일관성 유지**
   - `zustand`와 `react-query`를 함께 사용하며 서버 상태와 클라이언트 상태를 분리하여 일관된 상태 관리를 유지할 수 있는 방법을 배웠다.
   - 특히 `react-query`는 서버 데이터 캐싱과 동기화에 유용하고, `zustand`는 UI 상태 관리에 적합하다는 점을 직접 경험하였다.
3. **컴포넌트와 상태의 모듈화 필요성**
   - 기능별로 로직을 나누고 필요한 상태만 참조하도록 하니 코드가 훨씬 간결하고 명확해졌다. 상태와 로직을 캡슐화한 커스텀 훅을 활용하면서 **UI 컴포넌트가 데이터 처리에서 자유로워지고, UI에만 집중할 수 있게** 되었다.

</br>

---

</br>

## **5. Keep: 앞으로도 유지할 부분**

- **FSD 패턴과 상태 관리 구조**: 기능이 복잡하고 관리할 상태가 많을 경우, FSD 패턴과 상태 관리 분리 방식에 대한 이해도를 좀 더 높여서 컨벤션을 작성할때 어떻게 분리할지를 명확하게 구분하도록 좀 더 학습이 필요할 것 같다.
- **모듈화된 상태와 로직 분리**: 각 기능에 맞는 상태와 로직을 모듈화하고, 컴포넌트는 UI만 담당하는 구조를 유지하면서 코드를 더욱 깔끔하게 관리할 것이다.
- **커스텀 훅과 공통 컴포넌트 사용**: 재사용할 수 있는 로직은 커스텀 훅으로, 공통 UI 요소는 공통 컴포넌트로 만들어 프로젝트 전체의 유지보수성을 높이고자 한다.

</br>

---

</br>

이번 리팩토링 과제를 통해 **코드의 모듈화와 상태 관리의 중요성**을 다시금 깨달았다. 앞으로 더 복잡한 프로젝트에서도 이 경험을 바탕으로 유지보수성과 확장성을 높일 수 있는 구조를 설계할수 있다는 자신감을 얻었다.
