import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { UserRole } from '@/types';

interface UserMenuProps {
  className?: string;
}

const UserMenu: React.FC<UserMenuProps> = ({ className = '' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    // Close dropdown on escape key
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    setError(null);
  };

  const handleLogout = async () => {
    if (!window.confirm('Are you sure you want to logout?')) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await logout();
      setIsOpen(false);
    } catch (err) {
      setError('Logout failed. Please try again.');
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileClick = () => {
    navigate('/profile');
    setIsOpen(false);
  };

  const handleSettingsClick = () => {
    navigate('/settings');
    setIsOpen(false);
  };

  const handleAdminClick = () => {
    navigate('/admin');
    setIsOpen(false);
  };

  const handleMyQuizzesClick = () => {
    navigate('/my-quizzes');
    setIsOpen(false);
  };

  const handleCreateQuizClick = () => {
    navigate('/quizzes/create');
    setIsOpen(false);
  };

  // Get user initials for avatar
  const getUserInitials = (username: string) => {
    return username
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Check if user has specific role
  const hasRole = (role: UserRole) => {
    return user?.roles.includes(role) || false;
  };

  // Get role display name
  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      'ROLE_USER': 'User',
      'ROLE_QUIZ_CREATOR': 'Quiz Creator',
      'ROLE_MODERATOR': 'Moderator',
      'ROLE_ADMIN': 'Administrator',
      'ROLE_SUPER_ADMIN': 'Super Administrator'
    };
    return roleMap[role] || role;
  };

  // Get primary role for display
  const getPrimaryRole = () => {
    if (!user?.roles.length) return 'User';
    
    const rolePriority = [
      'ROLE_SUPER_ADMIN',
      'ROLE_ADMIN', 
      'ROLE_MODERATOR',
      'ROLE_QUIZ_CREATOR',
      'ROLE_USER'
    ];

    for (const role of rolePriority) {
      if (user.roles.includes(role)) {
        return getRoleDisplayName(role);
      }
    }
    
    return getRoleDisplayName(user.roles[0]);
  };

  if (!user) {
    return null;
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* User Avatar Button */}
      <button
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle();
          }
        }}
        className="flex items-center space-x-2 p-2 rounded-full hover:bg-theme-bg-secondary focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:ring-offset-2 transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User menu"
      >
        {/* Avatar */}
        <div className="w-8 h-8 bg-theme-interactive-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
          {getUserInitials(user.username)}
        </div>
        
        {/* User Info - Hidden on mobile */}
        <div className="hidden sm:block text-left">
          <div className="text-sm font-medium text-theme-text-primary truncate max-w-32">
            {user.username}
          </div>
          <div className="text-xs text-theme-text-tertiary truncate max-w-32">
            {user.email}
          </div>
        </div>

        {/* Dropdown Arrow */}
        <svg
          className={`w-4 h-4 text-theme-text-tertiary transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-theme-bg-primary rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1" role="menu" aria-orientation="vertical">
            {/* User Info Header */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-theme-interactive-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {getUserInitials(user.username)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-theme-text-primary truncate">
                    {user.username}
                  </p>
                  <p className="text-sm text-theme-text-tertiary truncate">
                    {user.email}
                  </p>
                  <p className="text-xs text-theme-text-tertiary mt-1">
                    {getPrimaryRole()}
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Actions */}
            <div className="py-1">
              <button
                onClick={handleProfileClick}
                className="w-full text-left px-4 py-2 text-sm text-theme-text-secondary hover:bg-theme-bg-secondary focus:bg-theme-bg-secondary focus:outline-none transition-colors"
                role="menuitem"
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Profile</span>
                </div>
              </button>

              <button
                onClick={handleSettingsClick}
                className="w-full text-left px-4 py-2 text-sm text-theme-text-secondary hover:bg-theme-bg-secondary focus:bg-theme-bg-secondary focus:outline-none transition-colors"
                role="menuitem"
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Settings</span>
                </div>
              </button>
            </div>

            {/* Role-Based Actions */}
            {(hasRole('ROLE_QUIZ_CREATOR') || hasRole('ROLE_ADMIN') || hasRole('ROLE_SUPER_ADMIN')) && (
              <div className="py-1 border-t border-gray-100">
                <button
                  onClick={handleMyQuizzesClick}
                  className="w-full text-left px-4 py-2 text-sm text-theme-text-secondary hover:bg-theme-bg-secondary focus:bg-theme-bg-secondary focus:outline-none transition-colors"
                  role="menuitem"
                >
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>My Quizzes</span>
                  </div>
                </button>

                <button
                  onClick={handleCreateQuizClick}
                  className="w-full text-left px-4 py-2 text-sm text-theme-text-secondary hover:bg-theme-bg-secondary focus:bg-theme-bg-secondary focus:outline-none transition-colors"
                  role="menuitem"
                >
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Create Quiz</span>
                  </div>
                </button>
              </div>
            )}

            {/* Admin Actions */}
            {(hasRole('ROLE_ADMIN') || hasRole('ROLE_SUPER_ADMIN')) && (
              <div className="py-1 border-t border-gray-100">
                <button
                  onClick={handleAdminClick}
                  className="w-full text-left px-4 py-2 text-sm text-theme-text-secondary hover:bg-theme-bg-secondary focus:bg-theme-bg-secondary focus:outline-none transition-colors"
                  role="menuitem"
                >
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span>Admin Panel</span>
                  </div>
                </button>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="px-4 py-2 text-sm text-theme-interactive-danger bg-theme-bg-danger border-t border-gray-100">
                {error}
              </div>
            )}

            {/* Logout Action */}
            <div className="py-1 border-t border-gray-100">
              <button
                onClick={handleLogout}
                disabled={isLoading}
                className="w-full text-left px-4 py-2 text-sm text-theme-interactive-danger hover:bg-theme-bg-danger focus:bg-theme-bg-danger focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                role="menuitem"
              >
                <div className="flex items-center space-x-2">
                  {isLoading ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  )}
                  <span>{isLoading ? 'Logging out...' : 'Logout'}</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu; 