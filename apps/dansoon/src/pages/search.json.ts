import { formatShortDate } from '~/lib/format';
import { getPublishedPosts, postPath } from '~/lib/posts';
import { CATEGORY_LABEL, TAG_LABEL } from '~/lib/taxonomy';

function toPlainText(markdown: string) {
  return markdown
    .replace(/^`{3,}.*$/gm, '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`|\\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function GET() {
  const posts = await getPublishedPosts();
  const documents = posts.map((post) => ({
    url: postPath(post),
    title: post.data.title,
    description: post.data.description,
    category: CATEGORY_LABEL[post.data.category],
    tags: post.data.tags.map((tag) => TAG_LABEL[tag]),
    date: formatShortDate(post.data.publishedAt),
    text: toPlainText(post.body ?? ''),
  }));
  return new Response(JSON.stringify(documents), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
