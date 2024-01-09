import React from 'react'
import '~/styles/components/category.scss'

type Props = {
  category: string
  categories: string[]
  handleClickCategory: (category: string) => void
  onClickSearch: (text: string) => void
}

export default function Categories({
  category: c,
  categories,
  handleClickCategory,
  onClickSearch
}: Props) {
  const [searchText, setSearchText] = React.useState<string>('')

  const handleChangeSearchText = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value)
  }
  return (
    <div>
      <div>
        <input
          type='search'
          onChange={handleChangeSearchText}
          placeholder='검색어를 입력하세요'
          onKeyDown={e => {
            if (e.key === 'Enter') {
              onClickSearch(searchText)
            }
          }}
        />
      </div>
      <ul className='categories'>
        {categories.map((category: string) => (
          <li
            key={category}
            className={category === c ? 'active' : ''}
            onClick={() => handleClickCategory(category)}
          >
            {category}
          </li>
        ))}
      </ul>
    </div>
  )
}
