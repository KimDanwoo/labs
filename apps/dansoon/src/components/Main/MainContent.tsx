import useFilter from '~/hooks/useFilter';
import Categories from '../Category';
import Search from '../Search';
import PostList from './PostList';

interface Props {
  posts: Common.Post[];
}

export default function MainContent({ posts }: Props) {
  const { category, categories, handleClickCategory, onClickSearch, filteredPosts } = useFilter(posts);

  return (
    <>
      <Search onClickSearch={onClickSearch} />
      <Categories category={category} categories={categories} handleClickCategory={handleClickCategory} />
      <PostList posts={filteredPosts} />
    </>
  );
}
