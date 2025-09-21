// src/components/UserProfile.tsx
// ---------------------------------------------------------------------------
// User profile display and editing component based on UserDto
// ---------------------------------------------------------------------------

import React, { useState, useEffect, FormEvent, ChangeEvent, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserDto } from '../../types/auth.types';
import { userService } from '../../api/user.service';
import type { AxiosError } from 'axios';
import { billingService } from '../../api/billing.service';
import type { BalanceDto } from '../../types/billing.types';
import TokenTopUp from './TokenTopUp';

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
        <div className="bg-white border border-indigo-100 rounded-lg p-4">
          <div className="animate-pulse grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="h-3 bg-indigo-100 rounded w-24 mb-2" />
              <div className="h-6 bg-indigo-100 rounded" />
            </div>
            <div>
              <div className="h-3 bg-indigo-100 rounded w-20 mb-2" />
              <div className="h-6 bg-indigo-100 rounded" />
            </div>
            <div>
              <div className="h-3 bg-indigo-100 rounded w-28 mb-2" />
              <div className="h-6 bg-indigo-100 rounded" />
            </div>
          </div>
        </div>
      );
    }

    if (billingDisabled) {
      return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
          Billing features are not enabled for this environment yet. Token balance will appear here once available.
        </div>
      );
    }

    if (balanceError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
          {balanceError}
        </div>
      );
    }

    if (balance) {
      return (
        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Available Tokens</p>
              <p className="mt-1 text-2xl font-semibold text-indigo-900">
                {balance.availableTokens.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Reserved Tokens</p>
              <p className="mt-1 text-lg font-semibold text-indigo-900">
                {balance.reservedTokens.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Last Updated</p>
              <p className="mt-1 text-sm text-indigo-900">
                {balance.updatedAt ? new Date(balance.updatedAt).toLocaleString() : '—'}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return null;
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
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-300 rounded w-1/2"></div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-300 rounded"></div>
            <div className="h-4 bg-gray-300 rounded w-5/6"></div>
            <div className="h-4 bg-gray-300 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!displayUser) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-md p-4 ${className}`}>
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-800">User profile not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white shadow rounded-lg ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-indigo-600">
                {displayUser.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isAdminView ? `${displayUser.username}'s Profile` : 'My Profile'}
              </h2>
              <p className="text-sm text-gray-500">
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
                      ? 'bg-red-100 text-red-800 hover:bg-red-200'
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                  }`}
                >
                  {displayUser.isActive ? 'Deactivate' : 'Activate'}
                </button>
              )}
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1 text-sm font-medium text-indigo-600 bg-indigo-100 rounded-md hover:bg-indigo-200"
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
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{errors.general}</p>
              </div>
            </div>
          </div>
        )}

        {!isAdminView && (
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-sm font-medium text-gray-700">Token Balance</h3>
              {!billingDisabled && (
                <button
                  type="button"
                  onClick={handleRefreshBalance}
                  disabled={isBalanceLoading}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
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
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username || ''}
                onChange={handleInputChange}
                className={`mt-1 block w-full border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                  errors.username ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={isSaving}
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email || ''}
                onChange={handleInputChange}
                className={`mt-1 block w-full border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={isSaving}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
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
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <p className="mt-1 text-sm text-gray-900">{displayUser.username}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <p className="mt-1 text-sm text-gray-900">{displayUser.email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Account Status</label>
              <p className="mt-1 text-sm text-gray-900">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  displayUser.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {displayUser.isActive ? 'Active' : 'Inactive'}
                </span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Roles</label>
              <div className="mt-1 flex flex-wrap gap-2">
                {displayUser.roles.map((role) => (
                  <span
                    key={role}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Member Since</label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(displayUser.createdAt).toLocaleDateString()}
              </p>
            </div>

            {displayUser.lastLoginDate && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Login</label>
                <p className="mt-1 text-sm text-gray-900">
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