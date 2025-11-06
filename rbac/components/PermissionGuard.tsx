import React, { useMemo } from 'react';
import { useRBAC } from '../hooks';
import { Permission } from '../types';

interface PermissionGuardProps {
  // Permission requirements
  permission?: string;
  permissions?: string[];
  requiredAll?: boolean; // If true, user must have ALL specified permissions
  
  // Alternative: Pass permission object
  permissionObj?: Permission;
  permissionObjs?: Permission[];
  
  // Module-based access
  module?: string;
  resource?: string;
  action?: string;
  
  // Content to render
  children: React.ReactNode;
  
  // Fallback content when permission is denied
  fallback?: React.ReactNode;
  
  // Loading state
  loading?: boolean;
  
  // Error state
  error?: React.ReactNode;
  
  // Class names
  className?: string;
  fallbackClassName?: string;
}

interface PermissionCheckResult {
  hasAccess: boolean;
  missingPermissions?: string[];
  permissionDetails?: Permission[];
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  permissions = [],
  requiredAll = false,
  permissionObj,
  permissionObjs = [],
  module,
  resource,
  action,
  children,
  fallback = null,
  loading = false,
  error = null,
  className = '',
  fallbackClassName = '',
}) => {
  const { 
    hasPermission, 
    getUserPermissions, 
    user, 
    loading: rbacLoading,
    permissionCache 
  } = useRBAC();

  // Check if loading
  if (rbacLoading || loading) {
    return (
      <div className={`rbac-permission-guard-loading ${className}`}>
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600">Checking permissions...</span>
        </div>
      </div>
    );
  }

  // Check if error
  if (error) {
    return (
      <div className={`rbac-permission-guard-error ${className}`}>
        {error}
      </div>
    );
  }

  // Permission checking logic
  const checkResult = useMemo((): PermissionCheckResult => {
    if (!user) {
      return { hasAccess: false, missingPermissions: ['User not authenticated'] };
    }

    // Convert different input formats to permission strings
    const permissionStrings: string[] = [];

    // Single string permission
    if (permission) {
      permissionStrings.push(permission);
    }

    // Array of permission strings
    if (permissions.length > 0) {
      permissionStrings.push(...permissions);
    }

    // Single permission object
    if (permissionObj) {
      permissionStrings.push(permissionObj.name);
    }

    // Array of permission objects
    if (permissionObjs.length > 0) {
      permissionStrings.push(...permissionObjs.map(p => p.name));
    }

    // Module-based permission
    if (module || resource || action) {
      const parts = [module, resource, action].filter(Boolean);
      if (parts.length > 0) {
        permissionStrings.push(parts.join(':'));
      }
    }

    // If no permissions specified, deny access
    if (permissionStrings.length === 0) {
      return { hasAccess: false, missingPermissions: ['No permission specified'] };
    }

    // Check each permission
    const hasPermissions = requiredAll 
      ? permissionStrings.every(p => hasPermission(user.id, p))
      : permissionStrings.some(p => hasPermission(user.id, p));

    const missingPermissions = requiredAll
      ? permissionStrings.filter(p => !hasPermission(user.id, p))
      : [];

    return {
      hasAccess: hasPermissions,
      missingPermissions: missingPermissions.length > 0 ? missingPermissions : undefined,
    };
  }, [
    user,
    permission,
    permissions,
    requiredAll,
    permissionObj,
    permissionObjs,
    module,
    resource,
    action,
    hasPermission
  ]);

  // Render based on permission check
  if (checkResult.hasAccess) {
    return (
      <div className={`rbac-permission-guard-allowed ${className}`}>
        {children}
      </div>
    );
  }

  // Return fallback content
  return (
    <div className={`rbac-permission-guard-denied ${fallbackClassName}`}>
      {fallback || (
        <div className="flex items-center justify-center p-4 text-gray-500">
          <svg 
            className="w-5 h-5 mr-2" 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path 
              fillRule="evenodd" 
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" 
              clipRule="evenodd" 
            />
          </svg>
          <span className="text-sm">
            Insufficient permissions
            {checkResult.missingPermissions && checkResult.missingPermissions.length > 0 && (
              <span className="text-xs block mt-1">
                Missing: {checkResult.missingPermissions.join(', ')}
              </span>
            )}
          </span>
        </div>
      )}
    </div>
  );
};

// Higher-order component version
export const withPermissionGuard = <P extends object>(
  Component: React.ComponentType<P>,
  permissionConfig: Omit<PermissionGuardProps, 'children'>
) => {
  return (props: P) => {
    return (
      <PermissionGuard {...permissionConfig}>
        <Component {...props} />
      </PermissionGuard>
    );
  };
};

// Hook for permission checking in custom logic
export const usePermissionCheck = (
  permission: string,
  options?: { 
    userId?: string; 
    fallback?: boolean; 
  }
) => {
  const { hasPermission, user } = useRBAC();

  return useMemo(() => {
    const targetUserId = options?.userId || user?.id;
    if (!targetUserId) {
      return {
        hasPermission: false,
        check: (perm: string) => false,
        permission,
        userId: targetUserId,
      };
    }

    return {
      hasPermission: hasPermission(targetUserId, permission),
      check: (perm: string) => hasPermission(targetUserId, perm),
      permission,
      userId: targetUserId,
    };
  }, [hasPermission, permission, user?.id, options?.userId]);
};

// Permission guard for specific UI patterns
export const PermissionButton: React.FC<{
  permission: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabledClassName?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}> = ({
  permission,
  children,
  onClick,
  className = '',
  disabledClassName = 'opacity-50 cursor-not-allowed',
  variant = 'primary',
  size = 'md',
  disabled = false,
}) => {
  const { hasPermission, user } = useRBAC();
  const hasAccess = user ? hasPermission(user.id, permission) : false;

  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };

  const sizeClasses = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const combinedClassName = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${hasAccess && !disabled ? className : disabledClassName}`;

  const handleClick = () => {
    if (hasAccess && !disabled && onClick) {
      onClick();
    }
  };

  return (
    <PermissionGuard permission={permission}>
      <button
        onClick={handleClick}
        className={combinedClassName}
        disabled={!hasAccess || disabled}
      >
        {children}
      </button>
    </PermissionGuard>
  );
};

export const PermissionLink: React.FC<{
  permission: string;
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}> = ({ permission, href, children, className = '', onClick }) => {
  const { hasPermission, user } = useRBAC();
  const hasAccess = user ? hasPermission(user.id, permission) : false;

  if (!hasAccess) {
    return null;
  }

  return (
    <a 
      href={href} 
      className={className}
      onClick={onClick}
    >
      {children}
    </a>
  );
};

export default PermissionGuard;