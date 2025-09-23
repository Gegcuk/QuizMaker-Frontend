// src/components/UserSettings.tsx
// ---------------------------------------------------------------------------
// User preferences and settings component
// ---------------------------------------------------------------------------

import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useAuth } from '@/features/auth';
import { userService } from '@/services';
import type { AxiosError } from 'axios';

interface UserSettingsProps {
  onSave?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

interface UserSettings {
  emailNotifications: {
    quizResults: boolean;
    newQuizzes: boolean;
    systemUpdates: boolean;
    marketing: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'friends';
    showEmail: boolean;
    showLastLogin: boolean;
  };
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    timezone: string;
    dateFormat: string;
  };
  security: {
    twoFactorEnabled: boolean;
    sessionTimeout: number;
    loginNotifications: boolean;
  };
}

interface FormErrors {
  general?: string;
}

const UserSettings: React.FC<UserSettingsProps> = ({
  onSave,
  onError,
  className = ''
}) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>({
    emailNotifications: {
      quizResults: true,
      newQuizzes: true,
      systemUpdates: true,
      marketing: false,
    },
    privacy: {
      profileVisibility: 'public',
      showEmail: false,
      showLastLogin: true,
    },
    preferences: {
      theme: 'auto',
      language: 'en',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
    },
    security: {
      twoFactorEnabled: false,
      sessionTimeout: 30,
      loginNotifications: true,
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Load user settings
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        // TODO: Implement actual settings loading from API
        // const userSettings = await userService.getUserSettings();
        // setSettings(userSettings);
        
        // For now, use default settings
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        const errorMessage = axiosError.response?.data?.message || 'Failed to load settings';
        setErrors({ general: errorMessage });
        if (onError) onError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [user, onError]);

  // Handle settings changes
  const handleSettingChange = (category: keyof UserSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsSaving(true);
    try {
      // TODO: Implement actual settings saving to API
      // await userService.updateUserSettings(settings);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setErrors({});
      if (onSave) onSave();
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const errorMessage = axiosError.response?.data?.message || 'Failed to save settings';
      setErrors({ general: errorMessage });
      if (onError) onError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="bg-theme-bg-primary shadow-theme rounded-lg p-6">
          <div className="h-6 bg-theme-bg-tertiary rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-theme-bg-tertiary rounded"></div>
            <div className="h-4 bg-theme-bg-tertiary rounded w-5/6"></div>
            <div className="h-4 bg-theme-bg-tertiary rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-theme-bg-primary shadow-theme rounded-lg ${className}`}>
      <div className="px-6 py-4 border-b border-theme-border-primary">
        <h2 className="text-xl font-semibold text-theme-text-primary">Settings</h2>
        <p className="mt-1 text-sm text-theme-text-tertiary">
          Manage your account preferences and privacy settings
        </p>
      </div>

      <form onSubmit={handleSubmit} className="divide-y divide-theme-border-primary">
        {errors.general && (
          <div className="px-6 py-4 bg-red-50 border-b border-red-200">
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

        {/* Email Notifications */}
        <div className="px-6 py-4">
          <h3 className="text-lg font-medium text-theme-text-primary mb-4">Email Notifications</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-theme-text-secondary">Quiz Results</p>
                <p className="text-sm text-theme-text-tertiary">Receive email notifications when you complete quizzes</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.emailNotifications.quizResults}
                  onChange={(e) => handleSettingChange('emailNotifications', 'quizResults', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-theme-bg-tertiary peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-theme-interactive-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-theme-bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-theme-bg-primary after:border-theme-border-primary after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-theme-interactive-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-theme-text-secondary">New Quizzes</p>
                <p className="text-sm text-theme-text-tertiary">Get notified about new quizzes in your categories</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.emailNotifications.newQuizzes}
                  onChange={(e) => handleSettingChange('emailNotifications', 'newQuizzes', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-theme-bg-tertiary peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-theme-interactive-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-theme-bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-theme-bg-primary after:border-theme-border-primary after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-theme-interactive-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-theme-text-secondary">System Updates</p>
                <p className="text-sm text-theme-text-tertiary">Receive important system announcements</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.emailNotifications.systemUpdates}
                  onChange={(e) => handleSettingChange('emailNotifications', 'systemUpdates', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-theme-bg-tertiary peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-theme-interactive-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-theme-bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-theme-bg-primary after:border-theme-border-primary after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-theme-interactive-primary"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="px-6 py-4">
          <h3 className="text-lg font-medium text-theme-text-primary mb-4">Privacy</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-theme-text-secondary mb-2">
                Profile Visibility
              </label>
              <select
                value={settings.privacy.profileVisibility}
                onChange={(e) => handleSettingChange('privacy', 'profileVisibility', e.target.value)}
                className="block w-full border-theme-border-primary rounded-md shadow-sm focus:ring-theme-interactive-primary focus:border-theme-interactive-primary sm:text-sm"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="friends">Friends Only</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-theme-text-secondary">Show Email Address</p>
                <p className="text-sm text-theme-text-tertiary">Allow other users to see your email address</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.privacy.showEmail}
                  onChange={(e) => handleSettingChange('privacy', 'showEmail', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-theme-bg-tertiary peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-theme-interactive-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-theme-bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-theme-bg-primary after:border-theme-border-primary after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-theme-interactive-primary"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="px-6 py-4">
          <h3 className="text-lg font-medium text-theme-text-primary mb-4">Preferences</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-theme-text-secondary mb-2">
                Theme
              </label>
              <select
                value={settings.preferences.theme}
                onChange={(e) => handleSettingChange('preferences', 'theme', e.target.value)}
                className="block w-full border-theme-border-primary rounded-md shadow-sm focus:ring-theme-interactive-primary focus:border-theme-interactive-primary sm:text-sm"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-theme-text-secondary mb-2">
                Language
              </label>
              <select
                value={settings.preferences.language}
                onChange={(e) => handleSettingChange('preferences', 'language', e.target.value)}
                className="block w-full border-theme-border-primary rounded-md shadow-sm focus:ring-theme-interactive-primary focus:border-theme-interactive-primary sm:text-sm"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="px-6 py-4">
          <h3 className="text-lg font-medium text-theme-text-primary mb-4">Security</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-theme-text-secondary">Two-Factor Authentication</p>
                <p className="text-sm text-theme-text-tertiary">Add an extra layer of security to your account</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.security.twoFactorEnabled}
                  onChange={(e) => handleSettingChange('security', 'twoFactorEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-theme-bg-tertiary peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-theme-interactive-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-theme-bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-theme-bg-primary after:border-theme-border-primary after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-theme-interactive-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-theme-text-secondary">Login Notifications</p>
                <p className="text-sm text-theme-text-tertiary">Get notified of new login attempts</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.security.loginNotifications}
                  onChange={(e) => handleSettingChange('security', 'loginNotifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-theme-bg-tertiary peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-theme-interactive-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-theme-bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-theme-bg-primary after:border-theme-border-primary after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-theme-interactive-primary"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="px-6 py-4 bg-theme-bg-secondary">
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="bg-theme-interactive-primary text-white py-2 px-4 rounded-md hover:bg-theme-interactive-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-interactive-primary disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default UserSettings; 