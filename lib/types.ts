export interface BaseFrontmatter {
  slug: string
  title: string
  date: string // ISO string, typically published_at
  updated_at?: string // ISO string, for dateModified
  tags: string[] // sluggified tags
  originalTags?: string[] // original tags from frontmatter
  description: string
  isPublished?: boolean
  category?: string | null
  featured?: boolean
  readTime?: string
  toc?: any // Table of contents structure, adjust as needed
  author?: {
    name: string
    url?: string
  }
  view_count?: number
}

export interface PostFrontmatter extends BaseFrontmatter {
  id: string
  series?: {
    title: string
    slug: string
    part: number
    description?: string
    heroImage?: string | null
    heroBlurDataURL?: string | null
  } | null
  heroImage?: string | null
  heroBlurDataURL?: string | null
  thumbnailImage?: string | null
  thumbnailBlurDataURL?: string | null
  relatedPosts?: string[]
  isBookmarked?: boolean
  prevPost?: { slug: string; title: string } | null
  nextPost?: { slug: string; title: string } | null
  content?: string
  contentType?: "Post"
  longDescription?: string
}

export interface ProjectFrontmatter extends BaseFrontmatter {
  id: string
  longDescription?: string
  heroImage?: string | null
  heroBlurDataURL?: string | null
  thumbnailImage?: string | null
  thumbnailBlurDataURL?: string | null
  liveUrl?: string | null
  repoUrl?: string | null
  demoUrl?: string | null
  technologies?: string[]
  isBookmarked?: boolean
  content?: string
  contentType?: "Project"
}

export interface CardData {
  slug: string
  title: string
  date: string
  tags?: string[]
  description?: string
  imageUrl?: string | null
  blurDataURL?: string | null
  category?: string | null
  readTime?: string
  href: string
  contentType: "Post" | "Project"
  view_count?: number
}

export interface UserProfile {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  email?: string
  role?: "user" | "admin" | "owner"
  bio?: string | null
  created_at?: string
  comment_notifications_enabled?: boolean
  website?: string | null
  mobile_number?: string | null
  location?: string | null
  company?: string | null
  job_title?: string | null
  github_username?: string | null
  twitter_username?: string | null
  linkedin_url?: string | null
  skills?: string[] | null
  interests?: string[] | null
  view_count?: number
  reputation_score?: number
}

export interface UpdateUserProfilePayload {
  username?: string
  full_name?: string
  avatar_url?: string
  website?: string
  bio?: string
  mobile_number?: string
  avatarFile?: File
  comment_notifications_enabled?: boolean
  location?: string
  company?: string
  job_title?: string
  github_username?: string
  twitter_username?: string
  linkedin_url?: string
  skills?: string[]
  interests?: string[]
}

export interface SignupFormState {
  errors?: {
    username?: string[]
    email?: string[]
    mobile_number?: string[]
    password?: string[]
    confirmPassword?: string[]
    full_name?: string[]
    _form?: string[]
  }
  message?: string
  success?: boolean
}

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type ContentStatus = "draft" | "published" | "archived"

export interface DbTag {
  id: number
  name: string
  slug: string
  created_at?: string
  description?: string | null
}

export interface DbPost {
  id: string
  author_id: string
  series_id?: string | null
  title: string
  slug: string
  description?: string | null
  content: string
  status: ContentStatus
  published_at?: string | null
  created_at: string
  updated_at?: string | null
  hero_image_url?: string | null
  thumbnail_image_url?: string | null
  featured?: boolean
  series_part_number?: number | null
  view_count?: number
  author?: Pick<UserProfile, "id" | "username" | "full_name"> | null
  tags: DbTag[]
  series?: Pick<DbSeries, "slug" | "title"> | null
}

export interface DbProject {
  id: string
  author_id?: string | null
  title: string
  slug: string
  description?: string | null
  long_description?: string | null
  content?: string | null
  hero_image_url?: string | null
  thumbnail_image_url?: string | null
  live_url?: string | null
  repo_url?: string | null
  demo_url?: string | null
  technologies?: string[] | null
  status?: ContentStatus
  published_at?: string | null
  created_at?: string
  updated_at?: string
  featured?: boolean
  category?: string | null
  view_count?: number
  tags?: DbTag[]
  author?: Pick<UserProfile, "id" | "username" | "full_name" | "avatar_url"> | null
}

export interface DbSeries {
  id: string
  author_id: string
  title: string
  slug: string
  description?: string | null
  hero_image_url?: string | null
  status: "draft" | "published"
  created_at: string
  updated_at?: string
  author?: Pick<UserProfile, "id" | "username" | "full_name">
  posts?: DbPost[]
  post_count?: number
}

export interface DbComment {
  id: string
  post_id: string
  user_id: string
  parent_comment_id: string | null
  content: string
  is_approved: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export interface CommentWithAuthor extends DbComment {
  author: Pick<UserProfile, "id" | "username" | "full_name" | "avatar_url"> | null
  replies?: CommentWithAuthor[]
  post?: Pick<DbPost, "id" | "title" | "slug"> | null
}

export interface DbAuditLog {
  id: string
  actor_id: string
  action: string
  target_type?: string | null
  target_id?: string | null
  details?: Json | null
  created_at: string
}

export interface AuditLogWithActor extends DbAuditLog {
  actor: Pick<UserProfile, "id" | "username" | "full_name" | "avatar_url"> | null
}

export interface DbReportedContent {
  id: string
  reporter_id: string
  content_id: string
  content_type: "comment" | "post" | "project" | "user"
  reason: string
  status: "pending" | "under_review" | "resolved_action_taken" | "resolved_no_action"
  moderator_notes?: string | null
  created_at: string
  updated_at: string
}

export interface ReportedContentWithDetails {
  id: string
  reporter: Pick<UserProfile, "id" | "username" | "full_name">
  content_id: string
  content_type: "comment"
  reason: string
  status: DbReportedContent["status"]
  created_at: string
  comment?: {
    id: string
    content: string
    post: {
      id: string
      slug: string
      title: string
    }
    author: Pick<UserProfile, "id" | "username" | "full_name">
  }
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: UserProfile
        Insert: Partial<UserProfile>
        Update: Partial<UserProfile>
      }
      series_progress: {
        Row: any
        Insert: any
        Update: any
      }
      bookmarks: {
        Row: any
        Insert: any
        Update: any
      }
      tags: {
        Row: DbTag
        Insert: Omit<DbTag, "id" | "created_at">
        Update: Partial<Omit<DbTag, "id" | "created_at">>
      }
      posts: {
        Row: DbPost
        Insert: Omit<DbPost, "id" | "created_at" | "updated_at" | "tags" | "author" | "series"> & { author_id: string }
        Update: Partial<Omit<DbPost, "id" | "created_at" | "author_id" | "tags" | "author" | "series">>
      }
      post_tags: {
        Row: { post_id: string; tag_id: number }
        Insert: { post_id: string; tag_id: number }
        Update: never
      }
      projects: {
        Row: DbProject
        Insert: Omit<DbProject, "id" | "created_at" | "updated_at" | "tags" | "author"> & { author_id?: string | null }
        Update: Partial<Omit<DbProject, "id" | "created_at" | "author_id" | "tags" | "author">>
      }
      project_tags: {
        Row: { project_id: string; tag_id: number }
        Insert: { project_id: string; tag_id: number }
        Update: never
      }
      series: {
        Row: DbSeries
        Insert: Omit<DbSeries, "id" | "created_at" | "updated_at" | "posts" | "author"> & { author_id: string }
        Update: Partial<Omit<DbSeries, "id" | "created_at" | "author_id" | "posts" | "author">>
      }
      series_posts: {
        Row: { series_id: string; post_id: string; part_number: number }
        Insert: { series_id: string; post_id: string; part_number: number }
        Update: Partial<{ part_number: number }>
      }
      comments: {
        Row: DbComment
        Insert: Omit<DbComment, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<DbComment, "id" | "created_at" | "updated_at">>
      }
      audit_logs: {
        Row: DbAuditLog
        Insert: Omit<DbAuditLog, "id" | "created_at">
        Update: never
      }
      reported_content: {
        Row: DbReportedContent
        Insert: Omit<DbReportedContent, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<DbReportedContent, "id" | "created_at" | "reporter_id">>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      handle_new_user: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      handle_updated_at: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      get_tags_with_content_counts: {
        Args: Record<string, unknown>
        Returns: Array<{
          id: number
          name: string
          slug: string
          description: string | null
          post_count: number
          project_count: number
          total_count: number
        }>
      }
      increment_view_count: {
        Args: { item_id_param: string; item_type_param: "post" | "project" }
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export interface ArticleCardDisplayInfo {
  slug: string
  title: string
  date: string
  description?: string
  thumbnailImage?: string | null
  thumbnailBlurDataURL?: string | null
  originalTags?: string[]
  readTime?: string
  view_count?: number
}

export interface ProjectCardDisplayInfo {
  slug: string
  title: string
  category?: string | null
  tags?: string[]
  thumbnailImage?: string | null
  thumbnailBlurDataURL?: string | null
  heroImage?: string | null
  heroBlurDataURL?: string | null
  view_count?: number
}

export type BookmarkItemType = "post" | "project" | "series"

export interface SeriesListingInfo {
  slug: string
  title: string
  description: string
  heroImage?: string | null
  heroBlurDataURL?: string | null
  postCount: number
  lastUpdated: string
  posts?: PostFrontmatter[]
  status?: "draft" | "published"
}

export interface TagWithCount {
  id: number
  name: string
  slug: string
  description?: string | null
  postCount: number
  projectCount: number
  totalCount: number
}

export interface TagPageData {
  tag: DbTag
  items: CardData[]
  currentPage: number
  totalPages: number
  totalItems: number
}

export interface SearchResultItem {
  id: string
  type: "post" | "project"
  slug: string
  title: string
  snippet: string
  published_at: string | null
  rank?: number
  view_count?: number
}

export interface AdminDashboardAnalytics {
  totalPublishedPosts: number
  totalPublishedProjects: number
  totalPublishedSeries: number
  totalUsers: number
  mostCommentedPosts: { id: string; title: string; slug: string; comment_count: number }[]
  mostUsedTags: { id: number; name: string; slug: string; usage_count: number }[]
  mostViewedPosts: { id: string; title: string; slug: string; view_count: number }[]
  mostViewedProjects: { id: string; title: string; slug: string; view_count: number }[]
}
