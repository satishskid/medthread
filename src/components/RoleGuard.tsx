import React from 'react';
import { useStore } from '../store/useStore';
import { ShieldExclamationIcon } from '@heroicons/react/24/outline';

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ 
  allowedRoles, 
  children, 
  fallback 
}) => {
  const { currentUser } = useStore();

  // If no user is logged in, show access denied
  if (!currentUser) {
    return (
      fallback || (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <ShieldExclamationIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
            <p className="text-gray-600">Please log in to access this feature.</p>
          </div>
        </div>
      )
    );
  }

  // Check if user's role is in the allowed roles
  const hasAccess = allowedRoles.includes(currentUser.role);

  if (!hasAccess) {
    return (
      fallback || (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <ShieldExclamationIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600 mb-2">
              Your role ({currentUser.role}) does not have permission to access this feature.
            </p>
            <p className="text-sm text-gray-500">
              Required roles: {allowedRoles.join(', ')}
            </p>
          </div>
        </div>
      )
    );
  }

  // User has access, render children
  return <>{children}</>;
};

// Convenience components for common role combinations
export const DoctorOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <RoleGuard allowedRoles={['doctor']} fallback={fallback}>
    {children}
  </RoleGuard>
);

export const ClinicalStaff: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <RoleGuard allowedRoles={['doctor', 'nurse', 'specialist']} fallback={fallback}>
    {children}
  </RoleGuard>
);

export const AdminOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <RoleGuard allowedRoles={['admin']} fallback={fallback}>
    {children}
  </RoleGuard>
);

export const AllStaff: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ children, fallback }) => (
  <RoleGuard allowedRoles={['doctor', 'nurse', 'specialist', 'admin']} fallback={fallback}>
    {children}
  </RoleGuard>
);