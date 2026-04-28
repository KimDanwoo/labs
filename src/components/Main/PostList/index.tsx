import React from 'react'
import type PostListProps from './PostList.types'

const PostList = ({ posts }: PostListProps) => {
  return (
    <ul className="w-full flex flex-col m-0 p-0 list-none">
      {posts.length ? (
        posts.map(post => (
          <li key={post.url} className="py-10 border-b border-grey-3">
            <a href={post.url} itemProp="url">
              <article
                className="w-full flex flex-col box-border group transition-transform duration-[400ms] md:hover:-translate-y-1"
                itemScope
                itemType="http://schema.org/Article"
              >
                <header>
                  {post.thumbnail && (
                    <div className="relative w-full overflow-hidden mb-6 border border-grey-5 rounded-xl">
                      <div className="pt-[50%]" />
                      <div className="absolute inset-0">
                        <img
                          className="w-full h-full object-cover transition-transform duration-[400ms] md:group-hover:scale-[1.03]"
                          src={post.thumbnail.src}
                          alt=""
                        />
                      </div>
                    </div>
                  )}
                  <h2 className="m-0 text-[1.6rem] font-bold">
                    <span itemProp="headline">{post.title}</span>
                  </h2>
                  <p className="my-3 text-grey-2 text-sm">{post.publishedAt}</p>
                </header>
                <section>
                  <p className="m-0 text-grey-1 text-lg">{post.description}</p>
                </section>
              </article>
            </a>
          </li>
        ))
      ) : (
        <p className="py-12 text-base font-bold text-center">
          검색어에 해당하는 글이 없어요 😭
        </p>
      )}
    </ul>
  )
}

export default PostList
