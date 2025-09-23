import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth';

// Heroicons imports (you'll need to install @heroicons/react)
// If you prefer FontAwesome, replace these with FontAwesome icons
import {
  HomeIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  FolderIcon,
  ChartBarIcon,
  CogIcon,
  UserIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  Bars3Icon,
  DocumentDuplicateIcon,
  TagIcon,
  QuestionMarkCircleIcon,
  ClipboardDocumentListIcon,
  ShieldCheckIcon,
  ArrowRightStartOnRectangleIcon,
  UserCircleIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  roles?: string[];
  children?: Omit<MenuItem, 'children'>[];
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, onClose }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const { user, isLoggedIn, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Auto-collapse on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('sidebar');
      const toggleButton = document.getElementById('sidebar-toggle');
      
      if (
        isOpen &&
        sidebar &&
        !sidebar.contains(event.target as Node) &&
        toggleButton &&
        !toggleButton.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const hasRole = (requiredRoles?: string[]) => {
    if (!requiredRoles || !user) return true;
    return requiredRoles.some(role => user.roles.includes(role));
  };

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: HomeIcon,
      path: '/',
    },
    {
      id: 'quiz-management',
      label: 'Quiz Management',
      icon: AcademicCapIcon,
      path: '/quizzes',
      children: [
        {
          id: 'all-quizzes',
          label: 'All Quizzes',
          icon: ClipboardDocumentListIcon,
          path: '/quizzes',
        },
        {
          id: 'my-quizzes',
          label: 'My Quizzes',
          icon: DocumentDuplicateIcon,
          path: '/my-quizzes',
        },
        {
          id: 'create-quiz',
          label: 'Create Quiz',
          icon: AcademicCapIcon,
          path: '/quizzes/create',
        },
      ],
    },
    {
      id: 'question-management',
      label: 'Question Management',
      icon: QuestionMarkCircleIcon,
      path: '/questions',
      roles: ['ROLE_QUIZ_CREATOR', 'ROLE_MODERATOR', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN'],
    },
    {
      id: 'document-management',
      label: 'Document Management',
      icon: DocumentTextIcon,
      path: '/documents',
      roles: ['ROLE_QUIZ_CREATOR', 'ROLE_MODERATOR', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN'],
      children: [
        {
          id: 'documents',
          label: 'All Documents',
          icon: DocumentTextIcon,
          path: '/documents',
        },
        {
          id: 'upload-document',
          label: 'Upload Document',
          icon: DocumentTextIcon,
          path: '/documents/upload',
        },
        
      ],
    },
  ];

  const userMenuItems = [
    {
      id: 'profile',
      label: 'Profile',
      icon: UserCircleIcon,
      path: '/profile',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: AdjustmentsHorizontalIcon,
      path: '/settings',
    },
  ];

  const filteredMenuItems = menuItems.filter(item => hasRole(item.roles));

  const renderMenuItem = (item: MenuItem, isChild = false) => {
    const Icon = item.icon;
    const active = isActive(item.path);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedSections.includes(item.id);

    if (hasChildren) {
      return (
        <div key={item.id} className="space-y-1">
          <button
            onClick={() => toggleSection(item.id)}
            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              active
                ? 'bg-theme-bg-tertiary text-theme-text-primary'
                : 'text-theme-text-secondary hover:bg-theme-bg-tertiary hover:text-theme-text-primary'
            } ${isChild ? 'pl-6' : ''}`}
          >
            <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
            {!isCollapsed && (
              <>
                <span className="flex-1 text-left">{item.label}</span>
                <ChevronRightIcon
                  className={`h-4 w-4 transition-transform ${
                    isExpanded ? 'rotate-90' : ''
                  }`}
                />
              </>
            )}
          </button>
          {isExpanded && !isCollapsed && (
            <div className="ml-4 space-y-1">
              {item.children!.map(child => renderMenuItem(child, true))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.id}
        to={item.path}
        className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
          active
            ? 'bg-theme-bg-tertiary text-theme-text-primary'
            : 'text-theme-text-secondary hover:bg-theme-bg-tertiary hover:text-theme-text-primary'
        } ${isChild ? 'pl-6' : ''}`}
        onClick={() => {
          if (window.innerWidth < 768) {
            onClose();
          }
        }}
      >
        <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
        {!isCollapsed && <span>{item.label}</span>}
      </Link>
    );
  };

  const renderUserMenu = () => {
    if (!isLoggedIn || !user) return null;

    return (
      <div className="border-t border-theme-border-primary pt-4 mt-4">
        <div className="px-3 py-2">
          {!isCollapsed && (
            <div className="flex items-center mb-3">
              <UserCircleIcon className="h-8 w-8 text-theme-text-tertiary" />
              <div className="ml-3">
                <p className="text-sm font-medium text-theme-text-secondary">{user.username}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </div>
          )}
          
          {/* User Menu Items */}
          <div className="space-y-1">
            {userMenuItems.map(item => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    active
                      ? 'bg-theme-bg-tertiary text-theme-text-primary'
                      : 'text-theme-text-secondary hover:bg-theme-bg-tertiary hover:text-theme-text-primary'
                  }`}
                  onClick={() => {
                    if (window.innerWidth < 768) {
                      onClose();
                    }
                  }}
                >
                  <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
            
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-theme-text-secondary hover:bg-theme-bg-tertiary hover:text-theme-text-primary rounded-md transition-colors"
            >
              <ArrowRightStartOnRectangleIcon className="h-5 w-5 mr-3 flex-shrink-0" />
              {!isCollapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden" />
      )}

      {/* Sidebar */}
      <div
        id="sidebar"
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'w-16' : 'w-64'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-theme-border-primary">
          {!isCollapsed && (
            <Link to="/quizzes" className="text-xl font-semibold text-gray-900">
              QuizMaker
            </Link>
          )}
          
          <div className="flex items-center space-x-2">
            {/* Search Bar */}
            {!isCollapsed && (
              <div className="relative flex-1 max-w-xs">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-theme-text-tertiary" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
            
            {/* Toggle Collapse Button */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 text-theme-text-tertiary hover:text-theme-text-primary hover:bg-theme-bg-tertiary rounded-md transition-colors"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronRightIcon className="h-5 w-5" />
              ) : (
                <ChevronLeftIcon className="h-5 w-5" />
              )}
            </button>
            
            {/* Close Button (mobile only) */}
            <button
              onClick={onClose}
              className="lg:hidden p-2 text-theme-text-tertiary hover:text-theme-text-primary hover:bg-theme-bg-tertiary rounded-md transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
          {filteredMenuItems.map(item => renderMenuItem(item))}
        </nav>

        {/* User Menu */}
        {renderUserMenu()}
      </div>
    </>
  );
};

export default Sidebar; 