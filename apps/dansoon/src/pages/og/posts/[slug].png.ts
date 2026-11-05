import type { APIRoute, GetStaticPaths } from 'astro';
import { OG_ACCENT, pngResponse, renderOgImage } from '~/lib/ogImage';
import { getPublishedPosts, type Post } from '~/lib/posts';
import { CATEGORY_LABEL } from '~/lib/taxonomy';

// 썸네일이 있는 글은 그 이미지를 쓰므로 카드를 만들지 않는다
export const getStaticPaths = (async () => {
  const posts = await getPublishedPosts();
  return posts.filter((post) => !post.data.thumbnail).map((post) => ({ params: { slug: post.id }, props: { post } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute<{ post: Post }> = async ({ props: { post } }) => {
  const { title, category } = post.data;
  return pngResponse(await renderOgImage({ label: CATEGORY_LABEL[category], color: OG_ACCENT[category], title }));
};
