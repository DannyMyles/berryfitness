'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Save, 
  User,
  Mail, 
  Phone, 
  Shield,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { userService } from '../../../api_services/userService'
import { useDocumentTitle } from '../../../lib/useDocumentTitle'

export default function CreateUserPage() {
  useDocumentTitle('Create User')
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [roleId, setRoleId] = useState('')
  
  // Form state - matching backend model
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    isActive: true
  })

  const validateForm = () => {
    if (!formData.name || !formData.name.trim()) {
      throw new Error('Name is required')
    }
    if (!formData.username || !formData.username.trim()) {
      throw new Error('Username is required')
    }
    if (formData.username.length < 3) {
      throw new Error('Username must be at least 3 characters long')
    }
    if (!formData.email) {
      throw new Error('Email is required')
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      throw new Error('Please enter a valid email address')
    }
    if (!formData.password) {
      throw new Error('Password is required')
    }
    if (formData.password.length < 8) {
      throw new Error('Password must be at least 8 characters long')
    }
    // Password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    if (!passwordRegex.test(formData.password)) {
      throw new Error('Password must include uppercase, lowercase, number, and special character')
    }
    if (formData.password !== formData.confirmPassword) {
      throw new Error('Passwords do not match')
    }
    if (!roleId) {
      throw new Error('Please select a role')
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      validateForm()

      // Prepare data for API
      const userData = {
        name: formData.name.trim(),
        username: formData.username.trim().toLowerCase(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        confirmPassword: undefined,
        roleId
      }

      await userService.createUser(userData)
      
      // Redirect on success
      router.push('/admin/users')
      
    } catch (err: any) {
      setError(err.message || 'Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  // Common roles - in production, these would come from the API
  const availableRoles = [
    { id: 'admin', name: 'Administrator' },
    { id: 'user', name: 'User' },
    { id: 'editor', name: 'Editor' },
    { id: 'viewer', name: 'Viewer' }
  ]

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
            <h1 className="text-3xl font-bold text-gray-900">Create New User</h1>
            <p className="mt-1 text-gray-600">Add a new user to the system</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-adventure flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Save className="h-5 w-5" />
            )}
            Create User
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

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="adventure-card">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <span className="p-2 bg-accent-50 rounded-lg">
                <User className="h-5 w-5 text-accent-600" />
              </span>
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="John Doe"
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
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  placeholder="johndoe"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Must be at least 3 characters</p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="adventure-card">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <span className="p-2 bg-blue-50 rounded-lg">
                <Mail className="h-5 w-5 text-blue-600" />
              </span>
              Contact Information
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="john.doe@example.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Role Selection */}
          <div className="adventure-card">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <span className="p-2 bg-purple-50 rounded-lg">
                <Shield className="h-5 w-5 text-purple-600" />
              </span>
              Role & Permissions
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User Role *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {availableRoles.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setRoleId(role.id)}
                    className={`p-3 rounded-lg border transition-colors flex flex-col items-center gap-1 ${
                      roleId === role.id
                        ? 'border-accent-500 bg-accent-50 text-accent-700'
                        : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <Shield className={`h-5 w-5 ${
                      roleId === role.id ? 'text-accent-600' : 'text-gray-400'
                    }`} />
                    <span className="text-sm font-medium">{role.name}</span>
                  </button>
                ))}
              </div>
              {!roleId && (
                <p className="text-xs text-red-500 mt-2">Please select a role</p>
              )}
            </div>

            {/* Role descriptions */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Role Descriptions</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li><strong>Administrator:</strong> Full access to all features and settings</li>
                <li><strong>User:</strong> Standard access to the platform</li>
                <li><strong>Editor:</strong> Can create and edit content</li>
                <li><strong>Viewer:</strong> Read-only access</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Security */}
          <div className="adventure-card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Account Security</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Must be at least 8 characters with uppercase, lowercase, number, and special character
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                  required
                />
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
              </div>
            </div>
          </div>

          {/* Account Status */}
          <div className="adventure-card">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-gray-400" />
              Account Status
            </h3>
            
            <div className="space-y-3">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="active"
                  checked={formData.isActive === true}
                  onChange={() => setFormData({...formData, isActive: true})}
                  className="h-4 w-4 text-accent-500 focus:ring-accent-500"
                />
                <span className="ml-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Active
                </span>
              </label>

              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="inactive"
                  checked={formData.isActive === false}
                  onChange={() => setFormData({...formData, isActive: false})}
                  className="h-4 w-4 text-accent-500 focus:ring-accent-500"
                />
                <span className="ml-2 flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-gray-400" />
                  Inactive
                </span>
              </label>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              Inactive users cannot log in to the system
            </p>
          </div>

          {/* User Preview */}
          <div className="adventure-card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">User Preview</h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(formData.username || 'user')}`}
                  alt="Preview"
                  className="h-12 w-12 rounded-full"
                />
                <div>
                  <p className="font-medium text-gray-900">
                    {formData.name || 'Full Name'}
                  </p>
                  <p className="text-sm text-gray-500">
                    @{formData.username || 'username'}
                  </p>
                </div>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>Email:</span>
                  <span className="font-medium">{formData.email || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Role:</span>
                  <span className={`font-medium ${
                    roleId === 'admin' ? 'text-purple-600' :
                    roleId === 'user' ? 'text-accent-600' :
                    'text-gray-600'
                  }`}>
                    {availableRoles.find(r => r.id === roleId)?.name || 'Not selected'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={`font-medium ${
                    formData.isActive ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {formData.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Password Requirements */}
          <div className="adventure-card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Password Requirements</h3>
            
            <ul className="text-sm space-y-2">
              <li className={`flex items-center gap-2 ${formData.password.length >= 8 ? 'text-green-600' : 'text-gray-500'}`}>
                <span className={formData.password.length >= 8 ? 'text-green-500' : 'text-gray-400'}>
                  {formData.password.length >= 8 ? <CheckCircle className="h-4 w-4" /> : <span className="h-4 w-4 rounded-full border border-current"></span>}
                </span>
                At least 8 characters
              </li>
              <li className={`flex items-center gap-2 ${/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                <span className={/[A-Z]/.test(formData.password) ? 'text-green-500' : 'text-gray-400'}>
                  {/[A-Z]/.test(formData.password) ? <CheckCircle className="h-4 w-4" /> : <span className="h-4 w-4 rounded-full border border-current"></span>}
                </span>
                One uppercase letter
              </li>
              <li className={`flex items-center gap-2 ${/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                <span className={/[a-z]/.test(formData.password) ? 'text-green-500' : 'text-gray-400'}>
                  {/[a-z]/.test(formData.password) ? <CheckCircle className="h-4 w-4" /> : <span className="h-4 w-4 rounded-full border border-current"></span>}
                </span>
                One lowercase letter
              </li>
              <li className={`flex items-center gap-2 ${/\d/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                <span className={/\d/.test(formData.password) ? 'text-green-500' : 'text-gray-400'}>
                  {/\d/.test(formData.password) ? <CheckCircle className="h-4 w-4" /> : <span className="h-4 w-4 rounded-full border border-current"></span>}
                </span>
                One number
              </li>
              <li className={`flex items-center gap-2 ${/[@$!%*?&]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                <span className={/[@$!%*?&]/.test(formData.password) ? 'text-green-500' : 'text-gray-400'}>
                  {/[@$!%*?&]/.test(formData.password) ? <CheckCircle className="h-4 w-4" /> : <span className="h-4 w-4 rounded-full border border-current"></span>}
                </span>
                One special character (@$!%*?&)
              </li>
            </ul>
          </div>
        </div>
      </form>
    </div>
  )
}

