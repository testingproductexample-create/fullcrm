// Role Manager Component
// Interface for managing roles, permissions, and user assignments

import React, { useState, useEffect } from 'react';
import { 
  Role, 
  RoleName, 
  CreateRoleRequest, 
  UpdateRoleRequest,
  AssignRoleRequest,
  RevokeRoleRequest,
  UserRole 
} from '../types/rbac.types';
import { useRoles, useUserRoles } from '../hooks/useRoles';
import { useRBAC, useIsAdmin, useConditionalRoles } from '../hooks/useRBAC';
import { validateRoleName, validateRoleLevel } from '../utils/validation';

// ==========================================
// INTERFACES
// ==========================================

interface RoleManagerProps {
  userId?: string;
  showUserAssignment?: boolean;
  showRoleHierarchy?: boolean;
  allowRoleCreation?: boolean;
  allowRoleDeletion?: boolean;
  className?: string;
}

interface CreateRoleFormProps {
  onSubmit: (roleData: CreateRoleRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

interface EditRoleFormProps {
  role: Role;
  onSubmit: (updates: UpdateRoleRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

interface RoleCardProps {
  role: Role;
  onEdit: (role: Role) => void;
  onDelete: (role: Role) => void;
  onAssign: (role: Role) => void;
  isEditing?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canAssign?: boolean;
}

interface UserRoleAssignmentProps {
  userId: string;
  onAssign: (assignment: AssignRoleRequest) => Promise<void>;
  onRevoke: (revocation: RevokeRoleRequest) => Promise<void>;
}

// ==========================================
// HELPER COMPONENTS
// ==========================================

/**
 * Form for creating a new role
 */
const CreateRoleForm: React.FC<CreateRoleFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<CreateRoleRequest>({
    name: '',
    display_name: '',
    description: '',
    level: 5,
    metadata: {}
  });
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    // Basic validation
    const newErrors: string[] = [];
    if (!formData.name) newErrors.push('Role name is required');
    if (!formData.display_name) newErrors.push('Display name is required');
    if (formData.name && !validateRoleName(formData.name)) {
      newErrors.push('Role name must contain only lowercase letters, numbers, and underscores');
    }
    if (formData.level !== undefined && !validateRoleLevel(formData.level)) {
      newErrors.push('Role level must be between 0 and 10');
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Failed to create role']);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border border-gray-300 rounded-lg">
      <h3 className="text-lg font-semibold">Create New Role</h3>
      
      {errors.length > 0 && (
        <div className="p-3 bg-red-100 border border-red-300 rounded">
          {errors.map((error, index) => (
            <div key={index} className="text-red-700 text-sm">{error}</div>
          ))}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Role Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., senior_designer"
          disabled={isLoading}
        />
        <p className="text-xs text-gray-500 mt-1">
          Use lowercase letters, numbers, and underscores only
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Display Name *
        </label>
        <input
          type="text"
          value={formData.display_name}
          onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Senior Designer"
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Describe the role and its responsibilities"
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Level (0-10)
        </label>
        <input
          type="number"
          min="0"
          max="10"
          value={formData.level}
          onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) || 0 })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        <p className="text-xs text-gray-500 mt-1">
          Lower numbers = higher privilege (0 = highest)
        </p>
      </div>

      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Creating...' : 'Create Role'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

/**
 * Form for editing an existing role
 */
const EditRoleForm: React.FC<EditRoleFormProps> = ({
  role,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<UpdateRoleRequest>({
    display_name: role.display_name,
    description: role.description,
    is_active: role.is_active,
    level: role.level,
    metadata: role.metadata
  });
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    // Basic validation
    const newErrors: string[] = [];
    if (!formData.display_name) newErrors.push('Display name is required');
    if (formData.level !== undefined && !validateRoleLevel(formData.level)) {
      newErrors.push('Role level must be between 0 and 10');
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Failed to update role']);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border border-gray-300 rounded-lg">
      <h3 className="text-lg font-semibold">Edit Role: {role.display_name}</h3>
      
      {errors.length > 0 && (
        <div className="p-3 bg-red-100 border border-red-300 rounded">
          {errors.map((error, index) => (
            <div key={index} className="text-red-700 text-sm">{error}</div>
          ))}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Display Name *
        </label>
        <input
          type="text"
          value={formData.display_name}
          onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Level (0-10)
        </label>
        <input
          type="number"
          min="0"
          max="10"
          value={formData.level}
          onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) || 0 })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is_active"
          checked={formData.is_active}
          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
          disabled={isLoading || role.is_system_role}
          className="rounded"
        />
        <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
          Active Role
        </label>
        {role.is_system_role && (
          <span className="text-xs text-gray-500">(System role cannot be deactivated)</span>
        )}
      </div>

      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Updating...' : 'Update Role'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

/**
 * Card component for displaying a role
 */
const RoleCard: React.FC<RoleCardProps> = ({
  role,
  onEdit,
  onDelete,
  onAssign,
  isEditing = false,
  canEdit = true,
  canDelete = true,
  canAssign = true
}) => {
  return (
    <div className="border border-gray-300 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="text-lg font-semibold text-gray-800">{role.display_name}</h4>
          <p className="text-sm text-gray-600">@{role.name}</p>
          {role.is_system_role && (
            <span className="inline-block mt-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
              System Role
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs rounded ${
            role.is_active 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {role.is_active ? 'Active' : 'Inactive'}
          </span>
          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
            Level {role.level}
          </span>
        </div>
      </div>

      {role.description && (
        <p className="text-sm text-gray-600 mb-3">{role.description}</p>
      )}

      <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
        <span>{role.permissions.length} permissions</span>
        <span>Created {new Date(role.created_at).toLocaleDateString()}</span>
      </div>

      <div className="flex gap-2">
        {canAssign && (
          <button
            onClick={() => onAssign(role)}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
          >
            Assign to Users
          </button>
        )}
        {canEdit && (
          <button
            onClick={() => onEdit(role)}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Edit
          </button>
        )}
        {canDelete && !role.is_system_role && (
          <button
            onClick={() => onDelete(role)}
            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * User role assignment interface
 */
const UserRoleAssignment: React.FC<UserRoleAssignmentProps> = ({
  userId,
  onAssign,
  onRevoke
}) => {
  const { userRoles, isLoading } = useUserRoles(userId);
  const { roles } = useRoles();
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleAssign = async () => {
    if (!selectedRole) return;

    try {
      setError(null);
      const role = roles.find(r => r.id === selectedRole);
      if (role) {
        await onAssign({
          user_id: userId,
          role_id: role.id
        });
        setSelectedRole('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign role');
    }
  };

  const availableRoles = roles.filter(role => !userRoles.includes(role.name as RoleName));

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium text-gray-700 mb-2">Current Roles</h4>
        {isLoading ? (
          <p className="text-gray-500">Loading roles...</p>
        ) : userRoles.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {userRoles.map(roleName => (
              <span
                key={roleName}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded"
              >
                {roleName.replace('_', ' ')}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No roles assigned</p>
        )}
      </div>

      <div>
        <h4 className="font-medium text-gray-700 mb-2">Assign New Role</h4>
        <div className="flex gap-2">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            <option value="">Select a role</option>
            {availableRoles.map(role => (
              <option key={role.id} value={role.id}>
                {role.display_name} (Level {role.level})
              </option>
            ))}
          </select>
          <button
            onClick={handleAssign}
            disabled={!selectedRole || isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            Assign
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-100 border border-red-300 rounded">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};

// ==========================================
// MAIN COMPONENT
// ==========================================

/**
 * Role Manager Component
 * Main interface for managing roles and permissions
 */
export const RoleManager: React.FC<RoleManagerProps> = ({
  userId,
  showUserAssignment = true,
  showRoleHierarchy = true,
  allowRoleCreation = true,
  allowRoleDeletion = true,
  className = ''
}) => {
  const { user, isAdmin } = useRBAC();
  const { hasAllRoles } = useConditionalRoles();
  const isSystemAdmin = isAdmin || hasAllRoles(['system_admin']);
  const isRoleManager = isSystemAdmin || hasAllRoles(['operations_manager', 'hr_manager']);

  const { 
    roles, 
    createRole, 
    updateRole, 
    deleteRole, 
    isLoading, 
    error 
  } = useRoles();

  const [activeTab, setActiveTab] = useState<'roles' | 'assign' | 'hierarchy'>('roles');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>(userId || '');

  // Handle role creation
  const handleCreateRole = async (roleData: CreateRoleRequest) => {
    await createRole(roleData);
    setShowCreateForm(false);
  };

  // Handle role update
  const handleUpdateRole = async (updates: UpdateRoleRequest) => {
    if (editingRole) {
      await updateRole(editingRole.id, updates);
      setEditingRole(null);
    }
  };

  // Handle role deletion
  const handleDeleteRole = async (role: Role) => {
    if (window.confirm(`Are you sure you want to delete the role "${role.display_name}"?`)) {
      await deleteRole(role.id);
    }
  };

  // Handle role assignment
  const handleRoleAssignment = async (assignment: AssignRoleRequest) => {
    // This would integrate with the role service
    console.log('Assigning role:', assignment);
  };

  // Handle role revocation
  const handleRoleRevocation = async (revocation: RevokeRoleRequest) => {
    // This would integrate with the role service
    console.log('Revoking role:', revocation);
  };

  // Filter roles based on permissions
  const visibleRoles = roles.filter(role => {
    if (!isRoleManager) {
      // Non-role managers can only see their own roles and basic info
      return user?.roles.some(userRole => userRole.id === role.id) || 
             !role.is_system_role;
    }
    return true;
  });

  return (
    <div className={`role-manager ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Role Management</h2>
        <p className="text-gray-600">
          Manage roles, permissions, and user assignments
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('roles')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'roles'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Roles
          </button>
          {showUserAssignment && (
            <button
              onClick={() => setActiveTab('assign')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'assign'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              User Assignment
            </button>
          )}
          {showRoleHierarchy && isSystemAdmin && (
            <button
              onClick={() => setActiveTab('hierarchy')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'hierarchy'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Role Hierarchy
            </button>
          )}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'roles' && (
        <div>
          {/* Controls */}
          <div className="mb-4 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">
              Available Roles ({visibleRoles.length})
            </h3>
            {allowRoleCreation && isRoleManager && (
              <button
                onClick={() => setShowCreateForm(true)}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Create New Role
              </button>
            )}
          </div>

          {/* Create Role Form */}
          {showCreateForm && (
            <div className="mb-6">
              <CreateRoleForm
                onSubmit={handleCreateRole}
                onCancel={() => setShowCreateForm(false)}
                isLoading={isLoading}
              />
            </div>
          )}

          {/* Edit Role Form */}
          {editingRole && (
            <div className="mb-6">
              <EditRoleForm
                role={editingRole}
                onSubmit={handleUpdateRole}
                onCancel={() => setEditingRole(null)}
                isLoading={isLoading}
              />
            </div>
          )}

          {/* Roles Grid */}
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading roles...</p>
            </div>
          ) : visibleRoles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleRoles.map(role => (
                <RoleCard
                  key={role.id}
                  role={role}
                  onEdit={setEditingRole}
                  onDelete={handleDeleteRole}
                  onAssign={() => setActiveTab('assign')}
                  canEdit={isRoleManager}
                  canDelete={allowRoleDeletion && isRoleManager && !role.is_system_role}
                  canAssign={isRoleManager}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No roles found</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'assign' && (
        <div>
          {/* User Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select User
            </label>
            <input
              type="text"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              placeholder="Enter user ID or email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* User Role Assignment */}
          {selectedUserId ? (
            <div className="border border-gray-300 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">
                Role Assignment for User: {selectedUserId}
              </h3>
              <UserRoleAssignment
                userId={selectedUserId}
                onAssign={handleRoleAssignment}
                onRevoke={handleRoleRevocation}
              />
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Enter a user ID to manage their roles</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'hierarchy' && (
        <div>
          <div className="text-center py-8">
            <p className="text-gray-500">Role hierarchy visualization coming soon</p>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// EXPORT
// ==========================================

export default RoleManager;
