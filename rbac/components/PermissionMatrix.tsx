// Permission Matrix Component
// Visual representation of roles and their permissions

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Role, 
  Permission, 
  PermissionName, 
  ResourceType, 
  PermissionMatrix 
} from '../types/rbac.types';
import { 
  createPermissionMatrix,
  groupPermissionsByResource
} from '../utils/permissions';
import { useRoles } from '../hooks/useRoles';
import { usePermissions } from '../hooks/usePermissions';

// ==========================================
// INTERFACES
// ==========================================

interface PermissionMatrixProps {
  roles?: Role[];
  permissions?: Permission[];
  showSystemPermissions?: boolean;
  showCustomPermissions?: boolean;
  compact?: boolean;
  filterByResource?: ResourceType;
  selectedRoles?: string[];
  onRoleSelect?: (roleId: string) => void;
  onPermissionToggle?: (roleId: string, permission: PermissionName) => void;
  className?: string;
}

interface MatrixCellProps {
  hasPermission: boolean;
  isSystem?: boolean;
  onClick?: () => void;
  compact?: boolean;
}

interface MatrixHeaderProps {
  roles: Role[];
  permissions: PermissionName[];
  selectedRoles: string[];
  onRoleSelect: (roleId: string) => void;
  onPermissionSort?: (permission: PermissionName) => void;
  compact?: boolean;
}

// ==========================================
// COMPONENTS
// ==========================================

/**
 * Individual cell in the permission matrix
 */
const MatrixCell: React.FC<MatrixCellProps> = ({ 
  hasPermission, 
  isSystem = false, 
  onClick, 
  compact = false 
}) => {
  return (
    <div
      className={`
        ${compact ? 'w-6 h-6' : 'w-8 h-8'} 
        border border-gray-300 cursor-pointer
        flex items-center justify-center text-xs
        ${hasPermission 
          ? isSystem 
            ? 'bg-green-600 text-white' 
            : 'bg-green-100 text-green-800'
          : 'bg-gray-50 text-gray-400'
        }
        hover:opacity-80 transition-opacity
        ${onClick ? 'hover:bg-gray-100' : ''}
      `}
      onClick={onClick}
      title={hasPermission ? 'Has permission' : 'No permission'}
    >
      {hasPermission && (
        <span className={compact ? 'text-xs' : 'text-sm'}>
          ✓
        </span>
      )}
    </div>
  );
};

/**
 * Header for the permission matrix
 */
const MatrixHeader: React.FC<MatrixHeaderProps> = ({
  roles,
  permissions,
  selectedRoles,
  onRoleSelect,
  onPermissionSort,
  compact = false
}) => {
  return (
    <div className="sticky top-0 bg-white z-10 border-b-2 border-gray-400">
      {/* Top-left corner (empty) */}
      <div className={`${compact ? 'w-32' : 'w-48'} border-r border-gray-400 p-2`}>
        <span className="font-semibold text-gray-700">Roles / Permissions</span>
      </div>
      
      {/* Permission headers */}
      <div className="flex">
        {permissions.map((permission, index) => (
          <div
            key={permission}
            className={`
              ${compact ? 'w-6' : 'w-8'} 
              border-r border-gray-300 p-1
              ${index === 0 ? 'border-l' : ''}
            `}
            title={permission}
          >
            <div
              className="text-xs text-gray-600 text-center transform -rotate-45 origin-center cursor-pointer hover:text-gray-800"
              onClick={() => onPermissionSort?.(permission)}
            >
              {permission.split(':')[1]?.charAt(0).toUpperCase()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Resource group header
 */
const ResourceGroupHeader: React.FC<{
  resource: ResourceType;
  permissionCount: number;
  compact?: boolean;
}> = ({ resource, permissionCount, compact = false }) => {
  return (
    <div className={`${compact ? 'w-32' : 'w-48'} border-r border-b border-gray-400 p-2 bg-gray-100`}>
      <div className="font-medium text-gray-700 capitalize">
        {resource.replace('_', ' ')}
      </div>
      <div className="text-xs text-gray-500">
        {permissionCount} permission{permissionCount !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

// ==========================================
// MAIN COMPONENT
// ==========================================

/**
 * Permission Matrix Component
 * Displays a visual matrix of roles vs permissions
 */
export const PermissionMatrix: React.FC<PermissionMatrixProps> = ({
  roles = [],
  permissions = [],
  showSystemPermissions = true,
  showCustomPermissions = true,
  compact = false,
  filterByResource,
  selectedRoles = [],
  onRoleSelect,
  onPermissionToggle,
  className = ''
}) => {
  const [localSelectedRoles, setLocalSelectedRoles] = useState<string[]>(selectedRoles);
  const [sortBy, setSortBy] = useState<'resource' | 'alphabetical'>('resource');

  // Load roles and permissions if not provided
  const { roles: loadedRoles } = useRoles();
  const { permissions: loadedPermissions } = usePermissions();
  
  const displayRoles = roles.length > 0 ? roles : loadedRoles;
  const displayPermissions = permissions.length > 0 ? permissions : loadedPermissions;

  // Filter and sort permissions
  const processedPermissions = useMemo(() => {
    let filtered = displayPermissions;

    // Filter by system/custom status
    if (!showSystemPermissions) {
      filtered = filtered.filter(p => !p.is_system_permission);
    }
    if (!showCustomPermissions) {
      filtered = filtered.filter(p => p.is_system_permission);
    }

    // Filter by resource if specified
    if (filterByResource) {
      filtered = filtered.filter(p => p.resource === filterByResource);
    }

    // Sort permissions
    filtered.sort((a, b) => {
      if (sortBy === 'resource') {
        // Group by resource first, then by action
        if (a.resource !== b.resource) {
          return a.resource.localeCompare(b.resource);
        }
        return a.action.localeCompare(b.action);
      } else {
        return a.name.localeCompare(b.name);
      }
    });

    return filtered;
  }, [displayPermissions, showSystemPermissions, showCustomPermissions, filterByResource, sortBy]);

  // Group permissions by resource
  const permissionsByResource = useMemo(() => {
    return groupPermissionsByResource(processedPermissions.map(p => p.name));
  }, [processedPermissions]);

  // Get permission matrix data
  const matrixData = useMemo(() => {
    return createPermissionMatrix(displayRoles);
  }, [displayRoles]);

  // Handle role selection
  const handleRoleSelect = (roleId: string) => {
    const newSelected = localSelectedRoles.includes(roleId)
      ? localSelectedRoles.filter(id => id !== roleId)
      : [...localSelectedRoles, roleId];
    
    setLocalSelectedRoles(newSelected);
    onRoleSelect?.(roleId);
  };

  // Handle permission toggle
  const handlePermissionToggle = (roleId: string, permission: PermissionName) => {
    onPermissionToggle?.(roleId, permission);
  };

  // Toggle between showing all roles and selected roles
  const rolesToShow = localSelectedRoles.length > 0 
    ? displayRoles.filter(role => localSelectedRoles.includes(role.id))
    : displayRoles;

  return (
    <div className={`permission-matrix ${className}`}>
      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Sort:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'resource' | 'alphabetical')}
            className="text-sm border rounded px-2 py-1"
          >
            <option value="resource">By Resource</option>
            <option value="alphabetical">Alphabetical</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">View:</label>
          <label className="flex items-center gap-1 text-sm">
            <input
              type="checkbox"
              checked={showSystemPermissions}
              onChange={() => {}} // Controlled by parent
              className="rounded"
            />
            System
          </label>
          <label className="flex items-center gap-1 text-sm">
            <input
              type="checkbox"
              checked={showCustomPermissions}
              onChange={() => {}} // Controlled by parent
              className="rounded"
            />
            Custom
          </label>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Compact:</label>
          <input
            type="checkbox"
            checked={compact}
            onChange={() => {}} // Controlled by parent
            className="rounded"
          />
        </div>

        {localSelectedRoles.length > 0 && (
          <button
            onClick={() => setLocalSelectedRoles([])}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear Selection ({localSelectedRoles.length})
          </button>
        )}
      </div>

      {/* Matrix Table */}
      <div className="border border-gray-400 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-400">
          <div className="flex">
            {/* Role column header */}
            <div className={`${compact ? 'w-32' : 'w-48'} border-r border-gray-400 p-2`}>
              <span className="font-semibold text-gray-700">Roles</span>
            </div>
            
            {/* Permission column headers */}
            <div className="flex-1 overflow-x-auto">
              <div className="flex min-w-max">
                {processedPermissions.map((permission, index) => (
                  <div
                    key={permission.name}
                    className={`
                      ${compact ? 'w-6' : 'w-8'} 
                      border-r border-gray-300 p-1 text-center
                      ${index === 0 ? 'border-l' : ''}
                    `}
                    title={permission.name}
                  >
                    <div className="text-xs text-gray-600 transform -rotate-45 origin-center">
                      {permission.action.charAt(0).toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="max-h-96 overflow-y-auto">
          {Object.entries(permissionsByResource).map(([resource, permissionNames]) => (
            <React.Fragment key={resource}>
              {/* Resource group header */}
              <div className="flex bg-gray-100 border-b border-gray-300">
                <ResourceGroupHeader
                  resource={resource as ResourceType}
                  permissionCount={permissionNames.length}
                  compact={compact}
                />
                <div className="flex-1 flex">
                  {processedPermissions
                    .filter(p => p.resource === resource)
                    .map((permission, index) => (
                      <div
                        key={permission.name}
                        className={`
                          ${compact ? 'w-6' : 'w-8'} 
                          border-r border-gray-300 p-1 text-center
                          ${index === 0 ? 'border-l' : ''}
                        `}
                        title={permission.action}
                      >
                        <div className="text-xs text-gray-600">
                          {permission.action.charAt(0).toUpperCase()}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Role rows */}
              {rolesToShow.map((role) => (
                <div key={role.id} className="flex border-b border-gray-200 hover:bg-gray-50">
                  {/* Role name */}
                  <div className={`${compact ? 'w-32' : 'w-48'} border-r border-gray-400 p-2`}>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={localSelectedRoles.includes(role.id)}
                        onChange={() => handleRoleSelect(role.id)}
                        className="rounded"
                      />
                      <div>
                        <div className="font-medium text-sm">{role.display_name}</div>
                        {role.is_system_role && (
                          <div className="text-xs text-gray-500">System</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Permission cells */}
                  <div className="flex-1 flex min-w-max">
                    {processedPermissions
                      .filter(p => p.resource === resource)
                      .map((permission, index) => {
                        const hasPerm = matrixData[role.name]?.[resource]?.[permission.action] || false;
                        
                        return (
                          <MatrixCell
                            key={permission.name}
                            hasPermission={hasPerm}
                            isSystem={permission.is_system_permission}
                            compact={compact}
                            onClick={() => onPermissionToggle && handlePermissionToggle(role.id, permission.name)}
                          />
                        );
                      })}
                  </div>
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-700 mb-2">Legend</h4>
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-600 rounded"></div>
            <span>System Permission</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 rounded border border-green-300"></div>
            <span>Custom Permission</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-50 rounded border border-gray-300"></div>
            <span>No Permission</span>
          </div>
        </div>
      </div>

      {/* Summary */}
      {rolesToShow.length > 0 && processedPermissions.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-700 mb-2">Summary</h4>
          <div className="text-sm text-blue-600">
            Showing {rolesToShow.length} role{rolesToShow.length !== 1 ? 's' : ''} × {processedPermissions.length} permission{processedPermissions.length !== 1 ? 's' : ''} = {rolesToShow.length * processedPermissions.length} permission checks
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// EXPORT
// ==========================================

export default PermissionMatrix;
