// src/components/UserProfile.tsx
// ---------------------------------------------------------------------------
// User profile display and editing component based on UserDto
// ---------------------------------------------------------------------------

import React, { useState, useEffect, FormEvent, ChangeEvent, useCallback } from 'react';
import { useAuth } from '@/features/auth';
import { UserDto } from '@/types';
import { userService } from '@/services';
import type { AxiosError } from 'axios';
import { billingService } from '@/services';
import type { BalanceDto } from '@/types';
import { TokenTopUp } from '@/features/billing';

interface UserProfileProps {
  userId?: string; // If provided, shows admin view for specific user
  onUpdate?: (user: UserDto) => void;
  onError?: (error: string) => void;
  className?: string;
}

interface FormErrors {
  username?: string;
  email?: string;
  general?: string;
}

const UserProfile: React.FC<UserProfileProps> = ({
  userId,
  onUpdate,
  onError,
  className = ''
}) => {
  console.log('🚀 UserProfile component is rendering!');
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<UserDto | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [balance, setBalance] = useState<BalanceDto | null>(null);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [billingDisabled, setBillingDisabled] = useState(false);

  // Form state for editing
  const [formData, setFormData] = useState<Partial<UserDto>>({});

  // Determine if this is admin view
  const isAdminView = !!userId && userId !== currentUser?.id;
  const displayUser = user || currentUser;

  // DEBUG: Log the state values
  console.log('UserProfile DEBUG:', {
    isAdminView,
    billingDisabled,
    balanceError,
    balance,
    currentUser: currentUser?.id,
    userId
  });

  // Load user data
  useEffect(() => {
    const loadUser = async () => {
      if (!displayUser) return;

      setIsLoading(true);
      try {
        if (userId && userId !== currentUser?.id) {
          // Admin view - load specific user
          const userData = await userService.getUserById(userId);
          setUser(userData);
          setFormData({
            username: userData.username,
            email: userData.email
          });
        } else {
          // Own profile view
          setFormData({
            username: displayUser.username,
            email: displayUser.email
          });
        }
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        const errorMessage = axiosError.response?.data?.message || 'Failed to load user profile';
        setErrors({ general: errorMessage });
        if (onError) onError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, [userId, currentUser, displayUser, onError]);


  const fetchBalance = useCallback(async () => {
    if (isAdminView || !currentUser) {
      setBalance(null);
      setBillingDisabled(false);
      setBalanceError(null);
      return;
    }

    setIsBalanceLoading(true);
    setBalanceError(null);
    setBillingDisabled(false);

    try {
      const balanceResponse = await billingService.getBalance();
      setBalance(balanceResponse);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const status = axiosError.response?.status;

      setBalance(null);

      if (status === 404) {
        setBillingDisabled(true);
      } else if (status === 403) {
        setBalanceError('You do not have permission to view billing information.');
      } else {
        const errorMessage = axiosError.response?.data?.message || 'Failed to load billing information';
        setBalanceError(errorMessage);
      }
    } finally {
      setIsBalanceLoading(false);
    }
  }, [currentUser?.id, isAdminView]);

  useEffect(() => {
    void fetchBalance();
  }, [fetchBalance]);

  const handleRefreshBalance = () => {
    void fetchBalance();
  };
  
  const renderBalanceSection = () => {
    if (isBalanceLoading) {
      return (
        <div className="space-y-4">
          <div className="bg-theme-bg-primary border border-theme-border-primary rounded-lg p-4 bg-theme-bg-primary text-theme-text-primary">
            <div className="animate-pulse grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="h-3 bg-theme-bg-primary rounded w-24 mb-2" />
                <div className="h-6 bg-theme-bg-primary rounded" />
              </div>
              <div>
                <div className="h-3 bg-theme-bg-primary rounded w-20 mb-2" />
                <div className="h-6 bg-theme-bg-primary rounded" />
              </div>
              <div>
                <div className="h-3 bg-theme-bg-primary rounded w-28 mb-2" />
                <div className="h-6 bg-theme-bg-primary rounded" />
              </div>
            </div>
          </div>
          <div className="bg-theme-bg-primary border border-theme-border-primary rounded-lg p-4 bg-theme-bg-primary text-theme-text-primary">
            <div className="h-4 bg-theme-bg-primary rounded w-40 mb-2 animate-pulse" />
            <div className="h-16 bg-theme-bg-primary rounded animate-pulse" />
          </div>
        </div>
      );
    }


    if (billingDisabled) {
      return (
        <div className="bg-theme-bg-secondary border border-theme-border-primary rounded-lg p-4 text-sm text-theme-text-secondary bg-theme-bg-primary text-theme-text-primary">
          Billing features are not enabled for this environment yet. Token balance will appear here once available.
        </div>
      );
    }

    if (balanceError) {
      return (
        <div className="bg-theme-bg-danger border border-theme-border-danger rounded-lg p-4 text-sm text-theme-interactive-danger">
          {balanceError}
        </div>
      );
    }

    if (!balance) {
      return null;
    }

    return (
      <div className="space-y-4">
        <div className="bg-theme-bg-primary border border-theme-border-primary rounded-lg p-4 bg-theme-bg-primary text-theme-text-primary">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-theme-interactive-primary">Available Tokens</p>
              <p className="mt-1 text-2xl font-semibold text-theme-text-primary">
                {balance.availableTokens.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-theme-interactive-primary">Reserved Tokens</p>
              <p className="mt-1 text-lg font-semibold text-theme-text-primary">
                {balance.reservedTokens.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-theme-interactive-primary">Last Updated</p>
              <p className="mt-1 text-sm text-theme-text-primary">
                {balance.updatedAt ? new Date(balance.updatedAt).toLocaleString() : '—'}
              </p>
            </div>
          </div>
        </div>

      </div>
    );
  };

  // Clear field errors when user starts typing
  const clearFieldError = (field: keyof FormErrors) => {
    setErrors(prev => ({ ...prev, [field]: undefined, general: undefined }));
  };

  // Validation function
  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};

    if (!formData.username?.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.trim().length < 4) {
      newErrors.username = 'Username must be at least 4 characters';
    } else if (formData.username.trim().length > 20) {
      newErrors.username = 'Username must be no more than 20 characters';
    }

    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    return newErrors;
  };

  // Handle input changes
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    clearFieldError(name as keyof FormErrors);
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSaving(true);
    try {
      const updatedUser = await userService.updateUserProfile(formData);
      setUser(updatedUser);
      setIsEditing(false);
      setErrors({});
      
      if (onUpdate) {
        onUpdate(updatedUser);
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const errorMessage = axiosError.response?.data?.message || 'Failed to update profile';
      setErrors({ general: errorMessage });
      if (onError) onError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle user activation/deactivation (admin only)
  const handleToggleActivation = async () => {
    if (!user || !isAdminView) return;

    try {
      if (user.isActive) {
        await userService.deactivateUser(user.id);
        setUser({ ...user, isActive: false });
      } else {
        await userService.activateUser(user.id);
        setUser({ ...user, isActive: true });
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const errorMessage = axiosError.response?.data?.message || 'Failed to update user status';
      setErrors({ general: errorMessage });
      if (onError) onError(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="bg-theme-bg-primary shadow-theme rounded-lg p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-theme-bg-tertiary rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-theme-bg-tertiary rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-theme-bg-tertiary rounded w-1/2"></div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-4 bg-theme-bg-tertiary rounded"></div>
            <div className="h-4 bg-theme-bg-tertiary rounded w-5/6"></div>
            <div className="h-4 bg-theme-bg-tertiary rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!displayUser) {
    return (
      <div className={`bg-theme-bg-danger border border-theme-border-danger rounded-md p-4 ${className}`}>
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-theme-interactive-danger" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-theme-interactive-danger">User profile not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-theme-bg-primary shadow-theme rounded-lg ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-theme-border-primary bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-theme-bg-primary rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-theme-interactive-primary">
                {displayUser.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-theme-text-primary">
                {isAdminView ? `${displayUser.username}'s Profile` : 'My Profile'}
              </h2>
              <p className="text-sm text-theme-text-tertiary">
                {displayUser.roles.join(', ')} • {displayUser.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>
          {!isEditing && (
            <div className="flex space-x-2">
              {isAdminView && (
                <button
                  onClick={handleToggleActivation}
                  className={`px-3 py-1 text-sm font-medium rounded-md ${
                    displayUser.isActive
                      ? 'bg-theme-bg-danger text-theme-interactive-danger hover:bg-theme-bg-tertiary'
                      : 'bg-theme-bg-success text-theme-interactive-success hover:bg-theme-bg-tertiary'
                  }`}
                >
                  {displayUser.isActive ? 'Deactivate' : 'Activate'}
                </button>
              )}
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1 text-sm font-medium text-theme-interactive-primary bg-theme-bg-primary rounded-md hover:bg-theme-bg-tertiary"
              >
                Edit
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-4">
        {errors.general && (
          <div className="mb-4 bg-theme-bg-danger border border-theme-border-danger rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-theme-interactive-danger" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-theme-interactive-danger">{errors.general}</p>
              </div>
            </div>
          </div>
        )}

        {!isAdminView && (
          <div className="mb-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-medium text-theme-text-secondary">Token Balance</h3>
              {!billingDisabled && (
                <button
                  type="button"
                  onClick={handleRefreshBalance}
                  disabled={isBalanceLoading}
                  className="text-xs font-medium text-theme-interactive-primary hover:text-theme-interactive-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isBalanceLoading ? 'Refreshing…' : 'Refresh balance'}
                </button>
              )}
            </div>
            {renderBalanceSection()}
          </div>
        )}

        {!isAdminView && !billingDisabled && !balanceError && (
          <TokenTopUp className="mb-6" />
        )}

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-theme-text-secondary">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username || ''}
                onChange={handleInputChange}
                className={`mt-1 block w-full border rounded-md shadow-sm focus:ring-theme-interactive-primary focus:border-theme-interactive-primary sm:text-sm ${
                  errors.username ? 'border-theme-border-danger' : 'border-theme-border-primary'
                }`}
                disabled={isSaving}
              />
              {errors.username && (
                <p className="mt-1 text-sm text-theme-interactive-danger">{errors.username}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-theme-text-secondary">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email || ''}
                onChange={handleInputChange}
                className={`mt-1 block w-full border rounded-md shadow-sm focus:ring-theme-interactive-primary focus:border-theme-interactive-primary sm:text-sm ${
                  errors.email ? 'border-theme-border-danger' : 'border-theme-border-primary'
                }`}
                disabled={isSaving}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-theme-interactive-danger">{errors.email}</p>
              )}
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 bg-theme-interactive-primary text-theme-text-primary py-2 px-4 rounded-md hover:bg-theme-interactive-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-interactive-primary disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setErrors({});
                  setFormData({
                    username: displayUser.username,
                    email: displayUser.email
                  });
                }}
                className="flex-1 bg-theme-bg-tertiary text-theme-text-secondary py-2 px-4 rounded-md hover:bg-theme-bg-tertiary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-focus-ring"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-theme-text-secondary">Username</label>
              <p className="mt-1 text-sm text-theme-text-primary">{displayUser.username}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-theme-text-secondary">Email Address</label>
              <p className="mt-1 text-sm text-theme-text-primary">{displayUser.email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-theme-text-secondary">Account Status</label>
              <p className="mt-1 text-sm text-theme-text-primary">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  displayUser.isActive 
                    ? 'bg-theme-bg-success text-theme-interactive-success' 
                    : 'bg-theme-bg-danger text-theme-interactive-danger'
                }`}>
                  {displayUser.isActive ? 'Active' : 'Inactive'}
                </span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-theme-text-secondary">Roles</label>
              <div className="mt-1 flex flex-wrap gap-2">
                {displayUser.roles.map((role) => (
                  <span
                    key={role}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-theme-bg-info text-theme-interactive-info"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-theme-text-secondary">Member Since</label>
              <p className="mt-1 text-sm text-theme-text-primary">
                {new Date(displayUser.createdAt).toLocaleDateString()}
              </p>
            </div>

            {displayUser.lastLoginDate && (
              <div>
                <label className="block text-sm font-medium text-theme-text-secondary">Last Login</label>
                <p className="mt-1 text-sm text-theme-text-primary">
                  {new Date(displayUser.lastLoginDate).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile; 