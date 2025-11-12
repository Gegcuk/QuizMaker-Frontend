// src/components/UserSettings.tsx
// ---------------------------------------------------------------------------
// User preferences and settings component
// ---------------------------------------------------------------------------

import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useAuth } from '@/features/auth';
import { userService } from '@/services';
import type { AxiosError } from 'axios';
import { Button, Dropdown, Alert, Switch } from '@/components';

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
      <div className="px-6 py-4 border-b border-theme-border-primary bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary">
        <h2 className="text-xl font-semibold text-theme-text-primary">Settings</h2>
        <p className="mt-1 text-sm text-theme-text-tertiary">
          Manage your account preferences and privacy settings
        </p>
      </div>

      <form onSubmit={handleSubmit} className="divide-y divide-theme-border-primary">
        {errors.general && (
          <div className="px-6 py-4">
            <Alert type="error" dismissible onDismiss={() => setErrors({})}>
              {errors.general}
            </Alert>
          </div>
        )}

        {/* Email Notifications */}
        <div className="px-6 py-4">
          <h3 className="text-lg font-medium text-theme-text-primary mb-4">Email Notifications</h3>
          <div className="space-y-4">
            <Switch
              label="Quiz Results"
              description="Receive email notifications when you complete quizzes"
              checked={settings.emailNotifications.quizResults}
              onChange={(checked) => handleSettingChange('emailNotifications', 'quizResults', checked)}
            />

            <Switch
              label="New Quizzes"
              description="Get notified about new quizzes in your categories"
              checked={settings.emailNotifications.newQuizzes}
              onChange={(checked) => handleSettingChange('emailNotifications', 'newQuizzes', checked)}
            />

            <Switch
              label="System Updates"
              description="Receive important system announcements"
              checked={settings.emailNotifications.systemUpdates}
              onChange={(checked) => handleSettingChange('emailNotifications', 'systemUpdates', checked)}
            />
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
              <Dropdown
                value={settings.privacy.profileVisibility}
                onChange={(value) => handleSettingChange('privacy', 'profileVisibility', typeof value === 'string' ? value : value[0])}
                options={[
                  { label: 'Public', value: 'public' },
                  { label: 'Private', value: 'private' },
                  { label: 'Friends Only', value: 'friends' }
                ]}
              />
            </div>

            <Switch
              label="Show Email Address"
              description="Allow other users to see your email address"
              checked={settings.privacy.showEmail}
              onChange={(checked) => handleSettingChange('privacy', 'showEmail', checked)}
            />
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
              <Dropdown
                value={settings.preferences.theme}
                onChange={(value) => handleSettingChange('preferences', 'theme', typeof value === 'string' ? value : value[0])}
                options={[
                  { label: 'Light', value: 'light' },
                  { label: 'Dark', value: 'dark' },
                  { label: 'Auto', value: 'auto' }
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-theme-text-secondary mb-2">
                Language
              </label>
              <Dropdown
                value={settings.preferences.language}
                onChange={(value) => handleSettingChange('preferences', 'language', typeof value === 'string' ? value : value[0])}
                options={[
                  { label: 'English', value: 'en' },
                  { label: 'Spanish', value: 'es' },
                  { label: 'French', value: 'fr' },
                  { label: 'German', value: 'de' }
                ]}
              />
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="px-6 py-4">
          <h3 className="text-lg font-medium text-theme-text-primary mb-4">Security</h3>
          <div className="space-y-4">
            <Switch
              label="Two-Factor Authentication"
              description="Add an extra layer of security to your account"
              checked={settings.security.twoFactorEnabled}
              onChange={(checked) => handleSettingChange('security', 'twoFactorEnabled', checked)}
            />

            <Switch
              label="Login Notifications"
              description="Get notified of new login attempts"
              checked={settings.security.loginNotifications}
              onChange={(checked) => handleSettingChange('security', 'loginNotifications', checked)}
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="px-6 py-4 bg-theme-bg-secondary">
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSaving}
              loading={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default UserSettings; 