import React from 'react'
import debounce from 'lodash/debounce'

type Props = {
  onClickSearch: (text: string) => void
}

export default function Search({ onClickSearch }: Props) {
  const handleChangeSearchText = debounce((e: React.ChangeEvent<HTMLInputElement>) => {
    onClickSearch(e.target.value)
  }, 800)

  return (
    <div>
      <input
        className="w-full my-3 h-10 px-3 rounded border border-grey-3 outline-none focus:border-green-0 transition-colors text-sm"
        type="search"
        onChange={handleChangeSearchText}
        placeholder="검색어를 입력하세요"
      />
    </div>
  )
}
