import React from 'react'
import '~/styles/components/category.scss'

type Props = {
  category: string
  categories: string[]
  handleClickCategory: (category: string) => void
}

export default function Categories({
  category: c,
  categories,
  handleClickCategory
}: Props) {
  return (
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
  )
}
