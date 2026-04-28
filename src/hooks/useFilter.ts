import { useMemo, useState } from 'react'

export default function useFilter(posts: Common.Post[]) {
  const [category, setCategory] = useState<string>('ALL')
  const [search, setSearch] = useState<string>('')

  const filteredPosts = (posts: Common.Post[]) => {
    const visible = posts.filter(
      p => p.title !== '🧑🏻‍💻 frontend 김단우' && !p.isHidden
    )

    if (category === 'ALL' && search === '') return visible
    if (category === 'ALL') return visible.filter(p => p.title.toLowerCase().includes(search.toLowerCase()))
    if (search === '') return visible.filter(p => p.category === category)
    return visible
      .filter(p => p.category === category)
      .filter(p => p.title.toLowerCase().includes(search.toLowerCase()))
  }

  const categories = useMemo(
    () => [
      'ALL',
      ...Array.from(new Set(posts.filter(p => p.category && !p.isHidden).map(p => p.category)))
    ],
    [posts]
  )

  return {
    category,
    categories: search !== '' ? [] : categories,
    handleClickCategory: (tag: string) => { if (tag) setCategory(tag) },
    filteredPosts: filteredPosts(posts),
    onClickSearch: (text: string) => setSearch(text)
  }
}
