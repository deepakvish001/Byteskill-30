"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import PostEditor from "./post-editor"
import PostList from "./post-list"
import ProjectEditor from "./project-editor"
import ProjectList from "./project-list"
import SeriesEditor from "./series-editor"
import SeriesList from "./series-list"
import TagManager from "./tag-manager" // Import TagManager
import type { DbPost, DbProject, DbSeries } from "@/lib/types"
import { useUser } from "@/app/contexts/UserContext"

export default function ContentManagement() {
  const [activeTab, setActiveTab] = useState("posts")
  const { user: currentUserProfile } = useUser()

  // State for editors
  const [editingPost, setEditingPost] = useState<DbPost | null>(null)
  const [showPostEditor, setShowPostEditor] = useState(false)
  const [editingProject, setEditingProject] = useState<DbProject | null>(null)
  const [showProjectEditor, setShowProjectEditor] = useState(false)
  const [editingSeries, setEditingSeries] = useState<DbSeries | null>(null)
  const [showSeriesEditor, setShowSeriesEditor] = useState(false)

  // Handlers for Posts
  const handleEditPost = (post: DbPost) => {
    setEditingPost(post)
    setShowPostEditor(true)
  }
  const handleCreateNewPost = () => {
    setEditingPost(null)
    setShowPostEditor(true)
  }
  const handlePostEditorClose = () => {
    setShowPostEditor(false)
    setEditingPost(null)
  }

  // Handlers for Projects
  const handleEditProject = (project: DbProject) => {
    setEditingProject(project)
    setShowProjectEditor(true)
  }
  const handleCreateNewProject = () => {
    setEditingProject(null)
    setShowProjectEditor(true)
  }
  const handleProjectEditorClose = () => {
    setShowProjectEditor(false)
    setEditingProject(null)
  }

  // Handlers for Series
  const handleEditSeries = (series: DbSeries) => {
    setEditingSeries(series)
    setShowSeriesEditor(true)
  }
  const handleCreateNewSeries = () => {
    setEditingSeries(null)
    setShowSeriesEditor(true)
  }
  const handleSeriesEditorClose = () => {
    setShowSeriesEditor(false)
    setEditingSeries(null)
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    // Close all editors when switching tabs to prevent state conflicts
    setShowPostEditor(false)
    setEditingPost(null)
    setShowProjectEditor(false)
    setEditingProject(null)
    setShowSeriesEditor(false)
    setEditingSeries(null)
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-4 mb-4">
        <TabsTrigger value="posts">Posts</TabsTrigger>
        <TabsTrigger value="projects">Projects</TabsTrigger>
        <TabsTrigger value="series">Series</TabsTrigger>
        <TabsTrigger value="tags">Tags</TabsTrigger>
      </TabsList>

      <TabsContent value="posts">
        {showPostEditor ? (
          <PostEditor initialData={editingPost} onClose={handlePostEditorClose} onPostSaved={handlePostEditorClose} />
        ) : (
          <PostList
            onEditPost={handleEditPost}
            onCreateNewPost={handleCreateNewPost}
            currentUser={currentUserProfile}
          />
        )}
      </TabsContent>
      <TabsContent value="projects">
        {showProjectEditor ? (
          <ProjectEditor
            initialData={editingProject}
            onClose={handleProjectEditorClose}
            onProjectSaved={handleProjectEditorClose}
          />
        ) : (
          <ProjectList
            onEditProject={handleEditProject}
            onCreateNewProject={handleCreateNewProject}
            currentUser={currentUserProfile}
          />
        )}
      </TabsContent>
      <TabsContent value="series">
        {showSeriesEditor ? (
          <SeriesEditor
            initialData={editingSeries}
            onClose={handleSeriesEditorClose}
            onSeriesSaved={handleSeriesEditorClose}
          />
        ) : (
          <SeriesList
            onEditSeries={handleEditSeries}
            onCreateNewSeries={handleCreateNewSeries}
            currentUser={currentUserProfile}
          />
        )}
      </TabsContent>
      <TabsContent value="tags">
        <TagManager />
      </TabsContent>
    </Tabs>
  )
}
