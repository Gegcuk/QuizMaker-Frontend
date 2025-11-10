// src/components/UserProfile.tsx
// ---------------------------------------------------------------------------
// User profile display and editing component based on UserDto
// ---------------------------------------------------------------------------

import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useAuth, LinkedAccounts } from '@/features/auth';
import { UserDto, UserProfileResponse } from '@/types';
import { userService } from '@/services';
import type { AxiosError } from 'axios';
import { Button, Input } from '@/components';

interface UserProfileProps {
  userId?: string; // If provided, shows admin view for specific user
  onUpdate?: (user: UserProfileResponse) => void;
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
  const [user, setUser] = useState<UserProfileResponse | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Form state for editing
  const [formData, setFormData] = useState<Partial<UserProfileResponse>>({});

  // Determine if this is admin view
  const isAdminView = !!userId && userId !== currentUser?.id;
  // For admin view, displayUser should be the loaded user (UserProfileResponse)
  // For own profile, use currentUser until profile is loaded
  const displayUser = user || (currentUser as any);

  // Load user data
  useEffect(() => {
    const loadUser = async () => {
      setIsLoading(true);
      try {
        if (userId && userId !== currentUser?.id) {
          // Admin view - load specific user (endpoint not implemented in backend yet)
          // For now, show error message
          setErrors({ general: 'Admin user view not yet implemented' });
        } else {
          // Own profile view - load full profile from API
          const userData = await userService.getUserProfile();
          setUser(userData);
          setFormData({
            username: userData.username,
            email: userData.email,
            displayName: userData.displayName || '',
            bio: userData.bio || ''
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
  }, [userId, currentUser, onError]);

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
    // Admin user management endpoints not yet implemented in backend
    if (!user || !isAdminView) return;
    
    // TODO: Implement when backend endpoints are available
    console.warn('Admin user management not yet implemented');
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
                @{displayUser.username}
              </p>
            </div>
          </div>
          {!isEditing && (
            <div className="flex space-x-2">
              {isAdminView && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleToggleActivation}
                  disabled
                  title="Admin user management not yet implemented"
                >
                  Manage User
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
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

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              id="username"
              name="username"
              label="Username"
              value={formData.username || ''}
              onChange={handleInputChange}
              error={errors.username}
              disabled={isSaving}
              fullWidth
            />

            <Input
              type="email"
              id="email"
              name="email"
              label="Email Address"
              value={formData.email || ''}
              onChange={handleInputChange}
              error={errors.email}
              disabled={isSaving}
              fullWidth
            />

            <div className="flex space-x-3 pt-4">
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isSaving}
                loading={isSaving}
                fullWidth
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => {
                  setIsEditing(false);
                  setErrors({});
                  setFormData({
                    username: displayUser.username,
                    email: displayUser.email
                  });
                }}
                fullWidth
              >
                Cancel
              </Button>
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
                  displayUser.verified 
                    ? 'bg-theme-bg-success text-theme-interactive-success' 
                    : 'bg-theme-bg-warning text-theme-interactive-warning'
                }`}>
                  {displayUser.verified ? 'Email Verified' : 'Email Not Verified'}
                </span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-theme-text-secondary">Roles</label>
              <div className="mt-1 flex flex-wrap gap-2">
                {displayUser.roles.map((role: string) => (
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
                {new Date(displayUser.joinedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Linked OAuth Accounts Section */}
      {!isAdminView && (
        <div className="px-6 py-4 border-t border-theme-border-primary">
          <h3 className="text-sm font-medium text-theme-text-secondary mb-4">Connected Accounts</h3>
          <LinkedAccounts />
        </div>
      )}
    </div>
  );
};

export default UserProfile; 