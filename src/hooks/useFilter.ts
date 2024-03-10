import uniq from 'lodash/uniq'
import { useMemo, useState } from 'react'

export default function useFilter(posts: Common.Post[]) {
  const [category, setCategory] = useState<string>('ALL')
  const [search, setSearch] = useState<string>('')

  const filteredPosts = (posts: Common.Post[]) => {
    const filteredPosts = posts.filter(
      p => p.title !== '🧑🏻‍💻 frontend 김단우' && !p.isHidden
    )
    if (category === 'ALL' && search === '') {
      return filteredPosts
    }

    if (category === 'ALL' && search !== '') {
      return filteredPosts.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (category !== 'ALL' && search === '') {
      return filteredPosts.filter(p => p.category === category)
    }

    return filteredPosts
      .filter(p => p.category === category)
      .filter(p => p.title.toLowerCase().includes(search.toLowerCase()))
  }

  const categories = useMemo(
    () => ['ALL', ...uniq(posts.filter(p => p.category).map(p => p.category))],
    [posts]
  )

  const handleClickCategory = (tag: string) => {
    if (tag) {
      setCategory(tag)
    }
  }

  const onClickSearch = (text: string) => {
    setSearch(text)
  }

  return {
    category,
    categories: search !== '' ? [] : categories,
    handleClickCategory,
    filteredPosts: filteredPosts(posts),
    onClickSearch
  }
}
