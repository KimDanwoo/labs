import React from 'react'
import '../../styles/components/search.scss'
import debounce from 'lodash/debounce'
type Props = {
  onClickSearch: (text: string) => void
}
export default function Search({ onClickSearch }: Props): JSX.Element {
  const handleChangeSearchText = debounce(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onClickSearch(e.target.value)
    },
    800
  )
  return (
    <div>
      <input
        className='search-input'
        type='search'
        onChange={handleChangeSearchText}
        placeholder='검색어를 입력하세요'
      />
    </div>
  )
}
