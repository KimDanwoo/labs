import React from 'react'

type Props = {
  category: string
  categories: string[]
  handleClickCategory: (category: string) => void
}

export default function Categories({ category: c, categories, handleClickCategory }: Props) {
  return (
    <div>
      <ul className="flex flex-wrap list-none p-0 m-0">
        {categories.map((category: string) => (
          <li
            key={category}
            className={`m-1 px-3 py-0.5 rounded-full border cursor-pointer text-xs font-bold shadow-sm transition-colors ${
              category === c
                ? 'text-white bg-green-0 border-green-0'
                : 'bg-transparent border-[#ccc]'
            }`}
            onClick={() => handleClickCategory(category)}
          >
            {category}
          </li>
        ))}
      </ul>
    </div>
  )
}
