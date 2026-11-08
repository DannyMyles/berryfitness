'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeft, 
  Save, 
  Mail,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  UserRound,
  Eye,
  EyeOff,
  Clock
} from 'lucide-react'
import toast from 'react-hot-toast'
import { userService, User, UpdateUserRequest } from '@/app/api_services/userService'
import { useDocumentTitle } from '@/app/lib/useDocumentTitle'

interface UserFormData {
  name: string
  username: string
  email: string
  password: string
  role: string
  roleId: string
  isActive: boolean
}

export default function EditUserPage() {
  useDocumentTitle('Edit User')
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'user',
    roleId: '',
    isActive: true
  })

  const [showPassword, setShowPassword] = useState(false)
  const [originalUser, setOriginalUser] = useState<User | null>(null)

  const roles = [
    { value: 'admin', label: 'Administrator' },
    { value: 'user', label: 'User' },
    { value: 'editor', label: 'Editor' },
    { value: 'viewer', label: 'Viewer' }
  ]

  // Fetch user data on mount
  useEffect(() => {
    fetchUser()
  }, [userId])

  const fetchUser = async () => {
    try {
      setLoading(true)
      console.log('Fetching user with ID:', userId)
      
      const response = await userService.getUserById(userId)
      console.log('User response:', response)
      
      if (!response || !response.user) {
        console.error('User is null or undefined')
        throw new Error('User not found')
      }
      
      const user = response.user
      setOriginalUser(user)
      
      // Populate form with existing data
      setFormData({
        name: user.name || '',
        username: user.username || '',
        email: user.email || '',
        password: '', // Don't populate password field
        role: user.role || 'user',
        roleId: typeof user.roleId === 'object' ? user.roleId?._id || '' : '',
        isActive: user.isActive ?? true
      })
    } catch (err: any) {
      console.error('Error fetching user:', err)
      setError(err.message || 'Failed to load user')
      toast.error('Failed to load user')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof UserFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      // Validate form
      if (!formData.name.trim()) {
        throw new Error('Name is required')
      }

      if (!formData.username.trim()) {
        throw new Error('Username is required')
      }

      if (!formData.email.trim()) {
        throw new Error('Email is required')
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        throw new Error('Please enter a valid email address')
      }

      // Prepare data for API
      const updateData: UpdateUserRequest = {
        name: formData.name.trim(),
        username: formData.username.trim(),
        email: formData.email.trim(),
        role: formData.role,
        roleId: formData.roleId || undefined,
        isActive: formData.isActive
      }

      // Only include password if it was changed
      if (formData.password.trim()) {
        if (formData.password.length < 8) {
          throw new Error('Password must be at least 8 characters long')
        }
        updateData.password = formData.password
      }

      console.log('Updating user with data:', updateData)
      await userService.updateUser(userId, updateData)
      toast.success('User updated successfully!')
      router.push('/admin/users')
      
    } catch (err: any) {
      console.error('Error updating user:', err)
      setError(err.message || 'Failed to update user. Please try again.')
      toast.error(err.message || 'Failed to update user')
    } finally {
      setSaving(false)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-50 text-purple-700'
      case 'editor': return 'bg-blue-50 text-blue-700'
      case 'viewer': return 'bg-gray-50 text-gray-700'
      default: return 'bg-accent-50 text-accent-700'
    }
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'
  }

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-gray-400" />
    )
  }

  if (loading) {
    return (
      <div className="space-y-6 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-gray-200 animate-pulse rounded-lg"></div>
            <div>
              <div className="h-8 w-64 bg-gray-200 animate-pulse rounded"></div>
              <div className="h-4 w-48 bg-gray-200 animate-pulse rounded mt-2"></div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-adventure border border-gray-200 p-8">
          <div className="flex justify-center items-center h-64">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-accent-500" />
              <span className="text-gray-600">Loading user details...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-accent-50 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-accent-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit User</h1>
            <p className="mt-1 text-gray-600">Update user account details</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="btn-adventure flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="adventure-card bg-red-50 border-red-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* User Info Card */}
      {originalUser && (
        <div className="adventure-card bg-gradient-to-r from-accent-50 to-white">
          <div className="flex items-center gap-4">
            <img
              src={userService.getAvatarUrl(originalUser)}
              alt={originalUser.name}
              className="h-16 w-16 rounded-full"
            />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{originalUser.name}</h3>
              <p className="text-sm text-gray-500">@{originalUser.username}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(originalUser.role)}`}>
                  {userService.getRoleDisplayName(originalUser.role)}
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(originalUser.isActive)}`}>
                  {getStatusIcon(originalUser.isActive)}
                  {userService.getStatusDisplayName(originalUser.isActive)}
                </span>
              </div>
            </div>
            <div className="ml-auto text-right text-sm text-gray-500">
              <p>Created: {userService.formatDate(originalUser.createdAt)}</p>
              {originalUser.lastLogin && (
                <p className="flex items-center justify-end gap-1 mt-1">
                  <Clock className="h-3 w-3" />
                  Last login: {userService.formatLastLogin(originalUser.lastLogin)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="adventure-card">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <span className="p-2 bg-accent-50 rounded-lg">
                <UserRound className="h-5 w-5 text-accent-600" />
              </span>
              Basic Information
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., John Doe"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  placeholder="e.g., johndoe"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">This will be used for login and display</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="e.g., john.doe@example.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password <span className="text-gray-400 font-normal">(leave blank to keep current)</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Enter new password (min 8 characters)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Minimum 8 characters. Leave blank to keep the current password.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Role & Status */}
          <div className="adventure-card">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <span className="p-2 bg-purple-50 rounded-lg">
                <Shield className="h-5 w-5 text-purple-600" />
              </span>
              Role & Status
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                >
                  {roles.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Admins have full access, Users have limited access
                </p>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Account Status
                </label>
                <div className="space-y-3">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="isActive"
                      checked={formData.isActive === true}
                      onChange={() => handleInputChange('isActive', true)}
                      className="h-4 w-4 text-green-600 focus:ring-green-500"
                    />
                    <div className="ml-3 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-sm font-medium text-gray-700">Active</span>
                    </div>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="isActive"
                      checked={formData.isActive === false}
                      onChange={() => handleInputChange('isActive', false)}
                      className="h-4 w-4 text-gray-600 focus:ring-gray-500"
                    />
                    <div className="ml-3 flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Inactive</span>
                    </div>
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  {formData.isActive 
                    ? 'Active users can log in and access the system'
                    : 'Inactive users cannot log in or access the system'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Account Info */}
          {originalUser && (
            <div className="adventure-card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">User ID:</span>
                  <span className="text-gray-900 font-mono text-xs truncate max-w-[150px]" title={originalUser._id}>
                    {originalUser._id.slice(0, 8)}...
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Created:</span>
                  <span className="text-gray-900">{userService.formatDate(originalUser.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Updated:</span>
                  <span className="text-gray-900">{userService.formatDate(originalUser.updatedAt)}</span>
                </div>
                {originalUser.lastLogin && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Last Login:</span>
                    <span className="text-gray-900">{userService.formatLastLogin(originalUser.lastLogin)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  )
}

