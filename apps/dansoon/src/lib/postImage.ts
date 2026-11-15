import { getImage } from 'astro:assets';
import type { Post } from '~/lib/posts';

const OG_IMAGE_WIDTH = 1200;

/** 글 상세의 og:image와 RSS의 media:content가 같은 이미지를 가리키게 한 곳에서 정한다. */
export async function postOgImagePath(post: Post): Promise<string> {
  const { thumbnail } = post.data;
  if (!thumbnail) return `/og/posts/${post.id}.png`;
  return (await getImage({ src: thumbnail, width: OG_IMAGE_WIDTH, format: 'jpg' })).src;
}
