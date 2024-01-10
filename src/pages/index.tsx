import React, { useMemo, useState } from 'react'
import type { PageProps } from 'gatsby'
import { graphql } from 'gatsby'
import { AppLayout } from '~/components/Layout'
import { PostList } from '~/components/Main'
import { Seo } from '~/components/Common'
import '../styles/pages/index.scss'
import uniq from 'lodash/uniq'
import Categories from '~/components/Category'

const Main = ({ data }: PageProps<QueryResult>) => {
  const [category, setCategory] = useState<string>('ALL')
  const [search, setSearch] = useState<string>('')
  const posts = React.useMemo<Common.Post[]>(
    () =>
      data.allMarkdownRemark.nodes.map(
        ({
          frontmatter: { title, description, thumbnail, date, category },
          fields
        }) => ({
          title,
          description,
          category,
          thumbnail:
            thumbnail?.childImageSharp.gatsbyImageData.images.fallback ?? null,
          url: fields.slug,
          publishedAt: date
        })
      ),
    [data]
  )

  let filterPosts =
    category !== 'ALL'
      ? posts.filter(p => p.category === category)
      : search !== ''
      ? posts.filter(p => p.title.toLowerCase().includes(search.toLowerCase()))
      : posts

  const categories = useMemo(
    () => ['ALL', ...uniq(posts.filter(p => p.category).map(p => p.category))],
    [posts]
  )

  const handleClickCategory = (tag: string) => {
    if (tag) {
      setCategory(tag)
    }
  }

  const onClickSearch = (text: string) => {
    setSearch(text)
  }

  return (
    <AppLayout>
      <Seo title='김단우 블로그' />
      <Categories
        category={category}
        categories={categories}
        handleClickCategory={handleClickCategory}
        onClickSearch={onClickSearch}
      />
      <PostList
        posts={filterPosts.filter(p => p.title !== '🧑🏻‍💻 frontend 김단우')}
      />
    </AppLayout>
  )
}

interface QueryResult {
  allMarkdownRemark: {
    nodes: {
      fields: {
        slug: string
      }
      frontmatter: {
        title: string
        date: string
        description: string
        category: string
        thumbnail: {
          childImageSharp: {
            gatsbyImageData: {
              images: {
                fallback: {
                  src: string
                  srcSet: string
                  sizes: string
                }
              }
            }
          }
        } | null
      }
    }[]
  }
}

export const pageQuery = graphql`
  query {
    allMarkdownRemark(sort: { frontmatter: { date: DESC } }) {
      nodes {
        fields {
          slug
        }
        frontmatter {
          title
          date(formatString: "YYYY년 M월 D일")
          description
          category
          thumbnail {
            childImageSharp {
              gatsbyImageData
            }
          }
        }
      }
    }
  }
`

export default Main
