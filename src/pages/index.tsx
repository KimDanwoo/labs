import React from 'react'
import type { PageProps } from 'gatsby'
import { graphql } from 'gatsby'
import { AppLayout } from '~/components/Layout'
import { PostList } from '~/components/Main'
import { Seo } from '~/components/Common'
import '../styles/pages/index.scss'
import Categories from '~/components/Category'
import Search from '~/components/Search'
import useFilter from '~/hooks/useFilter'

const Main = ({ data }: PageProps<QueryResult>): JSX.Element => {
  const posts = data.allMarkdownRemark.nodes.map(
    ({
      frontmatter: { title, description, thumbnail, date, category, isHidden },
      fields
    }) => ({
      title,
      description,
      category,
      isHidden,
      thumbnail:
        thumbnail?.childImageSharp.gatsbyImageData.images.fallback ?? null,
      url: fields.slug,
      publishedAt: date
    })
  )

  const {
    category,
    categories,
    handleClickCategory,
    onClickSearch,
    filteredPosts
  } = useFilter(posts)

  return (
    <AppLayout>
      <Seo title='김단우 블로그' />
      <Search onClickSearch={onClickSearch} />
      <Categories
        category={category}
        categories={categories}
        handleClickCategory={handleClickCategory}
      />
      <PostList posts={filteredPosts} />
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
        isHidden: boolean
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
          isHidden
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
