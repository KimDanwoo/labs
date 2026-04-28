import React, { useRef } from 'react'

type Props = {
  onClickSearch: (text: string) => void
}

function debounce<T extends (...args: Parameters<T>) => void>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout>
  return ((...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }) as T
}

export default function Search({ onClickSearch }: Props) {
  const handleChange = useRef(
    debounce((e: React.ChangeEvent<HTMLInputElement>) => {
      onClickSearch(e.target.value)
    }, 800)
  ).current

  return (
    <div>
      <input
        className="w-full my-3 h-10 px-3 rounded border border-grey-3 outline-none focus:border-green-0 transition-colors text-sm"
        type="search"
        onChange={handleChange}
        placeholder="검색어를 입력하세요"
      />
    </div>
  )
}
