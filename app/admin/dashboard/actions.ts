"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type {
  UserProfile,
  PostFrontmatter,
  ProjectFrontmatter,
  DbPost,
  DbProject,
  DbSeries,
  DbTag,
  ContentStatus,
  SeriesFormData,
  TagFormData,
  CommentWithAuthor,
  DbComment,
  AuditLogWithActor,
  AdminDashboardAnalytics,
  DbReportedContent,
  ReportedContentWithDetails,
} from "@/lib/types"
import { uploadFileToSupabase, deleteFileFromSupabase } from "@/lib/supabase/storage"
import { logAdminAction, type AuditAction } from "@/lib/audit-logger"

const POST_IMAGES_BUCKET = "post-images"
const PROJECT_IMAGES_BUCKET = "project-images"

interface ActionResult {
  success: boolean
  message?: string
  users?: UserProfile[]
  content?: (PostFrontmatter | ProjectFrontmatter)[]
  post?: DbPost
  posts?: DbPost[]
  project?: DbProject
  projects?: DbProject[]
  seriesSingle?: DbSeries
  seriesList?: DbSeries[]
  tag?: DbTag
  tags?: DbTag[]
  comment?: CommentWithAuthor
  comments?: CommentWithAuthor[]
  analytics?: AdminDashboardAnalytics
}

function getFormDataString(formData: FormData, key: string, defaultValue = ""): string {
  return (formData.get(key) as string) || defaultValue
}

function getFormDataOptionalString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key)
  return value ? String(value) : undefined
}

function getFormDataBoolean(formData: FormData, key: string, defaultValue = false): boolean {
  const value = formData.get(key)
  if (value === null || value === undefined) return defaultValue
  return String(value).toLowerCase() === "true" || String(value) === "1"
}

function getFormDataStringArray(formData: FormData, key: string): string[] {
  const value = formData.get(key) as string | null
  if (!value) return []
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

function getFormDataNumberArray(formData: FormData, key: string): number[] {
  const values = formData.getAll(key)
  if (!values || values.length === 0) return []
  return values.map((v) => Number(String(v))).filter((n) => !isNaN(n))
}

async function verifyAdmin(): Promise<{ isAdminOrOwner: boolean; error?: string; userId?: string }> {
  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { isAdminOrOwner: false, error: "Authentication required. Please log in." }
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, id")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    console.error("verifyAdmin: Profile fetch error:", profileError)
    return { isAdminOrOwner: false, error: "Failed to retrieve your user profile. Please try again." }
  }

  const isAdminOrOwner = profile.role === "admin" || profile.role === "owner"
  if (!isAdminOrOwner) {
    return { isAdminOrOwner: false, error: "You are not authorized for this action." }
  }
  return { isAdminOrOwner: true, userId: profile.id }
}

export async function getAllUsers(params?: { searchTerm?: string; filterRole?: string }): Promise<ActionResult> {
  const supabase = createClient()
  const adminCheck = await verifyAdmin()
  if (!adminCheck.isAdminOrOwner) {
    return { success: false, message: adminCheck.error }
  }

  try {
    let query = supabase.from("profiles").select("id, username, full_name, email, role, created_at, avatar_url")

    if (params?.searchTerm) {
      const searchTerm = `%${params.searchTerm}%`
      query = query.or(`username.ilike.${searchTerm},full_name.ilike.${searchTerm},email.ilike.${searchTerm}`)
    }

    if (params?.filterRole && params.filterRole !== "all") {
      query = query.eq("role", params.filterRole)
    }

    query = query.order("created_at", { ascending: false })

    const { data: users, error } = await query

    if (error) {
      console.error("Error fetching users (admin):", error.message)
      return { success: false, message: "Failed to fetch user list. Please try again later." }
    }
    return { success: true, users: users as UserProfile[] }
  } catch (e: any) {
    console.error("Unexpected error fetching users (admin):", e.message)
    return { success: false, message: "An unexpected error occurred while fetching users." }
  }
}

export async function updateUserRole(userId: string, newRole: string): Promise<ActionResult> {
  const supabase = createClient()
  const adminCheck = await verifyAdmin()
  if (!adminCheck.isAdminOrOwner || !adminCheck.userId) {
    return { success: false, message: adminCheck.error || "Admin user ID not found." }
  }
  const actingAdminId = adminCheck.userId

  let oldRole: string | undefined
  try {
    const { data: targetUserProfile, error: fetchProfileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single()
    if (fetchProfileError) {
      console.warn("Audit log: Could not fetch old role for user:", userId, fetchProfileError.message)
    } else {
      oldRole = targetUserProfile?.role
    }
  } catch (e) {
    console.warn("Audit log: Exception fetching old role for user:", userId, e)
  }

  if (actingAdminId === userId && newRole !== "owner") {
    await logAdminAction(supabase, actingAdminId, "admin_action_failed", {
      targetType: "user",
      targetId: userId,
      reason: "Owner self-demotion attempt.",
      actionAttempted: "update_user_role",
      details: { newRole },
    })
    return { success: false, message: "As an owner, you cannot demote yourself through this interface." }
  }

  const validRoles = ["user", "admin", "owner"]
  if (!validRoles.includes(newRole)) {
    await logAdminAction(supabase, actingAdminId, "admin_action_failed", {
      targetType: "user",
      targetId: userId,
      reason: "Invalid role specified.",
      actionAttempted: "update_user_role",
      details: { newRole },
    })
    return { success: false, message: "Invalid role specified. Please select a valid role." }
  }

  try {
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq("id", userId)

    if (error) {
      console.error("Error updating user role (admin):", error.message)
      await logAdminAction(supabase, actingAdminId, "admin_action_failed", {
        targetType: "user",
        targetId: userId,
        reason: `Supabase error: ${error.message}`,
        actionAttempted: "update_user_role",
        details: { newRole, oldRole },
      })
      return { success: false, message: "Failed to update user role. Please try again." }
    }

    await logAdminAction(supabase, actingAdminId, "update_user_role", {
      targetType: "user",
      targetId: userId,
      changes: { role: { oldValue: oldRole, newValue: newRole } },
    })

    revalidatePath("/admin/dashboard")
    return { success: true, message: `User role successfully updated to ${newRole}.` }
  } catch (e: any) {
    console.error("Unexpected error updating role (admin):", e.message)
    await logAdminAction(supabase, actingAdminId, "admin_action_failed", {
      targetType: "user",
      targetId: userId,
      reason: `Unexpected error: ${e.message}`,
      actionAttempted: "update_user_role",
      details: { newRole, oldRole },
    })
    return { success: false, message: "An unexpected error occurred while updating the role." }
  }
}

export async function bulkUpdateUserRoles(userIds: string[], newRole: string): Promise<ActionResult> {
  const supabase = createClient()
  const adminCheck = await verifyAdmin()
  if (!adminCheck.isAdminOrOwner) {
    return { success: false, message: adminCheck.error }
  }

  if (newRole === "owner" && adminCheck.isAdminOrOwner) {
    const { data: adminProfile } = await supabase.from("profiles").select("role").eq("id", adminCheck.userId!).single()
    if (adminProfile?.role !== "owner") {
      return { success: false, message: "Only owners can assign the owner role." }
    }
  }

  if (userIds.includes(adminCheck.userId!)) {
    return { success: false, message: "You cannot change your own role as part of a bulk action." }
  }

  const validRoles = ["user", "admin", "owner"]
  if (!validRoles.includes(newRole)) {
    return { success: false, message: "Invalid role specified." }
  }

  try {
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .in("id", userIds)

    if (error) {
      console.error("Error in bulk role update:", error)
      return { success: false, message: "Failed to update roles for some users. Please try again." }
    }

    revalidatePath("/admin/dashboard")
    return { success: true, message: `Successfully updated ${userIds.length} user(s) to the '${newRole}' role.` }
  } catch (e: any) {
    console.error("Unexpected error in bulk role update:", e)
    return { success: false, message: "An unexpected error occurred during the bulk update." }
  }
}

export async function adminGetAllPosts(): Promise<ActionResult> {
  const supabase = createClient()
  const adminCheck = await verifyAdmin()
  if (!adminCheck.isAdminOrOwner) return { success: false, message: adminCheck.error }
  try {
    const { data, error } = await supabase
      .from("posts")
      .select(`*, author:profiles (id, username, full_name), tags (id, name, slug)`)
      .order("created_at", { ascending: false })
    if (error) throw error
    return { success: true, posts: data as DbPost[] }
  } catch (e: any) {
    console.error("Error fetching posts (admin):", e.message)
    return { success: false, message: "Failed to fetch posts." }
  }
}

export async function createPost(formData: FormData): Promise<ActionResult> {
  const supabase = createClient()
  const adminCheck = await verifyAdmin()
  if (!adminCheck.isAdminOrOwner || !adminCheck.userId) {
    return { success: false, message: adminCheck.error || "User ID not found." }
  }

  try {
    let heroImageUrl = getFormDataOptionalString(formData, "hero_image_url")
    let thumbnailImageUrl = getFormDataOptionalString(formData, "thumbnail_image_url")

    const heroImageFile = formData.get("hero_image_file") as File | null
    if (heroImageFile && heroImageFile.size > 0) {
      heroImageUrl = await uploadFileToSupabase(heroImageFile, POST_IMAGES_BUCKET, "hero")
    }

    const thumbnailImageFile = formData.get("thumbnail_image_file") as File | null
    if (thumbnailImageFile && thumbnailImageFile.size > 0) {
      thumbnailImageUrl = await uploadFileToSupabase(thumbnailImageFile, POST_IMAGES_BUCKET, "thumbnail")
    }

    const postToInsert = {
      title: getFormDataString(formData, "title"),
      slug: getFormDataString(formData, "slug"),
      content: getFormDataString(formData, "content"),
      status: getFormDataString(formData, "status", "draft") as ContentStatus,
      description: getFormDataOptionalString(formData, "description"),
      hero_image_url: heroImageUrl,
      thumbnail_image_url: thumbnailImageUrl,
      author_id: adminCheck.userId,
      published_at: getFormDataString(formData, "status") === "published" ? new Date().toISOString() : null,
      view_count: 0, // Initialize view_count
    }

    const { data: newPost, error } = await supabase.from("posts").insert(postToInsert).select().single()
    if (error) throw error

    const tag_ids = getFormDataNumberArray(formData, "tag_ids[]")
    if (tag_ids.length > 0) {
      const postTagsToInsert = tag_ids.map((tag_id) => ({ post_id: newPost.id, tag_id }))
      const { error: tagsError } = await supabase.from("post_tags").insert(postTagsToInsert)
      if (tagsError) throw tagsError
    }

    revalidatePath("/admin/dashboard/content-management")
    revalidatePath("/admin/dashboard/comment-management")
    revalidatePath("/blog")
    revalidatePath("/tags")
    if (newPost.status === "published") revalidatePath(`/blog/${newPost.slug}`)
    return { success: true, message: "Post created successfully.", post: newPost as DbPost }
  } catch (e: any) {
    console.error("Error creating post:", e.message)
    return {
      success: false,
      message: e.code === "23505" ? "A post with this slug already exists." : `Failed to create post: ${e.message}`,
    }
  }
}

export async function updatePost(postId: string, formData: FormData): Promise<ActionResult> {
  const supabase = createClient()
  const adminCheck = await verifyAdmin()
  if (!adminCheck.isAdminOrOwner) return { success: false, message: adminCheck.error }

  try {
    const { data: currentPost, error: fetchError } = await supabase
      .from("posts")
      .select("slug, status, published_at, hero_image_url, thumbnail_image_url")
      .eq("id", postId)
      .single()
    if (fetchError || !currentPost) return { success: false, message: "Post not found." }

    let heroImageUrl = getFormDataOptionalString(formData, "hero_image_url")
    let thumbnailImageUrl = getFormDataOptionalString(formData, "thumbnail_image_url")

    const heroImageFile = formData.get("hero_image_file") as File | null
    if (heroImageFile && heroImageFile.size > 0) {
      if (currentPost.hero_image_url) {
        await deleteFileFromSupabase(POST_IMAGES_BUCKET, currentPost.hero_image_url)
      }
      heroImageUrl = await uploadFileToSupabase(heroImageFile, POST_IMAGES_BUCKET, "hero")
    } else if (heroImageUrl === "" && currentPost.hero_image_url) {
      await deleteFileFromSupabase(POST_IMAGES_BUCKET, currentPost.hero_image_url)
    }

    const thumbnailImageFile = formData.get("thumbnail_image_file") as File | null
    if (thumbnailImageFile && thumbnailImageFile.size > 0) {
      if (currentPost.thumbnail_image_url) {
        await deleteFileFromSupabase(POST_IMAGES_BUCKET, currentPost.thumbnail_image_url)
      }
      thumbnailImageUrl = await uploadFileToSupabase(thumbnailImageFile, POST_IMAGES_BUCKET, "thumbnail")
    } else if (thumbnailImageUrl === "" && currentPost.thumbnail_image_url) {
      await deleteFileFromSupabase(POST_IMAGES_BUCKET, currentPost.thumbnail_image_url)
    }

    const status = getFormDataString(formData, "status", currentPost.status) as ContentStatus
    const postToUpdate: Partial<DbPost> = {
      title: getFormDataString(formData, "title", currentPost.slug),
      slug: getFormDataString(formData, "slug", currentPost.slug),
      content: getFormDataString(formData, "content"),
      status,
      description: getFormDataOptionalString(formData, "description"),
      hero_image_url: heroImageUrl,
      thumbnail_image_url: thumbnailImageUrl,
      updated_at: new Date().toISOString(),
      // view_count is managed by increment_view_count function
    }

    if (status === "published" && currentPost.status !== "published") {
      postToUpdate.published_at = new Date().toISOString()
    } else if (status !== "published") {
      postToUpdate.published_at = null
    } else {
      postToUpdate.published_at = currentPost.published_at
    }

    const { data: updatedPost, error } = await supabase
      .from("posts")
      .update(postToUpdate)
      .eq("id", postId)
      .select()
      .single()
    if (error) throw error

    const tag_ids = getFormDataNumberArray(formData, "tag_ids[]")
    await supabase.from("post_tags").delete().eq("post_id", postId)
    if (tag_ids.length > 0) {
      const postTagsToInsert = tag_ids.map((tag_id) => ({ post_id: postId, tag_id }))
      const { error: insertTagsError } = await supabase.from("post_tags").insert(postTagsToInsert)
      if (insertTagsError) throw insertTagsError
    }

    revalidatePath("/admin/dashboard/content-management")
    revalidatePath("/admin/dashboard/comment-management")
    revalidatePath("/blog")
    revalidatePath("/tags")
    if (updatedPost.status === "published") revalidatePath(`/blog/${updatedPost.slug}`)
    if (currentPost.slug !== updatedPost.slug && currentPost.status === "published") {
      revalidatePath(`/blog/${currentPost.slug}`)
    }
    return { success: true, message: "Post updated successfully.", post: updatedPost as DbPost }
  } catch (e: any) {
    console.error("Error updating post:", e.message)
    return {
      success: false,
      message: e.code === "23505" ? "A post with this slug already exists." : `Failed to update post: ${e.message}`,
    }
  }
}

export async function deletePost(postId: string): Promise<ActionResult> {
  const supabase = createClient()
  const adminCheck = await verifyAdmin()
  if (!adminCheck.isAdminOrOwner || !adminCheck.userId) {
    return { success: false, message: adminCheck.error || "Admin user ID not found." }
  }
  const actingAdminId = adminCheck.userId

  try {
    const { data: postToDelete, error: fetchError } = await supabase
      .from("posts")
      .select("slug, status, title, hero_image_url, thumbnail_image_url")
      .eq("id", postId)
      .single()

    if (fetchError || !postToDelete) {
      await logAdminAction(supabase, actingAdminId, "admin_action_failed", {
        targetType: "post",
        targetId: postId,
        reason: "Post not found or could not be fetched for deletion.",
        actionAttempted: "delete_post",
      })
      return { success: false, message: "Post not found or could not be fetched." }
    }

    if (postToDelete.hero_image_url) {
      await deleteFileFromSupabase(POST_IMAGES_BUCKET, postToDelete.hero_image_url)
    }
    if (postToDelete.thumbnail_image_url) {
      await deleteFileFromSupabase(POST_IMAGES_BUCKET, postToDelete.thumbnail_image_url)
    }

    const { error } = await supabase.from("posts").delete().eq("id", postId)
    if (error) {
      await logAdminAction(supabase, actingAdminId, "admin_action_failed", {
        targetType: "post",
        targetId: postId,
        reason: `Supabase error: ${error.message}`,
        actionAttempted: "delete_post",
        details: { postTitle: postToDelete.title, postSlug: postToDelete.slug },
      })
      throw error
    }

    await logAdminAction(supabase, actingAdminId, "delete_post", {
      targetType: "post",
      targetId: postId,
      details: { postTitle: postToDelete.title, postSlug: postToDelete.slug, status: postToDelete.status },
    })

    revalidatePath("/admin/dashboard/content-management")
    revalidatePath("/admin/dashboard/comment-management")
    revalidatePath("/blog")
    revalidatePath("/tags")
    if (postToDelete.status === "published" && postToDelete.slug) {
      revalidatePath(`/blog/${postToDelete.slug}`)
    }
    return { success: true, message: "Post deleted successfully." }
  } catch (e: any) {
    console.error("Error deleting post:", e.message)
    if (!adminCheck.userId) {
      console.error("Critical: actingAdminId not available for audit logging failure.")
    } else {
      await logAdminAction(supabase, adminCheck.userId, "admin_action_failed", {
        targetType: "post",
        targetId: postId,
        reason: `Unexpected error: ${e.message}`,
        actionAttempted: "delete_post",
      })
    }
    return { success: false, message: `Failed to delete post: ${e.message}` }
  }
}

export async function adminGetAllProjectsFromDb(): Promise<ActionResult> {
  const supabase = createClient()
  const adminCheck = await verifyAdmin()
  if (!adminCheck.isAdminOrOwner) return { success: false, message: adminCheck.error }
  try {
    const { data, error } = await supabase
      .from("projects")
      .select(`*, author:profiles (id, username, full_name), tags (id, name, slug)`)
      .order("created_at", { ascending: false })
    if (error) throw error
    return { success: true, projects: data as DbProject[] }
  } catch (e: any) {
    console.error("Error fetching projects (admin):", e.message)
    return { success: false, message: "Failed to fetch projects." }
  }
}

export async function createProjectDb(formData: FormData): Promise<ActionResult> {
  const supabase = createClient()
  const adminCheck = await verifyAdmin()
  if (!adminCheck.isAdminOrOwner || !adminCheck.userId) {
    return { success: false, message: adminCheck.error || "User ID not found." }
  }
  try {
    let heroImageUrl = getFormDataOptionalString(formData, "hero_image_url")
    let thumbnailImageUrl = getFormDataOptionalString(formData, "thumbnail_image_url")

    const heroImageFile = formData.get("hero_image_file") as File | null
    if (heroImageFile && heroImageFile.size > 0) {
      heroImageUrl = await uploadFileToSupabase(heroImageFile, PROJECT_IMAGES_BUCKET, "hero")
    }

    const thumbnailImageFile = formData.get("thumbnail_image_file") as File | null
    if (thumbnailImageFile && thumbnailImageFile.size > 0) {
      thumbnailImageUrl = await uploadFileToSupabase(thumbnailImageFile, PROJECT_IMAGES_BUCKET, "thumbnail")
    }

    const projectToInsert = {
      title: getFormDataString(formData, "title"),
      slug: getFormDataString(formData, "slug"),
      status: getFormDataString(formData, "status", "draft") as ContentStatus,
      description: getFormDataOptionalString(formData, "description"),
      long_description: getFormDataOptionalString(formData, "long_description"),
      content: getFormDataOptionalString(formData, "content"),
      hero_image_url: heroImageUrl,
      thumbnail_image_url: thumbnailImageUrl,
      live_url: getFormDataOptionalString(formData, "live_url"),
      repo_url: getFormDataOptionalString(formData, "repo_url"),
      demo_url: getFormDataOptionalString(formData, "demo_url"),
      category: getFormDataOptionalString(formData, "category"),
      featured: getFormDataBoolean(formData, "featured"),
      technologies: getFormDataStringArray(formData, "technologies"),
      author_id: adminCheck.userId,
      published_at: getFormDataString(formData, "status") === "published" ? new Date().toISOString() : null,
      view_count: 0, // Initialize view_count
    }

    const { data: newProject, error } = await supabase.from("projects").insert(projectToInsert).select().single()
    if (error) throw error

    const tag_ids = getFormDataNumberArray(formData, "tag_ids[]")
    if (tag_ids.length > 0) {
      const projectTagsToInsert = tag_ids.map((tag_id) => ({ project_id: newProject.id, tag_id }))
      const { error: tagsError } = await supabase.from("project_tags").insert(projectTagsToInsert)
      if (tagsError) throw tagsError
    }

    revalidatePath("/admin/dashboard/content-management")
    revalidatePath("/projects")
    revalidatePath("/tags")
    if (newProject.status === "published") revalidatePath(`/projects/${newProject.slug}`)
    return { success: true, message: "Project created successfully.", project: newProject as DbProject }
  } catch (e: any) {
    console.error("Error creating project:", e.message)
    return {
      success: false,
      message:
        e.code === "23505" ? "A project with this slug already exists." : `Failed to create project: ${e.message}`,
    }
  }
}

export async function updateProjectDb(projectId: string, formData: FormData): Promise<ActionResult> {
  const supabase = createClient()
  const adminCheck = await verifyAdmin()
  if (!adminCheck.isAdminOrOwner) return { success: false, message: adminCheck.error }

  try {
    const { data: currentProject, error: fetchError } = await supabase
      .from("projects")
      .select("slug, status, published_at, hero_image_url, thumbnail_image_url, technologies, featured")
      .eq("id", projectId)
      .single()
    if (fetchError || !currentProject) return { success: false, message: "Project not found." }

    let heroImageUrl = getFormDataOptionalString(formData, "hero_image_url")
    let thumbnailImageUrl = getFormDataOptionalString(formData, "thumbnail_image_url")

    const heroImageFile = formData.get("hero_image_file") as File | null
    if (heroImageFile && heroImageFile.size > 0) {
      if (currentProject.hero_image_url) {
        await deleteFileFromSupabase(PROJECT_IMAGES_BUCKET, currentProject.hero_image_url)
      }
      heroImageUrl = await uploadFileToSupabase(heroImageFile, PROJECT_IMAGES_BUCKET, "hero")
    } else if (heroImageUrl === "" && currentProject.hero_image_url) {
      await deleteFileFromSupabase(PROJECT_IMAGES_BUCKET, currentProject.hero_image_url)
    }

    const thumbnailImageFile = formData.get("thumbnail_image_file") as File | null
    if (thumbnailImageFile && thumbnailImageFile.size > 0) {
      if (currentProject.thumbnail_image_url) {
        await deleteFileFromSupabase(PROJECT_IMAGES_BUCKET, currentProject.thumbnail_image_url)
      }
      thumbnailImageUrl = await uploadFileToSupabase(thumbnailImageFile, PROJECT_IMAGES_BUCKET, "thumbnail")
    } else if (thumbnailImageUrl === "" && currentProject.thumbnail_image_url) {
      await deleteFileFromSupabase(PROJECT_IMAGES_BUCKET, currentProject.thumbnail_image_url)
    }

    const status = getFormDataString(formData, "status", currentProject.status || "draft") as ContentStatus
    const technologiesValue = formData.get("technologies")
    const technologies =
      typeof technologiesValue === "string"
        ? technologiesValue
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : currentProject.technologies || []

    const projectToUpdate: Partial<DbProject> = {
      title: getFormDataString(formData, "title", currentProject.slug),
      slug: getFormDataString(formData, "slug", currentProject.slug),
      status,
      description: getFormDataOptionalString(formData, "description"),
      long_description: getFormDataOptionalString(formData, "long_description"),
      content: getFormDataOptionalString(formData, "content"),
      hero_image_url: heroImageUrl,
      thumbnail_image_url: thumbnailImageUrl,
      live_url: getFormDataOptionalString(formData, "live_url"),
      repo_url: getFormDataOptionalString(formData, "repo_url"),
      demo_url: getFormDataOptionalString(formData, "demo_url"),
      category: getFormDataOptionalString(formData, "category"),
      featured: getFormDataBoolean(formData, "featured", currentProject.featured || false),
      technologies,
      updated_at: new Date().toISOString(),
      // view_count is managed by increment_view_count function
    }

    if (status === "published" && currentProject.status !== "published") {
      projectToUpdate.published_at = new Date().toISOString()
    } else if (status !== "published") {
      projectToUpdate.published_at = null
    } else {
      projectToUpdate.published_at = currentProject.published_at
    }

    const { data: updatedProject, error } = await supabase
      .from("projects")
      .update(projectToUpdate)
      .eq("id", projectId)
      .select()
      .single()
    if (error) throw error

    const tag_ids = getFormDataNumberArray(formData, "tag_ids[]")
    await supabase.from("project_tags").delete().eq("project_id", projectId)
    if (tag_ids.length > 0) {
      const projectTagsToInsert = tag_ids.map((tag_id) => ({ project_id: projectId, tag_id }))
      const { error: insertTagsError } = await supabase.from("project_tags").insert(projectTagsToInsert)
      if (insertTagsError) throw insertTagsError
    }

    revalidatePath("/admin/dashboard/content-management")
    revalidatePath("/projects")
    revalidatePath("/tags")
    if (updatedProject.status === "published") revalidatePath(`/projects/${updatedProject.slug}`)
    if (currentProject.slug !== updatedProject.slug && currentProject.status === "published") {
      revalidatePath(`/projects/${currentProject.slug}`)
    }
    return { success: true, message: "Project updated successfully.", project: updatedProject as DbProject }
  } catch (e: any) {
    console.error("Error updating project:", e.message)
    return {
      success: false,
      message:
        e.code === "23505" ? "A project with this slug already exists." : `Failed to update project: ${e.message}`,
    }
  }
}

export async function deleteProjectDb(projectId: string): Promise<ActionResult> {
  const supabase = createClient()
  const adminCheck = await verifyAdmin()
  if (!adminCheck.isAdminOrOwner) return { success: false, message: adminCheck.error }
  try {
    const { data: projectToDelete, error: fetchError } = await supabase
      .from("projects")
      .select("slug, status, hero_image_url, thumbnail_image_url")
      .eq("id", projectId)
      .single()

    if (fetchError || !projectToDelete) return { success: false, message: "Project not found." }

    if (projectToDelete.hero_image_url) {
      await deleteFileFromSupabase(PROJECT_IMAGES_BUCKET, projectToDelete.hero_image_url)
    }
    if (projectToDelete.thumbnail_image_url) {
      await deleteFileFromSupabase(PROJECT_IMAGES_BUCKET, projectToDelete.thumbnail_image_url)
    }

    const { error } = await supabase.from("projects").delete().eq("id", projectId)
    if (error) throw error

    revalidatePath("/admin/dashboard/content-management")
    revalidatePath("/projects")
    revalidatePath("/tags")
    if (projectToDelete.status === "published") {
      revalidatePath(`/projects/${projectToDelete.slug}`)
    }
    return { success: true, message: "Project deleted successfully." }
  } catch (e: any) {
    console.error("Error deleting project:", e.message)
    return { success: false, message: `Failed to delete project: ${e.message}` }
  }
}

export async function adminGetAllSeriesDb(): Promise<ActionResult> {
  const supabase = createClient()
  const adminCheck = await verifyAdmin()
  if (!adminCheck.isAdminOrOwner) {
    return { success: false, message: adminCheck.error }
  }
  try {
    const { data, error } = await supabase
      .from("series")
      .select(`*, author:profiles (id, username, full_name)`)
      .order("created_at", { ascending: false })
    if (error) throw error
    return { success: true, seriesList: data as DbSeries[] }
  } catch (e: any) {
    console.error("Error fetching series (admin):", e.message)
    return { success: false, message: "Failed to fetch series." }
  }
}

export async function createSeriesDb(data: SeriesFormData): Promise<ActionResult> {
  const supabase = createClient()
  const adminCheck = await verifyAdmin()
  if (!adminCheck.isAdminOrOwner || !adminCheck.userId) {
    return { success: false, message: adminCheck.error || "User ID not found." }
  }
  try {
    const seriesToInsert = {
      ...data,
      author_id: adminCheck.userId,
    }
    const { data: newSeries, error } = await supabase.from("series").insert(seriesToInsert).select().single()
    if (error) throw error

    revalidatePath("/admin/dashboard/content-management")
    revalidatePath("/series")
    if (newSeries.status === "published") revalidatePath(`/series/${newSeries.slug}`)
    return { success: true, message: "Series created successfully.", seriesSingle: newSeries as DbSeries }
  } catch (e: any) {
    console.error("Error creating series:", e.message)
    return {
      success: false,
      message: e.code === "23505" ? "A series with this slug already exists." : "Failed to create series.",
    }
  }
}

export async function updateSeriesDb(seriesId: string, data: SeriesFormData): Promise<ActionResult> {
  const supabase = createClient()
  const adminCheck = await verifyAdmin()
  if (!adminCheck.isAdminOrOwner) return { success: false, message: adminCheck.error }

  try {
    const { data: currentSeries, error: fetchError } = await supabase
      .from("series")
      .select("slug, status")
      .eq("id", seriesId)
      .single()

    if (fetchError || !currentSeries) return { success: false, message: "Series not found." }

    const oldSlug = currentSeries.slug
    const seriesToUpdate: Partial<DbSeries> = {
      ...data,
      updated_at: new Date().toISOString(),
    }

    const { data: updatedSeries, error } = await supabase
      .from("series")
      .update(seriesToUpdate)
      .eq("id", seriesId)
      .select()
      .single()

    if (error) throw error

    revalidatePath("/admin/dashboard/content-management")
    revalidatePath("/series")
    if (updatedSeries.status === "published") revalidatePath(`/series/${updatedSeries.slug}`)
    if (oldSlug !== updatedSeries.slug && currentSeries.status === "published") {
      revalidatePath(`/series/${oldSlug}`)
    }
    return { success: true, message: "Series updated successfully.", seriesSingle: updatedSeries as DbSeries }
  } catch (e: any) {
    console.error("Error updating series:", e.message)
    return {
      success: false,
      message: e.code === "23505" ? "A series with this slug already exists." : "Failed to update series.",
    }
  }
}

export async function deleteSeriesDb(seriesId: string): Promise<ActionResult> {
  const supabase = createClient()
  const adminCheck = await verifyAdmin()
  if (!adminCheck.isAdminOrOwner) return { success: false, message: adminCheck.error }

  try {
    const { error: disassociateError } = await supabase
      .from("posts")
      .update({ series_id: null, series_part_number: null })
      .eq("series_id", seriesId)

    if (disassociateError) {
      console.error("Error disassociating posts from series:", disassociateError.message)
    }

    const { data: seriesToDelete, error: fetchError } = await supabase
      .from("series")
      .select("slug, status")
      .eq("id", seriesId)
      .single()

    const { error } = await supabase.from("series").delete().eq("id", seriesId)
    if (error) throw error

    revalidatePath("/admin/dashboard/content-management")
    revalidatePath("/series")
    if (seriesToDelete && seriesToDelete.status === "published") {
      revalidatePath(`/series/${seriesToDelete.slug}`)
    }
    return { success: true, message: "Series deleted successfully." }
  } catch (e: any) {
    console.error("Error deleting series:", e.message)
    return { success: false, message: "Failed to delete series. Check if it has associated posts that need handling." }
  }
}

export async function adminGetAllTagsDb(): Promise<ActionResult> {
  const supabase = createClient()
  const adminCheck = await verifyAdmin()
  if (!adminCheck.isAdminOrOwner) return { success: false, message: adminCheck.error }
  try {
    const { data, error } = await supabase.from("tags").select("*").order("name", { ascending: true })
    if (error) throw error
    return { success: true, tags: data as DbTag[] }
  } catch (e: any) {
    console.error("Error fetching tags:", e.message)
    return { success: false, message: "Failed to fetch tags." }
  }
}

export async function createTagDb(data: TagFormData): Promise<ActionResult> {
  const supabase = createClient()
  const adminCheck = await verifyAdmin()
  if (!adminCheck.isAdminOrOwner) return { success: false, message: adminCheck.error }
  try {
    const { data: newTag, error } = await supabase.from("tags").insert(data).select().single()
    if (error) throw error
    revalidatePath("/admin/dashboard/content-management")
    return { success: true, message: "Tag created successfully.", tag: newTag as DbTag }
  } catch (e: any) {
    console.error("Error creating tag:", e.message)
    return {
      success: false,
      message: e.code === "23505" ? "A tag with this name already exists." : "Failed to create tag.",
    }
  }
}

export async function updateTagDb(tagId: string, data: TagFormData): Promise<ActionResult> {
  const supabase = createClient()
  const adminCheck = await verifyAdmin()
  if (!adminCheck.isAdminOrOwner) return { success: false, message: adminCheck.error }
  try {
    const { data: updatedTag, error } = await supabase.from("tags").update(data).eq("id", tagId).select().single()
    if (error) throw error
    revalidatePath("/admin/dashboard/content-management")
    return { success: true, message: "Tag updated successfully.", tag: updatedTag as DbTag }
  } catch (e: any) {
    console.error("Error updating tag:", e.message)
    return {
      success: false,
      message: e.code === "23505" ? "A tag with this name already exists." : "Failed to update tag.",
    }
  }
}

export async function deleteTagDb(tagId: string): Promise<ActionResult> {
  const supabase = createClient()
  const adminCheck = await verifyAdmin()
  if (!adminCheck.isAdminOrOwner) return { success: false, message: adminCheck.error }
  try {
    const { error } = await supabase.from("tags").delete().eq("id", tagId)
    if (error) throw error
    revalidatePath("/admin/dashboard/content-management")
    revalidatePath("/tags")
    return { success: true, message: "Tag deleted successfully." }
  } catch (e: any) {
    console.error("Error deleting tag:", e.message)
    return { success: false, message: "Failed to delete tag." }
  }
}

export async function getPostsForSeries(seriesId: string): Promise<ActionResult> {
  const supabase = createClient()
  const adminCheck = await verifyAdmin()
  if (!adminCheck.isAdminOrOwner) return { success: false, message: adminCheck.error }
  try {
    const { data, error } = await supabase
      .from("posts")
      .select("id, title, slug, series_part_number")
      .eq("series_id", seriesId)
      .order("series_part_number", { ascending: true, nullsLast: true })
    if (error) throw error
    return { success: true, posts: data as DbPost[] }
  } catch (e: any) {
    console.error("Error fetching posts for series:", e.message)
    return { success: false, message: "Failed to fetch posts for series." }
  }
}

export async function getAvailablePostsForSeries(seriesId: string, searchTerm: string): Promise<ActionResult> {
  const supabase = createClient()
  const adminCheck = await verifyAdmin()
  if (!adminCheck.isAdminOrOwner) return { success: false, message: adminCheck.error }
  try {
    let query = supabase
      .from("posts")
      .select("id, title, slug")
      .or(`series_id.is.null,series_id.neq.${seriesId}`)
      .eq("status", "published")
      .limit(10)

    if (searchTerm) {
      query = query.ilike("title", `%${searchTerm}%`)
    }

    const { data, error } = await query
    if (error) throw error
    return { success: true, posts: data as DbPost[] }
  } catch (e: any) {
    console.error("Error fetching available posts:", e.message)
    return { success: false, message: "Failed to fetch available posts." }
  }
}

export async function updateSeriesPosts(seriesId: string, postIdsInOrder: string[]): Promise<ActionResult> {
  const supabase = createClient()
  const adminCheck = await verifyAdmin()
  if (!adminCheck.isAdminOrOwner) return { success: false, message: adminCheck.error }

  try {
    const { data: currentSeriesPosts, error: fetchCurrentError } = await supabase
      .from("posts")
      .select("id")
      .eq("series_id", seriesId)

    if (fetchCurrentError) throw fetchCurrentError

    const currentPostIds = currentSeriesPosts?.map((p) => p.id) || []
    const newPostIdsSet = new Set(postIdsInOrder)

    const postsToDisassociate = currentPostIds.filter((id) => !newPostIdsSet.has(id))
    if (postsToDisassociate.length > 0) {
      const { error: disassociateError } = await supabase
        .from("posts")
        .update({ series_id: null, series_part_number: null })
        .in("id", postsToDisassociate)
      if (disassociateError) throw disassociateError
    }

    if (postIdsInOrder.length > 0) {
      const updates = postIdsInOrder.map((postId, index) =>
        supabase
          .from("posts")
          .update({ series_id: seriesId, series_part_number: index + 1 })
          .eq("id", postId),
      )
      const results = await Promise.all(updates)
      results.forEach((result) => {
        if (result.error) {
          console.error(`Error updating post ${result}: ${result.error.message}`)
        }
      })
    }

    revalidatePath("/admin/dashboard/content-management")
    const { data: seriesData } = await supabase.from("series").select("slug").eq("id", seriesId).single()
    if (seriesData?.slug) {
      revalidatePath(`/series/${seriesData.slug}`)
    }
    postIdsInOrder.forEach(async (postId) => {
      const { data: postData } = await supabase.from("posts").select("slug").eq("id", postId).single()
      if (postData?.slug) revalidatePath(`/blog/${postData.slug}`)
    })
    postsToDisassociate.forEach(async (postId) => {
      const { data: postData } = await supabase.from("posts").select("slug").eq("id", postId).single()
      if (postData?.slug) revalidatePath(`/blog/${postData.slug}`)
    })

    return { success: true, message: "Series posts updated successfully." }
  } catch (e: any) {
    console.error("Error updating series posts:", e.message)
    return { success: false, message: `Failed to update series posts: ${e.message}` }
  }
}

export async function adminGetAllComments(
  filters: {
    status?: "approved" | "unapproved" | "deleted" | "all"
    page?: number
    limit?: number
    searchTerm?: string
  } = {},
): Promise<ActionResult> {
  const supabase = createClient()
  const adminCheck = await verifyAdmin()
  if (!adminCheck.isAdminOrOwner) return { success: false, message: adminCheck.error }

  const { status = "all", page = 1, limit = 20, searchTerm } = filters
  const offset = (page - 1) * limit

  try {
    let query = supabase.from("comments").select(
      `
      *,
      author:profiles!comments_author_id_fkey (id, username, full_name, avatar_url)
    `,
      { count: "exact" },
    )

    if (status === "approved") query = query.eq("is_approved", true).eq("is_deleted", false)
    else if (status === "unapproved") query = query.eq("is_approved", false).eq("is_deleted", false)
    else if (status === "deleted") query = query.eq("is_deleted", true)

    if (searchTerm) {
      query = query.ilike("content", `%${searchTerm}%`)
    }

    query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) throw error
    return { success: true, comments: data as CommentWithAuthor[], message: `Total comments: ${count}` }
  } catch (e: any) {
    console.error("Error fetching comments (admin):", e.message)
    return { success: false, message: "Failed to fetch comments." }
  }
}

export async function adminUpdateCommentStatus(
  commentId: string,
  updates: Partial<Pick<DbComment, "is_approved" | "is_deleted">>,
): Promise<ActionResult> {
  const supabase = createClient()
  const adminCheck = await verifyAdmin()
  if (!adminCheck.isAdminOrOwner || !adminCheck.userId) {
    return { success: false, message: adminCheck.error || "Admin user ID not found." }
  }
  const actingAdminId = adminCheck.userId

  if (Object.keys(updates).length === 0) {
    return { success: false, message: "No updates provided." }
  }

  let oldStatus: Partial<Pick<DbComment, "is_approved" | "is_deleted">> = {}
  try {
    const { data: currentComment, error: fetchErr } = await supabase
      .from("comments")
      .select("is_approved, is_deleted")
      .eq("id", commentId)
      .single()
    if (fetchErr)
      console.warn("Audit log: Could not fetch current comment status for comment:", commentId, fetchErr.message)
    else if (currentComment)
      oldStatus = { is_approved: currentComment.is_approved, is_deleted: currentComment.is_deleted }
  } catch (e) {
    console.warn("Audit log: Exception fetching current comment status:", commentId, e)
  }

  try {
    const { data: updatedComment, error } = await supabase
      .from("comments")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", commentId)
      .select(`*, author:profiles!comments_author_id_fkey (id, username, full_name, avatar_url)`)
      .single()

    if (error) {
      await logAdminAction(supabase, actingAdminId, "admin_action_failed", {
        targetType: "comment",
        targetId: commentId,
        reason: `Supabase error: ${error.message}`,
        actionAttempted: "admin_update_comment_status",
        details: { updates, oldStatus },
      })
      throw error
    }
    if (!updatedComment) {
      await logAdminAction(supabase, actingAdminId, "admin_action_failed", {
        targetType: "comment",
        targetId: commentId,
        reason: "Comment not found after update.",
        actionAttempted: "admin_update_comment_status",
        details: { updates, oldStatus },
      })
      return { success: false, message: "Comment not found after update." }
    }

    let specificAction: AuditAction = "admin_action_failed"
    if (updates.is_approved === true && updates.is_deleted === false) specificAction = "admin_approve_comment"
    else if (updates.is_approved === false && updates.is_deleted === undefined)
      specificAction = "admin_unapprove_comment"
    else if (updates.is_deleted !== undefined) specificAction = "admin_toggle_comment_deletion"

    await logAdminAction(supabase, actingAdminId, specificAction, {
      targetType: "comment",
      targetId: commentId,
      changes: {
        is_approved: { oldValue: oldStatus.is_approved, newValue: updates.is_approved },
        is_deleted: { oldValue: oldStatus.is_deleted, newValue: updates.is_deleted },
      },
      details: { commentContentSnippet: updatedComment.content.substring(0, 50) },
    })

    const { data: postRow } = await supabase.from("posts").select("slug").eq("id", updatedComment.post_id).single()

    if (postRow?.slug) {
      revalidatePath(`/blog/${postRow.slug}`)
    }
    revalidatePath("/admin/dashboard/comment-management")

    return { success: true, message: "Comment status updated.", comment: updatedComment as CommentWithAuthor }
  } catch (e: any) {
    console.error("Error updating comment status (admin):", e.message)
    await logAdminAction(supabase, actingAdminId, "admin_action_failed", {
      targetType: "comment",
      targetId: commentId,
      reason: `Unexpected error: ${e.message}`,
      actionAttempted: "admin_update_comment_status",
      details: { updates, oldStatus },
    })
    return { success: false, message: "Failed to update comment status." }
  }
}

export async function adminEditComment(commentId: string, newContent: string): Promise<ActionResult> {
  const supabase = createClient()
  const adminCheck = await verifyAdmin()
  if (!adminCheck.isAdminOrOwner) return { success: false, message: adminCheck.error }

  if (!newContent.trim()) {
    return { success: false, message: "Comment content cannot be empty." }
  }
  if (newContent.length > 5000) {
    return { success: false, message: "Comment content is too long (max 5000 characters)." }
  }

  try {
    const { data: updatedComment, error } = await supabase
      .from("comments")
      .update({ content: newContent.trim(), updated_at: new Date().toISOString() })
      .eq("id", commentId)
      .select(`*, author:profiles!comments_author_id_fkey (id, username, full_name, avatar_url)`)
      .single()

    if (error) throw error
    if (!updatedComment) return { success: false, message: "Comment not found after update." }

    const { data: postRow } = await supabase.from("posts").select("slug").eq("id", updatedComment.post_id).single()

    if (postRow?.slug) {
      revalidatePath(`/blog/${postRow.slug}`)
    }

    revalidatePath("/admin/dashboard/comment-management")

    return { success: true, message: "Comment content updated.", comment: updatedComment as CommentWithAuthor }
  } catch (e: any) {
    console.error("Error editing comment (admin):", e.message)
    return { success: false, message: "Failed to edit comment." }
  }
}

export async function adminHardDeleteComment(commentId: string): Promise<ActionResult> {
  const supabase = createClient()
  const adminCheck = await verifyAdmin()
  if (!adminCheck.isAdminOrOwner) return { success: false, message: adminCheck.error }

  try {
    const { data: commentData } = await supabase.from("comments").select("post_id").eq("id", commentId).single()

    const { error } = await supabase.from("comments").delete().eq("id", commentId)
    if (error) throw error

    const { data: postRow } = await supabase.from("posts").select("slug").eq("id", commentData.post_id).single()

    if (postRow?.slug) {
      revalidatePath(`/blog/${postRow.slug}`)
    }

    revalidatePath("/admin/dashboard/comment-management")

    return { success: true, message: "Comment permanently deleted." }
  } catch (e: any) {
    console.error("Error hard deleting comment (admin):", e.message)
    return { success: false, message: "Failed to permanently delete comment." }
  }
}

export function adminApproveComment(commentId: string) {
  return adminUpdateCommentStatus(commentId, { is_approved: true, is_deleted: false })
}

export function adminUnapproveComment(commentId: string) {
  return adminUpdateCommentStatus(commentId, { is_approved: false })
}

export function adminToggleCommentDeletion(commentId: string, isDeleted: boolean) {
  return adminUpdateCommentStatus(commentId, { is_deleted: isDeleted })
}

export async function adminGetReportedContent(
  filters: { status?: DbReportedContent["status"] } = {},
): Promise<{ success: boolean; reports?: ReportedContentWithDetails[]; message?: string }> {
  const supabase = createClient()
  const adminCheck = await verifyAdmin()
  if (!adminCheck.isAdminOrOwner) {
    return { success: false, message: adminCheck.error }
  }

  try {
    let query = supabase.from("reported_content").select(
      `
      id,
      content_id,
      content_type,
      reason,
      status,
      created_at,
      reporter:profiles!reported_content_reporter_id_fkey (id, username, full_name),
      comment:comments (
        id,
        content,
        author:profiles (id, username, full_name),
        post:posts (id, slug, title)
      )
    `,
    )

    if (filters.status) {
      query = query.eq("status", filters.status)
    }

    query = query.order("created_at", { ascending: false })

    const { data, error } = await query

    if (error) throw error

    return { success: true, reports: data as any } // Cast as any to bypass complex type check for now
  } catch (e: any) {
    console.error("Error fetching reported content:", e.message)
    return { success: false, message: "Failed to fetch reported content." }
  }
}

export async function adminUpdateReportStatus(
  reportId: string,
  newStatus: DbReportedContent["status"],
  moderatorNotes?: string,
): Promise<ActionResult> {
  const supabase = createClient()
  const adminCheck = await verifyAdmin()
  if (!adminCheck.isAdminOrOwner || !adminCheck.userId) {
    return { success: false, message: adminCheck.error || "Admin user ID not found." }
  }

  try {
    const { data: report, error } = await supabase
      .from("reported_content")
      .update({
        status: newStatus,
        moderator_notes: moderatorNotes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reportId)
      .select()
      .single()

    if (error) throw error

    await logAdminAction(supabase, adminCheck.userId, "admin_update_report_status", {
      targetType: "report",
      targetId: reportId,
      changes: { status: { newValue: newStatus } },
      details: { moderatorNotes },
    })

    revalidatePath("/admin/dashboard")
    return { success: true, message: "Report status updated successfully." }
  } catch (e: any) {
    console.error("Error updating report status:", e.message)
    return { success: false, message: "Failed to update report status." }
  }
}

export async function adminGetAuditLogs(
  filters: {
    page?: number
    limit?: number
    actorId?: string
    action?: string
    targetType?: string
    targetId?: string
  } = {},
): Promise<{ logs: AuditLogWithActor[]; count: number | null; success: boolean; message?: string }> {
  const supabase = createClient()
  const adminCheck = await verifyAdmin()
  if (!adminCheck.isAdminOrOwner) {
    return { success: false, message: adminCheck.error, logs: [], count: 0 }
  }

  const { page = 1, limit = 20, actorId, action, targetType, targetId } = filters
  const offset = (page - 1) * limit

  try {
    let query = supabase.from("audit_logs").select(
      `
      *,
      actor:profiles (id, username, full_name, avatar_url)
    `,
      { count: "exact" },
    )

    if (actorId) query = query.eq("actor_id", actorId)
    if (action) query = query.eq("action", action)
    if (targetType) query = query.eq("target_type", targetType)
    if (targetId) query = query.ilike("target_id", `%${targetId}%`)

    query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) throw error

    return { success: true, logs: data as AuditLogWithActor[], count }
  } catch (e: any) {
    console.error("Error fetching audit logs:", e.message)
    return { success: false, message: "Failed to fetch audit logs.", logs: [], count: 0 }
  }
}

export async function getAdminDashboardAnalytics(): Promise<ActionResult> {
  const supabase = createClient()
  const adminCheck = await verifyAdmin()
  if (!adminCheck.isAdminOrOwner) {
    return { success: false, message: adminCheck.error }
  }

  try {
    const [
      postsCount,
      projectsCount,
      seriesCount,
      usersCount,
      mostCommentedPostsData,
      mostUsedTagsData,
      mostViewedPostsData, // New
      mostViewedProjectsData, // New
    ] = await Promise.all([
      supabase.from("posts").select("id", { count: "exact", head: true }).eq("status", "published"),
      supabase.from("projects").select("id", { count: "exact", head: true }).eq("status", "published"),
      supabase.from("series").select("id", { count: "exact", head: true }).eq("status", "published"),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase
        .from("comments")
        .select("post_id, posts(id, title, slug)")
        .eq("is_approved", true)
        .eq("is_deleted", false)
        .then(async (res) => {
          if (res.error || !res.data) return []
          const commentCounts = res.data.reduce(
            (acc, curr) => {
              if (curr.post_id && curr.posts) {
                acc[curr.post_id] = acc[curr.post_id] || { ...curr.posts, comment_count: 0 }
                acc[curr.post_id].comment_count++
              }
              return acc
            },
            {} as Record<string, { id: string; title: string; slug: string; comment_count: number }>,
          )
          return Object.values(commentCounts)
            .sort((a, b) => b.comment_count - a.comment_count)
            .slice(0, 5)
        }),
      supabase
        .from("post_tags")
        .select("tags(id, name, slug)")
        .then(async (res) => {
          if (res.error || !res.data) return []
          const tagCounts = res.data.reduce(
            (acc, curr) => {
              if (curr.tags) {
                acc[curr.tags.id] = acc[curr.tags.id] || { ...curr.tags, usage_count: 0 }
                acc[curr.tags.id].usage_count++
              }
              return acc
            },
            {} as Record<number, { id: number; name: string; slug: string; usage_count: number }>,
          )
          const { data: projectTagsData, error: projectTagsError } = await supabase
            .from("project_tags")
            .select("tags(id, name, slug)")
          if (!projectTagsError && projectTagsData) {
            projectTagsData.forEach((pt) => {
              if (pt.tags) {
                tagCounts[pt.tags.id] = tagCounts[pt.tags.id] || { ...pt.tags, usage_count: 0 }
                tagCounts[pt.tags.id].usage_count++
              }
            })
          }
          return Object.values(tagCounts)
            .sort((a, b) => b.usage_count - a.usage_count)
            .slice(0, 5)
        }),
      // Fetch most viewed posts
      supabase
        .from("posts")
        .select("id, title, slug, view_count")
        .eq("status", "published")
        .order("view_count", { ascending: false, nullsLast: true })
        .limit(5)
        .then((res) => (res.error || !res.data ? [] : res.data)),
      // Fetch most viewed projects
      supabase
        .from("projects")
        .select("id, title, slug, view_count")
        .eq("status", "published")
        .order("view_count", { ascending: false, nullsLast: true })
        .limit(5)
        .then((res) => (res.error || !res.data ? [] : res.data)),
    ])

    const analytics: AdminDashboardAnalytics = {
      totalPublishedPosts: postsCount.count || 0,
      totalPublishedProjects: projectsCount.count || 0,
      totalPublishedSeries: seriesCount.count || 0,
      totalUsers: usersCount.count || 0,
      mostCommentedPosts: mostCommentedPostsData,
      mostUsedTags: mostUsedTagsData,
      mostViewedPosts: mostViewedPostsData.map((p) => ({ ...p, view_count: p.view_count || 0 })), // Ensure view_count is number
      mostViewedProjects: mostViewedProjectsData.map((p) => ({ ...p, view_count: p.view_count || 0 })), // Ensure view_count is number
    }

    return { success: true, analytics }
  } catch (e: any) {
    console.error("Error fetching admin dashboard analytics:", e.message)
    return { success: false, message: "Failed to fetch dashboard analytics." }
  }
}
