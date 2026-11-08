import { api } from "../lib/api"

// User interface matching the backend model
export interface User {
  _id: string
  name: string
  username: string
  email: string
  role: string
  roleId?: {
    _id: string
    name: string
  }
  isActive: boolean
  lastLogin?: string
  createdAt: string
  updatedAt: string
}

// Response interfaces
export interface UsersResponse {
  users: User[]
}

export interface UserResponse {
  user: User
}

// Create user request
export interface CreateUserRequest {
  name: string
  username: string
  email: string
  password: string
  roleId: string
}

// Update user request
export interface UpdateUserRequest {
  name?: string
  username?: string
  email?: string
  password?: string
  role?: string
  roleId?: string
  isActive?: boolean
}

// User statistics
export interface UserStats {
  total: number
  active: number
  inactive: number
  admins: number
  regularUsers: number
}

export const userService = {
  // Get all users (admin only)
  getAllUsers: async (): Promise<UsersResponse> => {
    try {
      return await api.admin.users.getAll()
    } catch (error) {
      console.error('Error fetching users:', error)
      throw error
    }
  },

  // Get single user by ID
  getUserById: async (id: string): Promise<UserResponse> => {
    try {
      return await api.admin.users.getById(id)
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error)
      throw error
    }
  },

  // Create new user (admin only)
  createUser: async (data: CreateUserRequest): Promise<UserResponse> => {
    try {
      return await api.admin.users.create(data)
    } catch (error) {
      console.error('Error creating user:', error)
      throw error
    }
  },

  // Update user
  updateUser: async (id: string, data: UpdateUserRequest): Promise<UserResponse> => {
    try {
      return await api.admin.users.update(id, data)
    } catch (error) {
      console.error(`Error updating user ${id}:`, error)
      throw error
    }
  },

  // Delete user (admin only)
  deleteUser: async (id: string): Promise<void> => {
    try {
      return await api.admin.users.delete(id)
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error)
      throw error
    }
  },

  // Calculate user statistics
  calculateStats: (users: User[]): UserStats => {
    const total = users.length
    const active = users.filter(u => u.isActive).length
    const inactive = total - active
    const admins = users.filter(u => u.role === 'admin').length
    const regularUsers = total - admins

    return {
      total,
      active,
      inactive,
      admins,
      regularUsers
    }
  },

  // Format date for display
  formatDate: (dateString: string): string => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  },

  // Format last login date
  formatLastLogin: (dateString?: string): string => {
    if (!dateString) return 'Never'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Unknown'
    }
  },

  // Get role display name
  getRoleDisplayName: (role: string): string => {
    const roleNames: Record<string, string> = {
      admin: 'Administrator',
      user: 'User',
      editor: 'Editor',
      viewer: 'Viewer'
    }
    return roleNames[role] || role.charAt(0).toUpperCase() + role.slice(1)
  },

  // Get role color for UI
  getRoleColor: (role: string): string => {
    switch (role) {
      case 'admin': return 'bg-purple-50 text-purple-700'
      case 'editor': return 'bg-blue-50 text-blue-700'
      case 'viewer': return 'bg-gray-50 text-gray-700'
      default: return 'bg-accent-50 text-accent-700'
    }
  },

  // Get status color for UI
  getStatusColor: (isActive: boolean): string => {
    return isActive ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'
  },

  // Get status display name
  getStatusDisplayName: (isActive: boolean): string => {
    return isActive ? 'Active' : 'Inactive'
  },

  // Get avatar URL
  getAvatarUrl: (user: User): string => {
    // Generate avatar based on username
    const initials = user.username
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
    
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.username)}`
  },

  // Search users locally
  searchUsers: (users: User[], query: string): User[] => {
    const lowerQuery = query.toLowerCase()
    return users.filter(user =>
      user.name.toLowerCase().includes(lowerQuery) ||
      user.email.toLowerCase().includes(lowerQuery) ||
      user.username.toLowerCase().includes(lowerQuery)
    )
  },

  // Filter users by role
  filterByRole: (users: User[], role: string): User[] => {
    if (role === 'all') return users
    return users.filter(user => user.role === role)
  },

  // Filter users by status
  filterByStatus: (users: User[], status: 'active' | 'inactive' | 'all'): User[] => {
    if (status === 'all') return users
    return users.filter(user => 
      status === 'active' ? user.isActive : !user.isActive
    )
  },

  // Sort users
  sortUsers: (
    users: User[], 
    sortBy: 'name' | 'date' | 'role' | 'status',
    sortOrder: 'asc' | 'desc'
  ): User[] => {
    const sorted = [...users].sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'role':
          comparison = a.role.localeCompare(b.role)
          break
        case 'status':
          comparison = (a.isActive === b.isActive) ? 0 : a.isActive ? 1 : -1
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })
    
    return sorted
  }
}

