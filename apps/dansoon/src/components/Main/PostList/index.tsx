import type PostListProps from './PostList.types';

const PostList = ({ posts }: PostListProps) => {
  return (
    <ul className="post-list">
      {posts.length ? (
        posts.map((post, index) => (
          <li
            key={post.url}
            className="post-card animate-fade-in-up"
            style={{ animationDelay: `${Math.min(index * 0.06, 0.36)}s` }}
          >
            <a href={post.url} itemProp="url" className="post-card-link">
              <article className="post-card-inner" itemScope itemType="http://schema.org/Article">
                {post.thumbnail && (
                  <div className="post-card-thumb">
                    <div className="post-card-thumb-ratio" />
                    <div className="post-card-thumb-img-wrap">
                      <img src={post.thumbnail.src} alt="" loading="lazy" decoding="async" />
                    </div>
                  </div>
                )}

                <div className="post-card-meta">
                  {post.category && <span className="post-card-category">{post.category}</span>}
                  {post.category && <span className="post-card-dot">·</span>}
                  <time className="post-card-date" dateTime={post.publishedAt}>
                    {post.publishedAt}
                  </time>
                </div>

                <h2 className="post-card-title" itemProp="headline">
                  {post.title}
                </h2>

                <p className="post-card-desc" itemProp="description">
                  {post.description}
                </p>
              </article>
            </a>
          </li>
        ))
      ) : (
        <li className="py-20 text-center text-sm text-grey-1">글이 없어요 😔</li>
      )}
    </ul>
  );
};

export default PostList;
