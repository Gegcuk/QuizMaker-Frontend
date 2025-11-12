// src/components/UserActivation.tsx
// ---------------------------------------------------------------------------
// User activation/deactivation component based on USER_ENDPOINTS
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth';
import { userService } from '@/services';
import { UserDto } from '@/types';
import type { AxiosError } from 'axios';
import { Button, Alert, Checkbox } from '@/components';

interface UserActivationProps {
  userId: string;
  user?: UserDto;
  onActivationChange?: (userId: string, isActive: boolean) => void;
  onError?: (error: string) => void;
  className?: string;
}

interface BulkActivationProps {
  userIds: string[];
  onActivationChange?: (userIds: string[], isActive: boolean) => void;
  onError?: (error: string) => void;
  className?: string;
}

// Individual user activation component
export const UserActivation: React.FC<UserActivationProps> = ({
  userId,
  user,
  onActivationChange,
  onError,
  className = ''
}) => {
  const { user: currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isActive, setIsActive] = useState(user?.isActive ?? false);
  const [errors, setErrors] = useState<string | null>(null);

  // Update local state when user prop changes
  useEffect(() => {
    if (user) {
      setIsActive(user.isActive);
    }
  }, [user]);

  // Check if current user has permission to activate/deactivate users
  const hasPermission = currentUser?.roles.some(role => 
    ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'].includes(role)
  );

  const handleToggleActivation = async () => {
    if (!hasPermission) {
      const errorMsg = 'You do not have permission to activate/deactivate users';
      setErrors(errorMsg);
      if (onError) onError(errorMsg);
      return;
    }

    setIsLoading(true);
    setErrors(null);

    try {
      if (isActive) {
        await userService.deactivateUser(userId);
        setIsActive(false);
      } else {
        await userService.activateUser(userId);
        setIsActive(true);
      }

      if (onActivationChange) {
        onActivationChange(userId, !isActive);
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const errorMessage = axiosError.response?.data?.message || 
        `Failed to ${isActive ? 'deactivate' : 'activate'} user`;
      setErrors(errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasPermission) {
    return (
      <div className={`bg-theme-bg-warning border border-theme-border-warning rounded-md p-3 ${className}`}>
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-theme-text-tertiary" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-theme-interactive-warning">Insufficient permissions</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {errors && (
        <Alert type="error" dismissible onDismiss={() => setErrors(null)} className="mb-3">
          {errors}
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isActive 
              ? 'bg-theme-bg-success text-theme-interactive-success' 
              : 'bg-theme-bg-danger text-theme-interactive-danger'
          }`}>
            {isActive ? 'Active' : 'Inactive'}
          </span>
          <span className="text-sm text-theme-text-tertiary">
            {user?.username || `User ${userId}`}
          </span>
        </div>
        
        <Button
          variant={isActive ? 'danger' : 'success'}
          size="sm"
          onClick={handleToggleActivation}
          disabled={isLoading}
          loading={isLoading}
        >
          {isActive ? 'Deactivate' : 'Activate'}
        </Button>
      </div>
    </div>
  );
};

// Bulk activation component
export const BulkUserActivation: React.FC<BulkActivationProps> = ({
  userIds,
  onActivationChange,
  onError,
  className = ''
}) => {
  const { user: currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [action, setAction] = useState<'activate' | 'deactivate' | null>(null);
  const [errors, setErrors] = useState<string | null>(null);

  // Check if current user has permission
  const hasPermission = currentUser?.roles.some(role => 
    ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'].includes(role)
  );

  const handleBulkActivation = async (activate: boolean) => {
    if (!hasPermission) {
      const errorMsg = 'You do not have permission to perform bulk user operations';
      setErrors(errorMsg);
      if (onError) onError(errorMsg);
      return;
    }

    if (userIds.length === 0) {
      const errorMsg = 'No users selected for bulk operation';
      setErrors(errorMsg);
      if (onError) onError(errorMsg);
      return;
    }

    setIsLoading(true);
    setAction(activate ? 'activate' : 'deactivate');
    setErrors(null);

    try {
      if (activate) {
        await userService.bulkActivateUsers(userIds);
      } else {
        await userService.bulkDeactivateUsers(userIds);
      }

      if (onActivationChange) {
        onActivationChange(userIds, activate);
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const errorMessage = axiosError.response?.data?.message || 
        `Failed to bulk ${activate ? 'activate' : 'deactivate'} users`;
      setErrors(errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setIsLoading(false);
      setAction(null);
    }
  };

  if (!hasPermission) {
    return (
      <div className={`bg-theme-bg-warning border border-theme-border-warning rounded-md p-3 ${className}`}>
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-theme-text-tertiary" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-theme-interactive-warning">Insufficient permissions for bulk operations</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-theme-bg-secondary border border-theme-border-primary rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-theme-text-primary">
          Bulk User Operations
        </h3>
        <span className="text-xs text-theme-text-tertiary">
          {userIds.length} user{userIds.length !== 1 ? 's' : ''} selected
        </span>
      </div>

      {errors && (
        <Alert type="error" dismissible onDismiss={() => setErrors(null)} className="mb-3">
          {errors}
        </Alert>
      )}

      <div className="flex space-x-2">
        <Button
          variant="success"
          size="sm"
          onClick={() => handleBulkActivation(true)}
          disabled={isLoading || userIds.length === 0}
          loading={isLoading && action === 'activate'}
          className="flex-1"
        >
          Activate All
        </Button>
        
        <Button
          variant="danger"
          size="sm"
          onClick={() => handleBulkActivation(false)}
          disabled={isLoading || userIds.length === 0}
          loading={isLoading && action === 'deactivate'}
          className="flex-1"
        >
          Deactivate All
        </Button>
      </div>

      {userIds.length === 0 && (
        <p className="mt-2 text-xs text-theme-text-tertiary text-center">
          Select users to perform bulk operations
        </p>
      )}
    </div>
  );
};

// Main component that combines both individual and bulk activation
const UserActivationManager: React.FC<{
  users: UserDto[];
  selectedUserIds: string[];
  onSelectionChange?: (userIds: string[]) => void;
  onActivationChange?: (userId: string, isActive: boolean) => void;
  onBulkActivationChange?: (userIds: string[], isActive: boolean) => void;
  onError?: (error: string) => void;
  className?: string;
}> = ({
  users,
  selectedUserIds,
  onSelectionChange,
  onActivationChange,
  onBulkActivationChange,
  onError,
  className = ''
}) => {
  const handleUserSelection = (userId: string, selected: boolean) => {
    if (selected) {
      onSelectionChange?.([...selectedUserIds, userId]);
    } else {
      onSelectionChange?.(selectedUserIds.filter(id => id !== userId));
    }
  };

  const handleSelectAll = () => {
    if (selectedUserIds.length === users.length) {
      onSelectionChange?.([]);
    } else {
      onSelectionChange?.(users.map(user => user.id));
    }
  };

  return (
    <div className={className}>
      {/* Bulk Operations */}
      {users.length > 0 && (
        <BulkUserActivation
          userIds={selectedUserIds}
          onActivationChange={onBulkActivationChange}
          onError={onError}
          className="mb-4"
        />
      )}

      {/* User List */}
      <div className="space-y-3">
        {users.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-theme-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-theme-text-primary">No users found</h3>
            <p className="mt-1 text-sm text-theme-text-tertiary">There are no users to manage.</p>
          </div>
        ) : (
          <>
            {/* Select All */}
            <div className="flex items-center space-x-3 p-3 bg-theme-bg-secondary rounded-md">
              <Checkbox
                checked={selectedUserIds.length === users.length && users.length > 0}
                onChange={handleSelectAll}
                label={`Select All (${users.length} users)`}
              />
            </div>

            {/* Individual Users */}
            {users.map((user) => (
              <div key={user.id} className="flex items-center space-x-3 p-3 bg-theme-bg-primary border border-theme-border-primary rounded-md">
                <Checkbox
                  checked={selectedUserIds.includes(user.id)}
                  onChange={(checked) => handleUserSelection(user.id, checked)}
                  label=""
                />
                <div className="flex-1">
                  <UserActivation
                    userId={user.id}
                    user={user}
                    onActivationChange={onActivationChange}
                    onError={onError}
                  />
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default UserActivationManager; 