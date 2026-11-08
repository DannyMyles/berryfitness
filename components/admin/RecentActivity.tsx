'use client'

import { Clock, User, FileText, AlertCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useState, useEffect } from 'react'
import { blogService } from '@/app/api_services/blogService'
import { userService } from '@/app/api_services/userService'
import EmptyState from '@/components/ui/EmptyState'

interface Activity {
  id: string
  type: 'blog' | 'user' | 'update'
  title: string
  description: string
  user: string
  time: Date
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
}

interface Blog {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

interface User {
  _id: string
  name: string
  createdAt: string
}

export default function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  const fetchActivities = async () => {
    try {
      setLoading(true)

      // Fetch data from services
      const [blogsResponse, usersResponse] = await Promise.all([
        blogService.getAllBlogs().catch(() => ({ blogs: [] })),
        userService.getAllUsers().catch(() => ({ users: [] }))
      ])

      const blogs = (blogsResponse as { blogs: Blog[] }).blogs || []
      const users = (usersResponse as { users: User[] }).users || []

      const newActivities: Activity[] = []

      // Get most recent blog (published)
      const recentBlog = blogs
        .filter(b => b.createdAt)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]

      if (recentBlog) {
        newActivities.push({
          id: `blog-${recentBlog.id}`,
          type: 'blog',
          title: 'New blog post',
          description: recentBlog.title,
          user: 'Editor',
          time: new Date(recentBlog.createdAt),
          icon: FileText,
          color: 'text-accent-500',
          bgColor: 'bg-accent-50',
        })
      }

      // Get most recent user
      const recentUser = users
        .filter(u => u.createdAt)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]

      if (recentUser) {
        newActivities.push({
          id: `user-${recentUser._id}`,
          type: 'user',
          title: 'New user registration',
          description: `${recentUser.name} joined`,
          user: 'System',
          time: new Date(recentUser.createdAt),
          icon: User,
          color: 'text-green-500',
          bgColor: 'bg-green-50',
        })
      }

      // If no activities found, add a placeholder
      if (newActivities.length === 0) {
        newActivities.push({
          id: 'placeholder-1',
          type: 'blog',
          title: 'Welcome to Admin',
          description: 'Add your first content to see activity',
          user: 'System',
          time: new Date(),
          icon: AlertCircle,
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
        })
      }

      // Sort by time (most recent first)
      newActivities.sort((a, b) => b.time.getTime() - a.time.getTime())

      // Take top 5 activities
      setActivities(newActivities.slice(0, 5))
    } catch (err) {
      console.error('Error fetching activities:', err)
      // Set empty activities on error - the UI will show placeholder
      setActivities([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities()
  }, [])

  if (loading) {
    return (
      <div className="adventure-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
            <p className="text-sm text-gray-600 mt-1">Latest actions in your admin panel</p>
          </div>
          <Clock className="h-6 w-6 text-accent-500 animate-pulse" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-3 p-3 animate-pulse">
              <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="adventure-card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
          <p className="text-sm text-gray-600 mt-1">Latest actions in your admin panel</p>
        </div>
        <Clock className="h-6 w-6 text-accent-500" />
      </div>

      <div className="space-y-4">
        {activities.length === 0 && (
          <EmptyState compact icon={Clock} title="No recent activity" description="New blog posts and user sign-ups will show up here." />
        )}
        {activities.map((activity) => {
          const Icon = activity.icon
          return (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className={`${activity.bgColor} p-2 rounded-lg group-hover:scale-110 transition-transform`}>
                <Icon className={`h-5 w-5 ${activity.color}`} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-600 mt-1 truncate">{activity.description}</p>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {formatDistanceToNow(activity.time, { addSuffix: true })}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 mt-2">
                  <User className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-500">{activity.user}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <button className="w-full text-center text-accent-600 hover:text-accent-700 font-medium py-2 hover:bg-accent-50 rounded-lg transition-colors">
          View All Activity
        </button>
      </div>
    </div>
  )
}

