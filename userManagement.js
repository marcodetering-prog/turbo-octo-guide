// userManagement.js - User Authentication and Management Module

/**
 * User Roles and Permissions System
 */

// User roles with different permission levels
export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',     // Full access to everything
  ADMIN: 'admin',                  // Manage users and clients
  MANAGER: 'manager',              // View all clients, manage assigned clients
  ANALYST: 'analyst',              // View-only access to assigned clients
  VIEWER: 'viewer'                 // Read-only access
};

// Permissions mapping
export const PERMISSIONS = {
  // User management
  CREATE_USER: 'create_user',
  EDIT_USER: 'edit_user',
  DELETE_USER: 'delete_user',
  VIEW_USERS: 'view_users',
  ASSIGN_ROLES: 'assign_roles',
  
  // Client management
  CREATE_CLIENT: 'create_client',
  EDIT_CLIENT: 'edit_client',
  DELETE_CLIENT: 'delete_client',
  VIEW_ALL_CLIENTS: 'view_all_clients',
  VIEW_ASSIGNED_CLIENTS: 'view_assigned_clients',
  
  // Data management
  UPLOAD_DATA: 'upload_data',
  DELETE_DATA: 'delete_data',
  EXPORT_DATA: 'export_data',
  
  // Analytics
  VIEW_ANALYTICS: 'view_analytics',
  COMPARE_PERIODS: 'compare_periods',
  GENERATE_REPORTS: 'generate_reports'
};

// Role-based permissions
const ROLE_PERMISSIONS = {
  [USER_ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS), // All permissions
  
  [USER_ROLES.ADMIN]: [
    PERMISSIONS.CREATE_USER,
    PERMISSIONS.EDIT_USER,
    PERMISSIONS.DELETE_USER,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.CREATE_CLIENT,
    PERMISSIONS.EDIT_CLIENT,
    PERMISSIONS.DELETE_CLIENT,
    PERMISSIONS.VIEW_ALL_CLIENTS,
    PERMISSIONS.UPLOAD_DATA,
    PERMISSIONS.DELETE_DATA,
    PERMISSIONS.EXPORT_DATA,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.COMPARE_PERIODS,
    PERMISSIONS.GENERATE_REPORTS
  ],
  
  [USER_ROLES.MANAGER]: [
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.EDIT_CLIENT,
    PERMISSIONS.VIEW_ALL_CLIENTS,
    PERMISSIONS.VIEW_ASSIGNED_CLIENTS,
    PERMISSIONS.UPLOAD_DATA,
    PERMISSIONS.EXPORT_DATA,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.COMPARE_PERIODS,
    PERMISSIONS.GENERATE_REPORTS
  ],
  
  [USER_ROLES.ANALYST]: [
    PERMISSIONS.VIEW_ASSIGNED_CLIENTS,
    PERMISSIONS.UPLOAD_DATA,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.COMPARE_PERIODS,
    PERMISSIONS.GENERATE_REPORTS
  ],
  
  [USER_ROLES.VIEWER]: [
    PERMISSIONS.VIEW_ASSIGNED_CLIENTS,
    PERMISSIONS.VIEW_ANALYTICS
  ]
};

/**
 * User Management Functions
 */

const STORAGE_KEYS = {
  USERS: 'tenant_analytics_users',
  CURRENT_USER: 'tenant_analytics_current_user',
  SESSIONS: 'tenant_analytics_sessions'
};

/**
 * Initialize user management system
 */
export const initializeUserManagement = () => {
  try {
    // Create default super admin if no users exist
    const users = getUsers();
    if (users.length === 0) {
      const defaultAdmin = {
        id: Date.now().toString(),
        username: 'admin',
        email: 'admin@example.com',
        password: hashPassword('admin123'), // Default password
        role: USER_ROLES.SUPER_ADMIN,
        fullName: 'System Administrator',
        createdAt: new Date().toISOString(),
        active: true,
        assignedClients: [], // Empty means access to all
        lastLogin: null
      };
      
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([defaultAdmin]));
      console.log('Default admin user created: admin / admin123');
    }
    return true;
  } catch (error) {
    console.error('Error initializing user management:', error);
    return false;
  }
};

/**
 * Simple password hashing (for demo - use bcrypt in production!)
 */
const hashPassword = (password) => {
  // In production, use proper hashing like bcrypt
  // This is just for demo purposes
  return btoa(password + 'salt_key_12345');
};

const verifyPassword = (password, hashedPassword) => {
  return hashPassword(password) === hashedPassword;
};

/**
 * User CRUD operations
 */

export const getUsers = () => {
  try {
    const users = localStorage.getItem(STORAGE_KEYS.USERS);
    return users ? JSON.parse(users) : [];
  } catch (error) {
    console.error('Error getting users:', error);
    return [];
  }
};

export const getUserById = (userId) => {
  const users = getUsers();
  return users.find(u => u.id === userId) || null;
};

export const createUser = (userData, creatorRole) => {
  try {
    // Check permissions
    if (!hasPermission(creatorRole, PERMISSIONS.CREATE_USER)) {
      throw new Error('Permission denied');
    }
    
    const users = getUsers();
    
    // Check if username/email already exists
    if (users.some(u => u.username === userData.username)) {
      throw new Error('Username already exists');
    }
    if (users.some(u => u.email === userData.email)) {
      throw new Error('Email already exists');
    }
    
    const newUser = {
      id: Date.now().toString(),
      username: userData.username,
      email: userData.email,
      password: hashPassword(userData.password),
      role: userData.role || USER_ROLES.VIEWER,
      fullName: userData.fullName || '',
      createdAt: new Date().toISOString(),
      active: true,
      assignedClients: userData.assignedClients || [],
      lastLogin: null,
      createdBy: userData.createdBy || null
    };
    
    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    
    return { ...newUser, password: undefined }; // Don't return password
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const updateUser = (userId, updates, updaterRole) => {
  try {
    // Check permissions
    if (!hasPermission(updaterRole, PERMISSIONS.EDIT_USER)) {
      throw new Error('Permission denied');
    }
    
    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    
    // Don't allow changing super admin role unless updater is super admin
    if (users[userIndex].role === USER_ROLES.SUPER_ADMIN && updaterRole !== USER_ROLES.SUPER_ADMIN) {
      throw new Error('Cannot modify super admin');
    }
    
    // Hash password if being updated
    if (updates.password) {
      updates.password = hashPassword(updates.password);
    }
    
    users[userIndex] = {
      ...users[userIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    
    return { ...users[userIndex], password: undefined };
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const deleteUser = (userId, deleterRole) => {
  try {
    // Check permissions
    if (!hasPermission(deleterRole, PERMISSIONS.DELETE_USER)) {
      throw new Error('Permission denied');
    }
    
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Don't allow deleting super admin
    if (user.role === USER_ROLES.SUPER_ADMIN) {
      throw new Error('Cannot delete super admin');
    }
    
    const filteredUsers = users.filter(u => u.id !== userId);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filteredUsers));
    
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

/**
 * Authentication functions
 */

export const login = (username, password) => {
  try {
    const users = getUsers();
    const user = users.find(u => u.username === username || u.email === username);
    
    if (!user) {
      throw new Error('Invalid username or password');
    }
    
    if (!user.active) {
      throw new Error('Account is deactivated');
    }
    
    if (!verifyPassword(password, user.password)) {
      throw new Error('Invalid username or password');
    }
    
    // Update last login
    updateUser(user.id, { lastLogin: new Date().toISOString() }, user.role);
    
    // Create session
    const session = {
      userId: user.id,
      username: user.username,
      role: user.role,
      loginTime: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };
    
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(session));
    
    return { ...user, password: undefined };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const logout = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
};

export const getCurrentUser = () => {
  try {
    const session = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!session) return null;
    
    const sessionData = JSON.parse(session);
    
    // Check if session expired
    if (new Date(sessionData.expiresAt) < new Date()) {
      logout();
      return null;
    }
    
    // Get full user data
    const user = getUserById(sessionData.userId);
    return user ? { ...user, password: undefined } : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

export const isAuthenticated = () => {
  return getCurrentUser() !== null;
};

/**
 * Permission checking
 */

export const hasPermission = (userRole, permission) => {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission);
};

export const canAccessClient = (user, clientId) => {
  // Super admin and admin can access all clients
  if (user.role === USER_ROLES.SUPER_ADMIN || user.role === USER_ROLES.ADMIN) {
    return true;
  }
  
  // Managers can access all clients
  if (user.role === USER_ROLES.MANAGER) {
    return true;
  }
  
  // Other roles can only access assigned clients
  if (user.assignedClients.length === 0) {
    return false; // No clients assigned
  }
  
  return user.assignedClients.includes(clientId);
};

/**
 * Client assignment
 */

export const assignClientToUser = (userId, clientId, assignerRole) => {
  try {
    if (!hasPermission(assignerRole, PERMISSIONS.EDIT_USER)) {
      throw new Error('Permission denied');
    }
    
    const user = getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    if (!user.assignedClients.includes(clientId)) {
      const updatedClients = [...user.assignedClients, clientId];
      updateUser(userId, { assignedClients: updatedClients }, assignerRole);
    }
    
    return true;
  } catch (error) {
    console.error('Error assigning client:', error);
    throw error;
  }
};

export const removeClientFromUser = (userId, clientId, removerRole) => {
  try {
    if (!hasPermission(removerRole, PERMISSIONS.EDIT_USER)) {
      throw new Error('Permission denied');
    }
    
    const user = getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const updatedClients = user.assignedClients.filter(id => id !== clientId);
    updateUser(userId, { assignedClients: updatedClients }, removerRole);
    
    return true;
  } catch (error) {
    console.error('Error removing client:', error);
    throw error;
  }
};

/**
 * Utility functions
 */

export const getRoleLabel = (role) => {
  const labels = {
    [USER_ROLES.SUPER_ADMIN]: 'Super Administrator',
    [USER_ROLES.ADMIN]: 'Administrator',
    [USER_ROLES.MANAGER]: 'Manager',
    [USER_ROLES.ANALYST]: 'Analyst',
    [USER_ROLES.VIEWER]: 'Viewer'
  };
  return labels[role] || role;
};

export const getUserStats = () => {
  const users = getUsers();
  const currentUser = getCurrentUser();
  
  return {
    total: users.length,
    active: users.filter(u => u.active).length,
    inactive: users.filter(u => !u.active).length,
    byRole: {
      super_admin: users.filter(u => u.role === USER_ROLES.SUPER_ADMIN).length,
      admin: users.filter(u => u.role === USER_ROLES.ADMIN).length,
      manager: users.filter(u => u.role === USER_ROLES.MANAGER).length,
      analyst: users.filter(u => u.role === USER_ROLES.ANALYST).length,
      viewer: users.filter(u => u.role === USER_ROLES.VIEWER).length
    },
    currentUser: currentUser ? currentUser.username : null
  };
};

// Initialize on module load
initializeUserManagement();
