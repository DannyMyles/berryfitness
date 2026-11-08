'use client'

import { Users, MessageSquare, TrendingUp, TrendingDown } from 'lucide-react'
import { useState, useEffect } from 'react'
import { userService } from '@/app/api_services/userService'
import { testimonialService } from '@/app/api_services/testimonialService'

interface DashboardStat {
  name: string
  value: number
  change: string
  trend: 'up' | 'down'
  icon: React.ComponentType<{ className?: string }>
  color: string
}

export default function DashboardStats() {
  const [stats, setStats] = useState<DashboardStat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [animatedStats, setAnimatedStats] = useState<number[]>([])

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch data from all services in parallel
      const [usersResponse, testimonialsResponse] = await Promise.all([
        userService.getAllUsers().catch(() => ({ users: [] })),
        testimonialService.getAllTestimonials().catch(() => ({ testimonials: [] }))
      ])

      const users = usersResponse.users || []
      const testimonials = testimonialsResponse.testimonials || []

      // Calculate stats
      const totalUsers = users.length
      const pendingReviews = testimonials.filter(t => !t.isActive).length

      // Build stats array
      const statsData: DashboardStat[] = [
        {
          name: 'Total Users',
          value: totalUsers,
          change: '+0%',
          trend: 'up',
          icon: Users,
          color: 'bg-gradient-to-r from-accent-500 to-accent-600',
        },
        {
          name: 'Pending Reviews',
          value: pendingReviews,
          change: pendingReviews > 0 ? '+' : '0',
          trend: pendingReviews > 0 ? 'up' : 'up',
          icon: MessageSquare,
          color: 'bg-gradient-to-r from-adventure-fire to-red-500',
        },
      ]

      setStats(statsData)
      setAnimatedStats(statsData.map(() => 0))
    } catch (err) {
      console.error('Error fetching dashboard stats:', err)
      setError('Failed to load stats')
      // Set default values on error
      setStats([
        {
          name: 'Total Users',
          value: 0,
          change: '0%',
          trend: 'up',
          icon: Users,
          color: 'bg-gradient-to-r from-accent-500 to-accent-600',
        },
        {
          name: 'Pending Reviews',
          value: 0,
          change: '0%',
          trend: 'up',
          icon: MessageSquare,
          color: 'bg-gradient-to-r from-adventure-fire to-red-500',
        },
      ])
      setAnimatedStats([0, 0])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  useEffect(() => {
    if (stats.length === 0) return

    const timers = stats.map((stat, index) => {
      const target = stat.value
      const increment = target / 30
      let current = 0

      const timer = setInterval(() => {
        current += increment
        if (current >= target) {
          current = target
          clearInterval(timer)
        }
        setAnimatedStats(prev => {
          const newStats = [...prev]
          newStats[index] = Math.floor(current)
          return newStats
        })
      }, 50)

      return timer
    })

    return () => timers.forEach(timer => clearInterval(timer))
  }, [stats])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="adventure-card animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="h-12 w-12 bg-gray-200 rounded-xl"></div>
            </div>
            <div className="mt-4">
              <div className="h-1 w-full bg-gray-200 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {stats.map((stat, index) => (
        <div key={stat.name} className="adventure-card hover:transform-none">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{stat.name}</p>
              <div className="flex items-baseline mt-2">
                <p className="text-3xl font-bold text-gray-900">
                  {animatedStats[index]?.toLocaleString() || 0}
                </p>
                <span className={`ml-2 flex items-center text-sm font-medium ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.trend === 'up' ? (
                    <TrendingUp className="h-4 w-4 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 mr-1" />
                  )}
                  {stat.change}
                </span>
              </div>
            </div>
            <div className={`${stat.color} p-3 rounded-xl text-white shadow-adventure`}>
              <stat.icon className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4">
            <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full ${
                  stat.trend === 'up' ? 'bg-accent-500' : 'bg-adventure-fire'
                } rounded-full transition-all duration-1000`}
                style={{ width: `${Math.min(100, ((animatedStats[index] || 0) / 50) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

