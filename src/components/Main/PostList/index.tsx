import React from 'react'
import type PostListProps from './PostList.types'

const PostList = ({ posts }: PostListProps) => {
  return (
    <ul className="w-full flex flex-col m-0 p-0 list-none">
      {posts.length ? (
        posts.map(post => (
          <li key={post.url} className="border-b border-grey-3 last:border-b-0">
            <a href={post.url} itemProp="url" className="block py-8 sm:py-10 group">
              <article
                className="w-full flex flex-col gap-2"
                itemScope
                itemType="http://schema.org/Article"
              >
                {post.thumbnail && (
                  <div className="relative w-full overflow-hidden mb-2 rounded-2xl border border-grey-3 bg-grey-5">
                    <div className="pt-[52%]" />
                    <div className="absolute inset-0">
                      <img
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        src={post.thumbnail.src}
                        alt=""
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-xs">
                  {post.category && (
                    <span className="text-green-0 font-semibold">{post.category}</span>
                  )}
                  {post.category && <span className="text-grey-3">·</span>}
                  <time className="text-grey-1">{post.publishedAt}</time>
                </div>

                <h2
                  className="m-0 text-xl sm:text-2xl font-bold leading-snug tracking-tight group-hover:text-green-0 transition-colors"
                  itemProp="headline"
                >
                  {post.title}
                </h2>

                <p className="m-0 text-grey-0 text-sm sm:text-base leading-relaxed line-clamp-2">
                  {post.description}
                </p>
              </article>
            </a>
          </li>
        ))
      ) : (
        <p className="py-16 text-sm text-grey-1 text-center">
          검색어에 해당하는 글이 없어요 😔
        </p>
      )}
    </ul>
  )
}

export default PostList
