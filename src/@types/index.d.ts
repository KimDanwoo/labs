declare module Common {
  interface SiteMetadata {
    title: string
    description: string
    thumbnail: string
    siteUrl: string
  }

  interface Post {
    title: string
    description: string
    category: string
    isHidden: boolean
    thumbnail: {
      src: string
      srcSet: string
      sizes: string
    } | null
    url: string
    publishedAt: string
  }
}
