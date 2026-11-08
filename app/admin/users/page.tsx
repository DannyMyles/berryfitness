'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  Plus,
  Search,
  Filter,
  Mail, 
  Shield,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Download,
  AlertCircle,
  RefreshCw,
  User as UserIcon,
  Loader2,
  X
} from 'lucide-react'
import { User, userService } from '@/app/api_services/userService'
import EmptyState from '@/components/ui/EmptyState'
import BulkActionBar from '@/components/ui/BulkActionBar'
import BulkDeleteModal from '@/components/ui/BulkDeleteModal'
import { useBulkSelection } from '@/app/lib/useBulkSelection'
import { runBulkDelete } from '@/app/lib/bulkDelete'
import toast from 'react-hot-toast'
import { useDocumentTitle } from '@/app/lib/useDocumentTitle'

export default function UsersManagementPage() {
  useDocumentTitle('Users')
  const router = useRouter()
  const { data: session, status: authStatus } = useSession()
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'role' | 'status'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  
  // Data states
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)

  // Check authentication status
  useEffect(() => {
    // Wait for auth to be determined
    if (authStatus === 'loading') {
      setIsAuthLoading(true)
      return
    }

    // If not authenticated, redirect to login
    if (authStatus === 'unauthenticated') {
      setIsAuthLoading(false)
      setError('You are not logged in. Please log in to access this page.')
      router.push('/login?callbackUrl=/admin/users')
      return
    }

    // Authenticated - proceed with fetching
    setIsAuthLoading(false)
  }, [authStatus, router])

  // Fetch users from API
  const fetchUsers = useCallback(async () => {
    // Don't fetch if still loading auth
    if (isAuthLoading || authStatus !== 'authenticated') {
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await userService.getAllUsers()
      setUsers(response.users)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users')
      console.error('Error fetching users:', err)
      
      // Check if it's an auth error
      if (err.message?.includes('No authentication token') || 
          err.message?.includes('Session expired') ||
          err.message?.includes('log in')) {
        // Sign out and redirect to login
        signOut({ callbackUrl: '/login' })
      }
    } finally {
      setLoading(false)
    }
  }, [isAuthLoading, authStatus])

  // Initial fetch after auth is ready
  useEffect(() => {
    if (!isAuthLoading && authStatus === 'authenticated') {
      fetchUsers()
    }
  }, [isAuthLoading, authStatus, fetchUsers])

  // Filter and sort users
  const filteredUsers = users
    .filter(user => {
      const matchesSearch = 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = 
        filter === 'all' || 
        (filter === 'active' && user.isActive) ||
        (filter === 'inactive' && !user.isActive)
      
      const matchesRole = roleFilter === 'all' || user.role === roleFilter
      
      return matchesSearch && matchesStatus && matchesRole
    })
    .sort((a, b) => {
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

  // Own account is never selectable for bulk actions — toggleAll/isAllSelected
  // are computed only over other users, so there's no way to bulk-delete self.
  const selectableUsers = filteredUsers.filter((u) => u._id !== session?.user?.id)
  const bulk = useBulkSelection(selectableUsers, (u) => u._id)
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [deleting, setDeleting] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowDeleteModal(false)
      }
    }
    if (showDeleteModal) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showDeleteModal])

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return
    setDeleting(true)
    try {
      await userService.deleteUser(userToDelete._id)
      setUsers((prev) => prev.filter((u) => u._id !== userToDelete._id))
      toast.success('User deleted')
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete user')
    } finally {
      setDeleting(false)
      setShowDeleteModal(false)
      setUserToDelete(null)
    }
  }

  const handleBulkDeleteConfirm = async () => {
    setBulkDeleting(true)
    const ids = Array.from(bulk.selectedIds)
    const { succeededIds, failedIds } = await runBulkDelete(ids, (id) => userService.deleteUser(id))
    if (succeededIds.length > 0) {
      setUsers((prev) => prev.filter((u) => !succeededIds.includes(u._id)))
    }
    if (failedIds.length === 0) {
      toast.success(`${succeededIds.length} user${succeededIds.length === 1 ? '' : 's'} deleted`)
    } else if (succeededIds.length === 0) {
      toast.error(`Failed to delete ${failedIds.length} user${failedIds.length === 1 ? '' : 's'}`)
    } else {
      toast.success(`${succeededIds.length} deleted, ${failedIds.length} failed`)
    }
    bulk.clear()
    setBulkDeleting(false)
    setShowBulkDeleteModal(false)
  }

  const handleToggleStatus = async (id: string) => {
    const user = users.find(u => u._id === id)
    if (!user) return
    
    try {
      const updatedUser = await userService.updateUser(id, { 
        isActive: !user.isActive 
      })
      setUsers(users.map(u => 
        u._id === id ? { ...u, ...updatedUser.user } : u
      ))
    } catch (err: any) {
      alert(err.message || 'Failed to update user status')
    }
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'status-badge status-badge-active' : 'status-badge status-badge-inactive'
  }

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-gray-400" />
    )
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800'
      case 'editor': return 'bg-blue-100 text-blue-800'
      case 'viewer': return 'bg-gray-100 text-gray-800'
      default: return 'bg-green-100 text-green-800'
    }
  }

  // Calculate stats
  const stats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    inactive: users.filter(u => !u.isActive).length,
    admins: users.filter(u => u.role === 'admin').length,
    regularUsers: users.filter(u => u.role === 'user').length
  }

  // Export users to CSV
  const handleExport = () => {
    const headers = ['Name', 'Username', 'Email', 'Role', 'Status', 'Created At']
    const rows = filteredUsers.map(user => [
      user.name,
      user.username,
      user.email,
      user.role,
      user.isActive ? 'Active' : 'Inactive',
      userService.formatDate(user.createdAt)
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Show auth loading state
  if (isAuthLoading || authStatus === 'loading') {
    return (
      <div className="space-y-6 p-4">
        <div className="bg-white rounded-xl shadow-adventure border border-gray-200 p-12 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-accent-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Authenticating...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="mt-1 text-gray-600">Manage and organize system users</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          <button
            onClick={fetchUsers}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <Link
            href="/admin/users/create"
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add User
          </Link>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="adventure-card bg-red-50 border-red-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="text-red-700">{error}</p>
            </div>
            <button
              onClick={fetchUsers}
              className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="admin-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <UserIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="admin-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.active}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="admin-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inactive</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.inactive}</p>
            </div>
            <div className="p-3 bg-gray-200 rounded-lg">
              <XCircle className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        </div>
        
        <div className="admin-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Admins</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.admins}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="admin-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Regular Users</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.regularUsers}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <UserIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      <BulkActionBar
        selectedCount={bulk.selectedCount}
        itemLabel="user"
        onClear={bulk.clear}
        onDeleteClick={() => setShowBulkDeleteModal(true)}
        extraActions={
          <button
            onClick={() => {
              const userId = Array.from(bulk.selectedIds)[0]
              if (userId) handleToggleStatus(userId)
            }}
            className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
          >
            Toggle Status
          </button>
        }
      />

      <BulkDeleteModal
        open={showBulkDeleteModal}
        count={bulk.selectedCount}
        itemLabel="user"
        deleting={bulkDeleting}
        onCancel={() => setShowBulkDeleteModal(false)}
        onConfirm={handleBulkDeleteConfirm}
      />

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Confirm Deletion</h3>
              <button onClick={() => setShowDeleteModal(false)} className="p-2 hover:bg-gray-100 rounded-lg" disabled={deleting}>
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              {userToDelete && (
                <div className="p-4 bg-gray-50 rounded-lg flex items-center gap-3">
                  <img
                    src={userService.getAvatarUrl(userToDelete)}
                    alt={userToDelete.name}
                    className="h-12 w-12 rounded-full bg-gray-200 flex-shrink-0"
                  />
                  <div>
                    <h4 className="font-medium text-gray-900">{userToDelete.name}</h4>
                    <p className="text-sm text-gray-500">{userToDelete.email}</p>
                  </div>
                </div>
              )}
              <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                    <Trash2 className="h-5 w-5 text-red-600" />
                  </div>
                  <p className="text-sm text-red-700">This user will be permanently deleted.</p>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="flex-1 px-4 py-3 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 rounded-lg font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by name, email, or username..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
          
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [sort, order] = e.target.value.split('-')
              setSortBy(sort as any)
              setSortOrder(order as any)
            }}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
          >
            <option value="name-asc">Sort by Name (A-Z)</option>
            <option value="name-desc">Sort by Name (Z-A)</option>
            <option value="date-desc">Sort by Newest</option>
            <option value="date-asc">Sort by Oldest</option>
            <option value="role-asc">Sort by Role</option>
            <option value="status-asc">Sort by Status</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-xl shadow-adventure border border-gray-200 p-12 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-accent-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      )}

      {/* Users Table */}
      {!loading && (
        <div className="bg-white rounded-xl shadow-card border border-gray-200 overflow-hidden">
          {filteredUsers.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="admin-table">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-4 w-12">
                        <input
                          type="checkbox"
                          checked={bulk.isAllSelected}
                          onChange={bulk.toggleAll}
                          className="h-4 w-4 text-[#007AA9] focus:ring-[#007AA9] rounded"
                        />
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">User</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Contact</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Role</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Joined</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 w-32">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          {user._id === session?.user?.id ? (
                            <input
                              type="checkbox"
                              checked={false}
                              disabled
                              title="You can't select your own account"
                              className="h-4 w-4 rounded opacity-40 cursor-not-allowed"
                            />
                          ) : (
                            <input
                              type="checkbox"
                              checked={bulk.isSelected(user._id)}
                              onChange={() => bulk.toggle(user._id)}
                              className="h-4 w-4 text-[#007AA9] focus:ring-[#007AA9] rounded"
                            />
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={userService.getAvatarUrl(user)}
                              alt={user.name}
                              className="h-10 w-10 rounded-full bg-gray-200"
                            />
                            <div>
                              <p className="font-medium text-gray-900">
                                {user.name}
                                {user.isActive && (
                                  <span className="ml-2 inline-flex items-center text-xs text-green-600 font-medium">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Verified
                                  </span>
                                )}
                              </p>
                              <p className="text-sm text-gray-500">@{user.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <a 
                              href={`mailto:${user.email}`}
                              className="text-sm text-gray-700 hover:text-[#007AA9] transition-colors"
                            >
                              {user.email}
                            </a>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(user.role)}`}>
                            {userService.getRoleDisplayName(user.role)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleToggleStatus(user._id)}
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(user.isActive)}`}
                          >
                            {getStatusIcon(user.isActive)}
                            {userService.getStatusDisplayName(user.isActive)}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {userService.formatDate(user.createdAt)}
                          </div>
                          {user.lastLogin && (
                            <div className="text-xs text-gray-500">
                              Last: {userService.formatLastLogin(user.lastLogin)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <Link
                              href={`/admin/users/edit/${user._id}`}
                              className="p-2 hover:bg-sky-100 rounded-lg transition-colors text-[#007AA9]"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                            
                            <button
                              onClick={() => handleDeleteClick(user)}
                              className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              <div className="border-t border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredUsers.length}</span> of{' '}
                    <span className="font-medium">{filteredUsers.length}</span> users
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      Previous
                    </button>
                    <button className="px-3 py-1.5 border border-gray-300 rounded-lg bg-accent-50 text-accent-700 border-accent-200">
                      1
                    </button>
                    <button className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : searchQuery || filter !== 'all' || roleFilter !== 'all' ? (
            <EmptyState
              icon={Search}
              title="No users match your filters"
              description="Try adjusting your search or filter criteria."
              action={{
                label: 'Clear Filters',
                onClick: () => {
                  setSearchQuery('')
                  setFilter('all')
                  setRoleFilter('all')
                },
              }}
            />
          ) : (
            <EmptyState
              icon={UserIcon}
              title="No users yet"
              description="Get started by creating a new user."
              action={{ label: 'Add User', icon: Plus, href: '/admin/users/create' }}
            />
          )}
        </div>
      )}
    </div>
  )
}

