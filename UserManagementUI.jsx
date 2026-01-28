import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, Shield, Lock, Mail, User, X, Check, AlertCircle, LogOut, Key } from 'lucide-react';
import * as userMgmt from './userManagement';

/**
 * Login Component
 */
export function LoginScreen({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = userMgmt.login(username, password);
      onLoginSuccess(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-blue-100 rounded-full mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Tenant Analytics</h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Username or Email
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter username or email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Lock className="w-4 h-4 inline mr-2" />
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter password"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Default credentials:</strong><br />
            Username: <code className="bg-blue-100 px-1 rounded">admin</code><br />
            Password: <code className="bg-blue-100 px-1 rounded">admin123</code>
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * User Management Dashboard
 */
export function UserManagementDashboard({ currentUser, onLogout }) {
  const [users, setUsers] = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadUsers();
    loadStats();
  }, []);

  const loadUsers = () => {
    const allUsers = userMgmt.getUsers();
    setUsers(allUsers.map(u => ({ ...u, password: undefined })));
  };

  const loadStats = () => {
    setStats(userMgmt.getUserStats());
  };

  const handleDeleteUser = (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      userMgmt.deleteUser(userId, currentUser.role);
      loadUsers();
      loadStats();
      alert('User deleted successfully');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleToggleActive = (userId, currentStatus) => {
    try {
      userMgmt.updateUser(userId, { active: !currentStatus }, currentUser.role);
      loadUsers();
      alert(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const canManageUsers = userMgmt.hasPermission(currentUser.role, userMgmt.PERMISSIONS.CREATE_USER);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
                <p className="text-gray-600">Manage users, roles, and permissions</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right mr-4">
                <p className="text-sm text-gray-600">Logged in as</p>
                <p className="font-semibold text-gray-800">{currentUser.fullName || currentUser.username}</p>
                <p className="text-xs text-blue-600">{userMgmt.getRoleLabel(currentUser.role)}</p>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-blue-600" />
                <span className="text-3xl font-bold text-gray-800">{stats.total}</span>
              </div>
              <p className="text-sm text-gray-600">Total Users</p>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <Check className="w-8 h-8 text-green-600" />
                <span className="text-3xl font-bold text-gray-800">{stats.active}</span>
              </div>
              <p className="text-sm text-gray-600">Active</p>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <Shield className="w-8 h-8 text-purple-600" />
                <span className="text-3xl font-bold text-gray-800">{stats.byRole.admin + stats.byRole.super_admin}</span>
              </div>
              <p className="text-sm text-gray-600">Admins</p>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-orange-600" />
                <span className="text-3xl font-bold text-gray-800">{stats.byRole.manager}</span>
              </div>
              <p className="text-sm text-gray-600">Managers</p>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <User className="w-8 h-8 text-gray-600" />
                <span className="text-3xl font-bold text-gray-800">{stats.byRole.analyst + stats.byRole.viewer}</span>
              </div>
              <p className="text-sm text-gray-600">Analysts & Viewers</p>
            </div>
          </div>
        )}

        {/* User List */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">All Users</h2>
            {canManageUsers && (
              <button
                onClick={() => setShowAddUser(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add User
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">User</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Role</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Last Login</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{user.fullName || user.username}</p>
                          <p className="text-xs text-gray-500">@{user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{user.email}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        user.role === userMgmt.USER_ROLES.SUPER_ADMIN ? 'bg-purple-100 text-purple-800' :
                        user.role === userMgmt.USER_ROLES.ADMIN ? 'bg-blue-100 text-blue-800' :
                        user.role === userMgmt.USER_ROLES.MANAGER ? 'bg-green-100 text-green-800' :
                        user.role === userMgmt.USER_ROLES.ANALYST ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {userMgmt.getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {canManageUsers && user.role !== userMgmt.USER_ROLES.SUPER_ADMIN && (
                          <>
                            <button
                              onClick={() => setEditingUser(user)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit user"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleActive(user.id, user.active)}
                              className={`p-2 ${user.active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'} rounded-lg transition-colors`}
                              title={user.active ? 'Deactivate' : 'Activate'}
                            >
                              {user.active ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete user"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit User Modal */}
        {(showAddUser || editingUser) && (
          <UserFormModal
            user={editingUser}
            currentUser={currentUser}
            onClose={() => {
              setShowAddUser(false);
              setEditingUser(null);
            }}
            onSuccess={() => {
              loadUsers();
              loadStats();
              setShowAddUser(false);
              setEditingUser(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

/**
 * User Form Modal (Add/Edit)
 */
function UserFormModal({ user, currentUser, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    password: '',
    fullName: user?.fullName || '',
    role: user?.role || userMgmt.USER_ROLES.VIEWER,
    active: user?.active ?? true
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (user) {
        // Update existing user
        const updates = { ...formData };
        if (!updates.password) delete updates.password; // Don't update password if empty
        
        userMgmt.updateUser(user.id, updates, currentUser.role);
        alert('User updated successfully');
      } else {
        // Create new user
        if (!formData.password) {
          throw new Error('Password is required for new users');
        }
        
        userMgmt.createUser({ ...formData, createdBy: currentUser.id }, currentUser.role);
        alert('User created successfully');
      }
      
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {user ? 'Edit User' : 'Add New User'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username *</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                disabled={!!user} // Can't change username after creation
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password {user ? '(leave empty to keep current)' : '*'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required={!user}
              placeholder={user ? 'Leave empty to keep current password' : 'Enter password'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value={userMgmt.USER_ROLES.VIEWER}>Viewer (Read-only)</option>
              <option value={userMgmt.USER_ROLES.ANALYST}>Analyst (Upload & Analyze)</option>
              <option value={userMgmt.USER_ROLES.MANAGER}>Manager (Manage Clients)</option>
              <option value={userMgmt.USER_ROLES.ADMIN}>Administrator (Full Access)</option>
              {currentUser.role === userMgmt.USER_ROLES.SUPER_ADMIN && (
                <option value={userMgmt.USER_ROLES.SUPER_ADMIN}>Super Administrator</option>
              )}
            </select>
          </div>

          {user && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <label htmlFor="active" className="text-sm font-medium text-gray-700">
                Active Account
              </label>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
            >
              {loading ? 'Saving...' : (user ? 'Update User' : 'Create User')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
