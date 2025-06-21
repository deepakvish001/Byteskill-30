"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { AdminDashboardAnalytics } from "@/lib/types"
import { BarChart3, Eye, MessageCircle } from "lucide-react"
import Link from "next/link"

interface AnalyticsOverviewProps {
  analytics: AdminDashboardAnalytics
}

export default function AnalyticsOverview({ analytics }: AnalyticsOverviewProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Top-level stats */}
      <StatCard
        title="Published Posts"
        value={analytics.totalPublishedPosts}
        icon={<BarChart3 className="h-5 w-5 text-primary" />}
        link="/blog"
      />
      <StatCard
        title="Published Projects"
        value={analytics.totalPublishedProjects}
        icon={<BarChart3 className="h-5 w-5 text-primary" />}
        link="/projects"
      />
      <StatCard
        title="Published Series"
        value={analytics.totalPublishedSeries}
        icon={<BarChart3 className="h-5 w-5 text-primary" />}
        link="/series"
      />
      <StatCard
        title="Registered Users"
        value={analytics.totalUsers}
        icon={<MessageCircle className="h-5 w-5 text-primary" />}
        link="/admin/dashboard/user-list"
      />

      {/* Most-viewed posts */}
      <TopViewedPosts posts={analytics.mostViewedPosts} />

      {/* Most-viewed projects */}
      <TopViewedProjects projects={analytics.mostViewedProjects} />
    </div>
  )
}

/* ---------- Helper Components ---------- */

function StatCard({
  title,
  value,
  icon,
  link,
}: {
  title: string
  value: number
  icon: React.ReactNode
  link: string
}) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <Link href={link} className="text-2xl font-bold hover:underline">
          {value}
        </Link>
      </CardContent>
    </Card>
  )
}

function TopViewedPosts({
  posts,
}: {
  posts: { id: string; title: string; slug: string; view_count: number }[]
}) {
  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <Eye className="h-4 w-4" /> Most Viewed Posts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {posts.map((p) => (
            <li key={p.id} className="flex justify-between text-sm">
              <Link href={`/blog/${p.slug}`} className="truncate hover:underline">
                {p.title}
              </Link>
              <span className="tabular-nums">{p.view_count ?? 0}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function TopViewedProjects({
  projects,
}: {
  projects: { id: string; title: string; slug: string; view_count: number }[]
}) {
  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-3">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <Eye className="h-4 w-4" /> Most Viewed Projects
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {projects.map((p) => (
            <li key={p.id} className="flex justify-between text-sm">
              <Link href={`/projects/${p.slug}`} className="truncate hover:underline">
                {p.title}
              </Link>
              <span className="tabular-nums">{p.view_count ?? 0}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
