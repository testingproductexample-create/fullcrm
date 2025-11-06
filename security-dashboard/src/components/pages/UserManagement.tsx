import React, { useState } from 'react';
import { useSecurity } from '../../context/SecurityContext';
import { Users, Plus, Search, Filter, MoreHorizontal, Shield, Clock, AlertCircle, UserCheck, UserX, Edit } from 'lucide-react';

const UserManagement: React.FC = () => {
  const { users, updateUser, suspendUser, addUser } = useSecurity();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [showAddUser, setShowAddUser] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return UserCheck;
      case 'inactive':
        return Clock;
      case 'suspended':
        return UserX;
      default:
        return AlertCircle;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'inactive':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'suspended':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'administrator':
        return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
      case 'security analyst':
        return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'user':
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
      default:
        return 'text-white/60 bg-white/10 border-white/20';
    }
  };

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays < 1) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  const filteredUsers = users.filter(user => {
    if (searchTerm && !user.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !user.email.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !user.userId.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    if (filter === 'active' && user.status !== 'active') return false;
    if (filter === 'inactive' && user.status !== 'inactive') return false;
    if (filter === 'suspended' && user.status !== 'suspended') return false;
    if (filter === 'admin' && user.role !== 'Administrator') return false;
    
    return true;
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    inactive: users.filter(u => u.status === 'inactive').length,
    suspended: users.filter(u => u.status === 'suspended').length
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <p className="text-white/60 mt-1">Manage user accounts, permissions, and access control</p>
        </div>
        
        <button 
          onClick={() => setShowAddUser(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add User</span>
        </button>
      </div>

      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">Total Users</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <Users className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">Active</p>
              <p className="text-2xl font-bold text-green-400">{stats.active}</p>
            </div>
            <UserCheck className="w-8 h-8 text-green-400" />
          </div>
        </div>
        
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">Inactive</p>
              <p className="text-2xl font-bold text-yellow-400">{stats.inactive}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
        
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">Suspended</p>
              <p className="text-2xl font-bold text-red-400">{stats.suspended}</p>
            </div>
            <UserX className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="glass-card p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 glass-button bg-white/5 text-white placeholder-white/40 focus:outline-none focus:bg-white/10 w-64"
              />
            </div>
            
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 glass-button bg-white/5 text-white focus:outline-none"
            >
              <option value="all">All Users</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="admin">Administrators</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-3">
            <button className="flex items-center space-x-2 px-3 py-2 glass-button hover:bg-white/10 text-white">
              <Filter className="w-4 h-4" />
              <span>Advanced Filters</span>
            </button>
            
            <button className="flex items-center space-x-2 px-3 py-2 glass-button hover:bg-white/10 text-white">
              <Shield className="w-4 h-4" />
              <span>Permissions</span>
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-white/10">
              <tr className="text-left">
                <th className="p-4 text-white/80 font-medium">User</th>
                <th className="p-4 text-white/80 font-medium">Role</th>
                <th className="p-4 text-white/80 font-medium">Status</th>
                <th className="p-4 text-white/80 font-medium">Permissions</th>
                <th className="p-4 text-white/80 font-medium">Last Active</th>
                <th className="p-4 text-white/80 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const StatusIcon = getStatusIcon(user.status);
                const statusColor = getStatusColor(user.status);
                const roleColor = getRoleColor(user.role);
                
                return (
                  <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{user.name}</p>
                          <p className="text-white/60 text-sm">{user.email}</p>
                          <p className="text-white/40 text-xs">{user.userId}</p>
                        </div>
                      </div>
                    </td>
                    
                    <td className="p-4">
                      <div className={`inline-block px-3 py-1 text-xs rounded-full border ${roleColor}`}>
                        {user.role}
                      </div>
                    </td>
                    
                    <td className="p-4">
                      <div className={`inline-flex items-center space-x-2 px-3 py-1 text-xs rounded-full border ${statusColor}`}>
                        <StatusIcon className="w-3 h-3" />
                        <span>{user.status.charAt(0).toUpperCase() + user.status.slice(1)}</span>
                      </div>
                    </td>
                    
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {user.permissions.slice(0, 3).map((permission) => (
                          <span
                            key={permission}
                            className="px-2 py-1 text-xs bg-white/10 text-white/70 rounded border border-white/20"
                          >
                            {permission}
                          </span>
                        ))}
                        {user.permissions.length > 3 && (
                          <span className="px-2 py-1 text-xs bg-white/10 text-white/70 rounded border border-white/20">
                            +{user.permissions.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    
                    <td className="p-4 text-white/60 text-sm">
                      {getTimeAgo(user.lastActive)}
                    </td>
                    
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                          <Edit className="w-4 h-4 text-white/60" />
                        </button>
                        
                        {user.status === 'suspended' ? (
                          <button 
                            onClick={() => updateUser(user.id, { status: 'active' })}
                            className="px-3 py-1 text-xs bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded border border-green-500/30 transition-colors"
                          >
                            Reactivate
                          </button>
                        ) : (
                          <button 
                            onClick={() => suspendUser(user.id)}
                            className="px-3 py-1 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded border border-red-500/30 transition-colors"
                          >
                            Suspend
                          </button>
                        )}
                        
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                          <MoreHorizontal className="w-4 h-4 text-white/60" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredUsers.length === 0 && (
        <div className="glass-card p-12 text-center">
          <Users className="w-16 h-16 text-white/40 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white/80 mb-2">No users found</h3>
          <p className="text-white/60">No users match your current search and filter criteria.</p>
        </div>
      )}

      {/* Add User Modal (simplified) */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">Add New User</h3>
            <p className="text-white/60 mb-4">User creation form would be implemented here</p>
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setShowAddUser(false)}
                className="flex-1 px-4 py-2 glass-button hover:bg-white/10 text-white"
              >
                Cancel
              </button>
              <button className="flex-1 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30">
                Create User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;