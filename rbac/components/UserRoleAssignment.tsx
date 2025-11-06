import React, { useState, useEffect, useMemo } from 'react';
import { useRBAC, useRoles, usePermissions } from '../hooks';
import { User, Role, Permission } from '../types';

interface UserRoleAssignmentProps {
  user: User;
  onRoleAssignmentChange?: (userId: string, roles: Role[]) => void;
  allowBulkOperations?: boolean;
  showUserSearch?: boolean;
  className?: string;
}

interface UserSearchResult extends User {
  roles: Role[];
  permissionCount: number;
}

export const UserRoleAssignment: React.FC<UserRoleAssignmentProps> = ({
  user,
  onRoleAssignmentChange,
  allowBulkOperations = true,
  showUserSearch = false,
  className = '',
}) => {
  const { 
    userRoles, 
    assignUserRole, 
    removeUserRole, 
    getUserPermissions,
    loading: rbacLoading 
  } = useRBAC();
  
  const { roles, getAllRoles } = useRoles();
  const { permissions } = usePermissions();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [bulkRoleId, setBulkRoleId] = useState('');
  const [showAddRole, setShowAddRole] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Current user's roles and permissions
  const currentUserRoles = userRoles[user.id] || [];
  const userPermissions = useMemo(() => getUserPermissions(user.id), [user.id, getUserPermissions]);

  // Search and filter users
  useEffect(() => {
    if (showUserSearch && searchQuery) {
      const searchUsers = async () => {
        setLoading(true);
        try {
          // Simulate API call - replace with actual user search
          const mockUsers: UserSearchResult[] = [
            {
              ...user,
              roles: currentUserRoles,
              permissionCount: userPermissions.length,
            },
          ];
          setAvailableUsers(mockUsers);
        } catch (error) {
          console.error('Error searching users:', error);
        } finally {
          setLoading(false);
        }
      };
      searchUsers();
    }
  }, [searchQuery, showUserSearch, user, currentUserRoles, userPermissions]);

  // Handle role assignment
  const handleAssignRole = async (roleId: string) => {
    try {
      await assignUserRole(user.id, roleId);
      if (onRoleAssignmentChange) {
        const updatedRoles = [...currentUserRoles, roles.find(r => r.id === roleId)!];
        onRoleAssignmentChange(user.id, updatedRoles);
      }
      setShowAddRole(false);
    } catch (error) {
      console.error('Error assigning role:', error);
    }
  };

  // Handle role removal
  const handleRemoveRole = async (roleId: string) => {
    try {
      await removeUserRole(user.id, roleId);
      if (onRoleAssignmentChange) {
        const updatedRoles = currentUserRoles.filter(r => r.id !== roleId);
        onRoleAssignmentChange(user.id, updatedRoles);
      }
    } catch (error) {
      console.error('Error removing role:', error);
    }
  };

  // Handle bulk operations
  const handleBulkAssign = async () => {
    if (!bulkRoleId || selectedUsers.length === 0) return;

    try {
      setLoading(true);
      for (const userId of selectedUsers) {
        await assignUserRole(userId, bulkRoleId);
      }
      setSelectedUsers([]);
      setBulkRoleId('');
    } catch (error) {
      console.error('Error in bulk assignment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkRemove = async () => {
    if (selectedUsers.length === 0) return;

    try {
      setLoading(true);
      for (const userId of selectedUsers) {
        // Get current roles for this user and remove selected role
        const currentRoles = userRoles[userId] || [];
        if (currentRoles.length > 0) {
          await removeUserRole(userId, currentRoles[0].id);
        }
      }
      setSelectedUsers([]);
    } catch (error) {
      console.error('Error in bulk removal:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get role permissions for display
  const getRolePermissions = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return [];
    
    return permissions.filter(p => 
      role.permissions?.some(rp => rp.permissionId === p.id)
    );
  };

  // Filter roles that user doesn't have
  const availableRoles = useMemo(() => {
    const userRoleIds = currentUserRoles.map(r => r.id);
    return roles.filter(r => !userRoleIds.includes(r.id));
  }, [roles, currentUserRoles]);

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  if (rbacLoading) {
    return (
      <div className={`rbac-user-role-assignment loading ${className}`}>
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`rbac-user-role-assignment ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Role Assignment
        </h3>
        <p className="text-sm text-gray-600">
          Manage roles and permissions for {user.email}
        </p>
      </div>

      {/* User Search */}
      {showUserSearch && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-4 mb-3">
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {selectedUsers.length > 0 && (
              <span className="text-sm text-gray-600">
                {selectedUsers.length} selected
              </span>
            )}
          </div>

          {/* Search Results */}
          {searchQuery && (
            <div className="space-y-2">
              {availableUsers.map(u => (
                <div
                  key={u.id}
                  className={`flex items-center justify-between p-3 bg-white rounded border cursor-pointer ${
                    selectedUsers.includes(u.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => toggleUserSelection(u.id)}
                >
                  <div>
                    <div className="font-medium">{u.email}</div>
                    <div className="text-sm text-gray-500">
                      {u.roles.length} roles, {u.permissionCount} permissions
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(u.id)}
                    onChange={() => toggleUserSelection(u.id)}
                    className="text-blue-600"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Bulk Operations */}
          {selectedUsers.length > 0 && allowBulkOperations && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <select
                  value={bulkRoleId}
                  onChange={(e) => setBulkRoleId(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="">Select role for bulk assignment</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleBulkAssign}
                  disabled={!bulkRoleId || loading}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  Assign Role
                </button>
                <button
                  onClick={handleBulkRemove}
                  disabled={loading}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
                >
                  Remove Last Role
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Current Roles */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-md font-medium text-gray-800">Current Roles</h4>
          <button
            onClick={() => setShowAddRole(!showAddRole)}
            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            Add Role
          </button>
        </div>

        {currentUserRoles.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            No roles assigned
          </div>
        ) : (
          <div className="space-y-2">
            {currentUserRoles.map(role => (
              <div
                key={role.id}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{role.name}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {role.description}
                  </div>
                  {role.level && (
                    <div className="text-xs text-gray-400 mt-1">
                      Level: {role.level}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRemoveRole(role.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Role Modal */}
      {showAddRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h4 className="text-lg font-semibold mb-4">Add Role</h4>
            <div className="space-y-3">
              {availableRoles.map(role => (
                <div
                  key={role.id}
                  className="p-3 border border-gray-200 rounded hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{role.name}</div>
                      <div className="text-sm text-gray-500">{role.description}</div>
                    </div>
                    <button
                      onClick={() => handleAssignRole(role.id)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      Assign
                    </button>
                  </div>
                </div>
              ))}
              {availableRoles.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No available roles to assign
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowAddRole(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Permissions Summary */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-md font-medium text-blue-900 mb-2">
          Permission Summary
        </h4>
        <div className="text-sm text-blue-800">
          <div>Total Permissions: {userPermissions.length}</div>
          <div>Active Roles: {currentUserRoles.length}</div>
        </div>
      </div>
    </div>
  );
};

export default UserRoleAssignment;