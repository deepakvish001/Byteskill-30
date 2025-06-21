import fs from "fs"
import path from "path"
import matter from "gray-matter"
import { remark } from "remark"
import html from "remark-html"
import remarkGfm from "remark-gfm"
import type { PostFrontmatter, SeriesListingInfo, TagWithCount, SeriesData } from "./types"

const postsDirectory = path.join(process.cwd(), "content/blog")

function getPostSlugs() {
  try {
    if (!fs.existsSync(postsDirectory)) {
      console.warn(`[lib/posts/getPostSlugs] postsDirectory does not exist: ${postsDirectory}`)
      return []
    }
    const dirents = fs.readdirSync(postsDirectory, { withFileTypes: true })
    return dirents
      .filter((dirent) => dirent.isFile() && (dirent.name.endsWith(".mdx") || dirent.name.endsWith(".md")))
      .map((dirent) => dirent.name.replace(/\.(mdx|md)$/, ""))
  } catch (error: any) {
    console.error(`[lib/posts/getPostSlugs] Error reading post slugs: ${error.message}`)
    return []
  }
}

export function getPostBySlug(slug: string, includeContent = false): PostFrontmatter | null {
  if (!slug || typeof slug !== "string") {
    console.error(`[lib/posts/getPostBySlug] Invalid or missing slug: ${slug}`)
    return null
  }

  let fullPath = path.join(postsDirectory, `${slug}.mdx`)
  let fileExists = fs.existsSync(fullPath)

  if (!fileExists) {
    fullPath = path.join(postsDirectory, `${slug}.md`)
    fileExists = fs.existsSync(fullPath)
  }

  if (!fileExists) {
    return null
  }

  try {
    const fileContents = fs.readFileSync(fullPath, "utf8")
    const { data: rawData, content: mdxContent } = matter(fileContents)

    const data: { [key: string]: any } = {}
    const requiredStringFields = ["title"]
    const optionalStringFields = [
      "description",
      "thumbnailImage",
      "thumbnailBlurDataURL",
      "heroImage",
      "heroBlurDataURL",
      "author",
      "category",
      "difficulty",
      "codeLink",
      "liveDemoLink",
      "readTime",
    ]
    const dateFields = ["date", "lastUpdated"]
    const booleanFields = ["isPublished", "featured", "isBookmarked"]
    const arrayStringFields = ["tags"]

    for (const field of requiredStringFields) {
      if (typeof rawData[field] !== "string" || !rawData[field].trim()) {
        console.error(
          `[lib/posts/getPostBySlug] CRITICAL FRONTMATTER ERROR for slug "${slug}": Field "${field}" is missing, not a string, or empty. Value: "${rawData[field]}". Skipping post.`,
        )
        return null
      }
      data[field] = rawData[field].trim()
    }

    optionalStringFields.forEach((field) => {
      data[field] = typeof rawData[field] === "string" ? rawData[field].trim() : null
    })

    dateFields.forEach((field) => {
      let dateValue: Date | null = null
      if (rawData[field]) {
        const parsed = new Date(rawData[field])
        if (!isNaN(parsed.getTime())) {
          dateValue = parsed
        } else {
          console.warn(
            `[lib/posts/getPostBySlug] Invalid date string for field "${field}" in slug "${slug}": "${rawData[field]}". Using null.`,
          )
        }
      }
      data[field] = dateValue ? dateValue.toISOString() : null
    })

    if (!data.date) {
      console.error(
        `[lib/posts/getPostBySlug] CRITICAL FRONTMATTER ERROR for slug "${slug}": "date" is invalid or missing after sanitization. Skipping post.`,
      )
      return null
    }
    data.lastUpdated = data.lastUpdated || data.date

    booleanFields.forEach((field) => {
      data[field] = typeof rawData[field] === "boolean" ? rawData[field] : field === "isPublished"
    })

    let originalTags: string[] = []
    if (Array.isArray(rawData.tags)) {
      originalTags = rawData.tags.map((tag: any) => String(tag || "").trim()).filter(Boolean)
    } else if (typeof rawData.tags === "string" && rawData.tags.trim()) {
      originalTags = [rawData.tags.trim()]
    }
    data.originalTags = originalTags
    data.tags = originalTags.map((tag) =>
      tag
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]+/g, ""),
    )

    let series: SeriesData | null = null
    if (rawData.series && typeof rawData.series === "object") {
      const s = rawData.series
      if (typeof s.slug === "string" && s.slug.trim() && typeof s.title === "string" && s.title.trim()) {
        series = {
          slug: s.slug.trim(),
          title: s.title.trim(),
          part: typeof s.part === "number" ? s.part : undefined,
          description: typeof s.description === "string" ? s.description.trim() : undefined,
          heroImage: typeof s.heroImage === "string" ? s.heroImage.trim() : undefined,
          heroBlurDataURL: typeof s.heroBlurDataURL === "string" ? s.heroBlurDataURL.trim() : undefined,
        }
      } else {
        console.warn(
          `[lib/posts/getPostBySlug] Malformed series data for slug "${slug}". Series object needs valid slug and title.`,
        )
      }
    }
    data.series = series

    let toc: any[] | null = null
    if (Array.isArray(rawData.toc)) {
      toc = rawData.toc.filter(
        (item: any) =>
          item &&
          (typeof item.slug === "string" || typeof item.href === "string") &&
          typeof item.title === "string" &&
          typeof item.level === "number",
      )
      if (toc.length === 0) toc = null
    }
    data.toc = toc

    const wordCount = mdxContent ? mdxContent.split(/\s+/).length : 0
    const calculatedReadTime = Math.ceil(wordCount / 200) + " min read"

    const postData: PostFrontmatter = {
      slug,
      title: data.title,
      date: data.date,
      tags: data.tags,
      originalTags: data.originalTags,
      description: data.description || "",
      thumbnailImage: data.thumbnailImage,
      thumbnailBlurDataURL: data.thumbnailBlurDataURL,
      heroImage: data.heroImage,
      heroBlurDataURL: data.heroBlurDataURL,
      series: data.series,
      toc: data.toc,
      readTime: data.readTime || calculatedReadTime,
      isPublished: data.isPublished,
      author: data.author || "Byteskill Team",
      category: data.category || "General",
      lastUpdated: data.lastUpdated,
      featured: data.featured,
      difficulty: data.difficulty || "Beginner",
      codeLink: data.codeLink,
      liveDemoLink: data.liveDemoLink,
      isBookmarked: data.isBookmarked || false,
    }

    if (includeContent) {
      postData.content = mdxContent
    }

    return postData
  } catch (error: any) {
    console.error(
      `[lib/posts/getPostBySlug] FAILED TO PROCESS POST: "${slug}" from file ${fullPath}. Error: ${error.message}. Stack: ${error.stack ? error.stack.substring(0, 300) : "N/A"}. Skipping post.`,
    )
    try {
      const fileContents = fs.readFileSync(fullPath, "utf8")
      const rawMatterPreview = fileContents.substring(0, Math.min(fileContents.length, 500))
      console.error(
        `[lib/posts/getPostBySlug] Raw content preview for FAILED post "${slug}":\n${rawMatterPreview}\n---END PREVIEW---`,
      )
    } catch (readError: any) {
      console.error(
        `[lib/posts/getPostBySlug] Could not re-read FAILED post file "${slug}" for debugging: ${readError.message}`,
      )
    }
    return null
  }
}

export function getAllPosts(): PostFrontmatter[] {
  console.log("[lib/posts/getAllPosts] Starting to fetch all posts.")
  const slugs = getPostSlugs()
  if (slugs.length === 0) {
    console.warn("[lib/posts/getAllPosts] No slugs found. Returning empty array.")
    return []
  }
  console.log(`[lib/posts/getAllPosts] Found ${slugs.length} slugs: ${slugs.join(", ")}`)

  const posts = slugs
    .map((slug) => {
      const post = getPostBySlug(slug)
      if (!post) {
        console.warn(
          `[lib/posts/getAllPosts] getPostBySlug returned null for slug: "${slug}". This post will be filtered out.`,
        )
      }
      return post
    })
    .filter((post): post is PostFrontmatter => {
      if (post === null) return false
      if (post.isPublished === false) {
        return false
      }
      if (isNaN(new Date(post.date).getTime())) {
        console.warn(
          `[lib/posts/getAllPosts] Post "${post.slug}" has an invalid date for sorting AFTER sanitization. This shouldn't happen. Filtering out. Date: ${post.date}`,
        )
        return false
      }
      return true
    })
    .sort((post1, post2) => {
      return new Date(post2.date).getTime() - new Date(post1.date).getTime()
    })

  console.log(`[lib/posts/getAllPosts] Successfully processed and sorted ${posts.length} posts.`)

  return posts.map((post, index, allSortedPosts) => ({
    ...post,
    prevPost:
      index > 0 ? { title: allSortedPosts[index - 1].title, href: `/blog/${allSortedPosts[index - 1].slug}` } : null,
    nextPost:
      index < allSortedPosts.length - 1
        ? { title: allSortedPosts[index + 1].title, href: `/blog/${allSortedPosts[index + 1].slug}` }
        : null,
  }))
}

export function getAllUniqueTags(): TagWithCount[] {
  const posts = getAllPosts()
  const tagCounts: { [key: string]: { count: number; displayName: string } } = {}

  posts.forEach((post) => {
    if (post.originalTags && Array.isArray(post.originalTags)) {
      post.originalTags.forEach((originalTag, index) => {
        const slugTag = post.tags[index]
        if (slugTag && originalTag) {
          if (tagCounts[slugTag]) {
            tagCounts[slugTag].count++
          } else {
            tagCounts[slugTag] = { count: 1, displayName: originalTag }
          }
        }
      })
    }
  })

  return Object.entries(tagCounts)
    .map(([tag, { count, displayName }]) => ({ tag, count, displayName }))
    .sort((a, b) => b.count - a.count)
}

export function getPostsByTag(tagSlug: string): PostFrontmatter[] {
  if (!tagSlug) return []
  return getAllPosts().filter((post) => post.tags && post.tags.includes(tagSlug))
}

export function getAllSeries(): SeriesListingInfo[] {
  const posts = getAllPosts()
  const seriesMap: Map<string, SeriesListingInfo> = new Map()

  posts.forEach((post) => {
    if (
      post.series &&
      typeof post.series === "object" &&
      typeof post.series.slug === "string" &&
      post.series.slug &&
      typeof post.series.title === "string" &&
      post.series.title
    ) {
      const seriesSlug = post.series.slug
      if (!seriesMap.has(seriesSlug)) {
        seriesMap.set(seriesSlug, {
          slug: seriesSlug,
          title: post.series.title,
          description: post.series.description || `A collection of posts about ${post.series.title}.`,
          heroImage: post.series.heroImage || null,
          heroBlurDataURL: post.series.heroBlurDataURL || null,
          postCount: 0,
          lastUpdated: post.date,
          posts: [],
        })
      }
      const currentSeries = seriesMap.get(seriesSlug)!
      currentSeries.postCount++
      if (new Date(post.date).getTime() > new Date(currentSeries.lastUpdated).getTime()) {
        currentSeries.lastUpdated = post.date
      }
      if (post.series.heroImage && !currentSeries.heroImage) {
        currentSeries.heroImage = post.series.heroImage
        currentSeries.heroBlurDataURL = post.series.heroBlurDataURL
      }
      if (
        post.series.description &&
        (!currentSeries.description || currentSeries.description.startsWith("A collection of posts about"))
      ) {
        currentSeries.description = post.series.description
      }
    } else if (post.series) {
      console.warn(
        `[lib/posts/getAllSeries] Post "${post.slug}" has malformed series data. Expected object with slug & title. Got:`,
        JSON.stringify(post.series).substring(0, 100),
      )
    }
  })

  return Array.from(seriesMap.values()).sort(
    (a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime(),
  )
}

export function getPostsBySeries(seriesSlug: string): PostFrontmatter[] {
  if (!seriesSlug) return []
  const allPosts = getAllPosts()
  const seriesPosts = allPosts.filter(
    (post) => post.series && typeof post.series === "object" && post.series.slug === seriesSlug,
  )

  return seriesPosts.sort((a, b) => {
    const partA = (a.series && typeof a.series === "object" && a.series.part) || Number.POSITIVE_INFINITY
    const partB = (b.series && typeof b.series === "object" && b.series.part) || Number.POSITIVE_INFINITY
    if (partA !== partB) {
      return partA - partB
    }
    return new Date(a.date).getTime() - new Date(b.date).getTime()
  })
}

export async function getPostContentHtml(slug: string): Promise<string> {
  const post = getPostBySlug(slug, true)
  if (!post || !post.content) {
    console.warn(`[lib/posts/getPostContentHtml] No content found for slug: ${slug}`)
    return ""
  }
  try {
    const processedContent = await remark().use(html).use(remarkGfm).process(post.content)
    return processedContent.toString()
  } catch (error: any) {
    console.error(`[lib/posts/getPostContentHtml] Error processing MDX content for slug "${slug}": ${error.message}`)
    return `<p>Error rendering content.</p>`
  }
}

export function getRelatedPosts(
  currentPostSlug: string,
  allPostsParam?: PostFrontmatter[],
  count = 3,
): PostFrontmatter[] {
  const allPosts = allPostsParam || getAllPosts()
  const currentPost = allPosts.find((post) => post.slug === currentPostSlug)
  if (!currentPost || !currentPost.tags || currentPost.tags.length === 0) {
    return []
  }
  const related = allPosts
    .filter((post) => post.slug !== currentPostSlug)
    .map((post) => {
      const commonTags = post.tags && currentPost.tags ? post.tags.filter((tag) => currentPost.tags.includes(tag)) : []
      return { ...post, commonTagsCount: commonTags.length }
    })
    .filter((post) => post.commonTagsCount > 0)
    .sort((a, b) => {
      if (b.commonTagsCount !== a.commonTagsCount) {
        return b.commonTagsCount - a.commonTagsCount
      }
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })
  return related.slice(0, count)
}

export function getFeaturedPosts(posts?: PostFrontmatter[], count = 3): PostFrontmatter[] {
  const allPosts = posts || getAllPosts()
  return allPosts.filter((p) => p.featured && p.isPublished).slice(0, count)
}

export function getFeaturedSeries(series?: SeriesListingInfo[], count = 3): SeriesListingInfo[] {
  const allSeries = series || getAllSeries()
  return allSeries.slice(0, count)
}
