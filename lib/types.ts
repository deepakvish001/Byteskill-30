export interface BaseFrontmatter {
  slug: string
  title: string
  date: string // ISO string
  tags: string[] // sluggified tags
  originalTags?: string[] // original tags from frontmatter
  description: string
  isPublished?: boolean
  category?: string | null
  featured?: boolean
  readTime?: string
  toc?: any // Table of contents structure, adjust as needed
  authorUsername?: string
}

export interface PostFrontmatter extends BaseFrontmatter {
  series?: {
    title: string
    slug: string
    part: number
  } | null
  heroImage?: string | null
  heroBlurDataURL?: string | null
  thumbnailImage?: string | null
  thumbnailBlurDataURL?: string | null
  relatedPosts?: string[]
  isBookmarked?: boolean
  prevPost?: { title: string; href: string } | null
  nextPost?: { title: string; href: string } | null
  content?: string
}

export interface ProjectFrontmatter extends BaseFrontmatter {
  longDescription?: string
  heroImage?: string | null
  heroBlurDataURL?: string | null
  thumbnailImage?: string | null
  thumbnailBlurDataURL?: string | null
  liveUrl?: string | null
  repoUrl?: string | null
  lighthouseScoreImage?: string | null
  demoUrl?: string | null
  technologies?: string[]
  isBookmarked?: boolean
  content?: string
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
}

export interface UserProfile {
  id: string
  updated_at: string | null
  created_at: string | null
  username: string | null
  full_name: string | null
  avatar_url: string | null
  website: string | null
  role?: string | null
  bio?: string | null
  mobile_number?: string | null
}

export interface UpdateUserProfilePayload {
  username?: string
  full_name?: string
  avatar_url?: string
  website?: string
  bio?: string
  mobile_number?: string
  avatarFile?: File
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
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// New specific types for card components
export interface ArticleCardDisplayInfo {
  slug: string
  title: string
  date: string // ISO string
  description?: string
  thumbnailImage?: string | null
  thumbnailBlurDataURL?: string | null
  originalTags?: string[] // For displaying non-sluggified tags
  readTime?: string
  // authorUsername?: string; // Not directly displayed on card, but good for context if needed
  // series?: PostFrontmatter['series']; // Not directly displayed on card
}

export interface ProjectCardDisplayInfo {
  slug: string
  title: string
  // date?: string; // Not typically displayed on project cards, but can be added
  category?: string | null
  tags?: string[] // Used for badges if category is not present
  thumbnailImage?: string | null
  thumbnailBlurDataURL?: string | null
  heroImage?: string | null // Fallback for thumbnail
  heroBlurDataURL?: string | null // Fallback for thumbnail
  // description?: string; // Not typically displayed on project cards
  // technologies?: string[]; // Not typically displayed on project cards
  // authorUsername?: string; // Not directly displayed on card
}

export type BookmarkItemType = "post" | "project" | "series" // Added series
