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
    }, 500)
  ).current

  return (
    <div className="relative my-5">
      <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
        <svg className="w-4 h-4 text-grey-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        className="w-full h-11 pl-10 pr-4 rounded-xl border border-grey-3 bg-grey-5 outline-none focus:border-green-0 focus:bg-white focus:ring-2 focus:ring-[rgba(0,140,78,0.12)] transition-all text-sm placeholder:text-grey-2"
        type="search"
        onChange={handleChange}
        placeholder="검색어를 입력하세요"
      />
    </div>
  )
}
