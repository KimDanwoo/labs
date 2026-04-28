import rss from '@astrojs/rss'
import { getCollection } from 'astro:content'
import type { APIContext } from 'astro'

export async function GET(context: APIContext) {
  const posts = await getCollection('blog')
  const items = posts
    .filter(post => !post.data.isHidden && post.data.title !== '🧑🏻‍💻 frontend 김단우')
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
    .map(post => {
      const slug = post.id.replace(/\/index\.md$/, '').replace(/\.md$/, '')
      return {
        title: post.data.title,
        description: post.data.description,
        pubDate: post.data.date,
        link: `/${slug}/`
      }
    })

  return rss({
    title: 'blog.danwoo RSS Feed',
    description: '기록하고 공유합니다',
    site: context.site!,
    items
  })
}
