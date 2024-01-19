import React from 'react'
import { Link } from 'gatsby'
import '~/styles/components/post.scss'
import type PostListProps from './PostList.types'

const PostList = ({ posts }: PostListProps) => {
  return (
    <ul className='post-list'>
      {posts.length ? (
        posts.map(post => (
          <li key={post.url} className='post-list-item'>
            <Link to={post.url} itemProp='url'>
              <article itemScope itemType='http://schema.org/Article'>
                <header>
                  {post.thumbnail && (
                    <div className='responsive-thumbnail-wrapper'>
                      <div className='padding' />
                      <div className='content'>
                        <img className='thumbnail' src={post.thumbnail.src} />
                      </div>
                    </div>
                  )}
                  <h2 className='title'>
                    <span itemProp='headline'>{post.title}</span>
                  </h2>
                  <p className='published-at'>{post.publishedAt}</p>
                </header>
                <section>
                  <p className='description'>{post.description}</p>
                </section>
              </article>
            </Link>
          </li>
        ))
      ) : (
        <p className='empty-posts'>검색어에 해당하는 글이 없어요 😭</p>
      )}
    </ul>
  )
}

export default PostList
