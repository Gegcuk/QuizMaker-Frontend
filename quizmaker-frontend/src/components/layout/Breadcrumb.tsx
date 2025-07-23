import React, { useMemo } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';

// Simple chevron icon for breadcrumb separators
const ChevronRightIcon = () => (
  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
  </svg>
);

// Ellipsis icon for mobile collapse
const EllipsisIcon = () => (
  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
    <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
  </svg>
);

interface BreadcrumbItem {
  label: string;
  path: string;
  isCurrent?: boolean;
}

interface CollapsedItem {
  label: string;
  path: string;
  isCollapsed: boolean;
}

interface BreadcrumbProps {
  customItems?: BreadcrumbItem[];
  showHome?: boolean;
  maxItems?: number; // For mobile collapse
  className?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({
  customItems,
  showHome = true,
  maxItems = 4, // Show max 4 items on mobile, collapse middle ones
  className = '',
}) => {
  const location = useLocation();
  const params = useParams();

  // Route to label mapping for dynamic generation
  const routeLabels: Record<string, string> = {
    '/': 'Home',
    '/quizzes': 'All Quizzes',
    '/my-quizzes': 'My Quizzes',
    '/quizzes/create': 'Create Quiz',
    '/tags': 'Tags',
    '/categories': 'Categories',
    '/questions': 'Questions',
    '/admin': 'Admin',
    '/profile': 'Profile',
    '/settings': 'Settings',
    '/analytics': 'Analytics',
    '/documents': 'Documents',
    '/help': 'Help',
    '/about': 'About',
    '/contact': 'Contact',
    '/privacy': 'Privacy Policy',
    '/terms': 'Terms of Service',
  };

  // Dynamic label generation for parameterized routes
  const getDynamicLabel = (path: string, segment: string): string => {
    // Handle quiz-specific routes
    if (path.includes('/quizzes/') && params.quizId) {
      if (path.includes('/attempt')) return 'Attempt Quiz';
      if (path.includes('/results')) return 'Quiz Results';
      if (path.includes('/edit')) return 'Edit Quiz';
      if (path.includes('/questions')) return 'Quiz Questions';
      if (path.includes('/results-summary')) return 'Results Summary';
      return 'Quiz Detail';
    }

    // Handle admin routes
    if (path.includes('/admin/')) {
      if (path.includes('/users')) return 'User Management';
      if (path.includes('/roles')) return 'Role Management';
      if (path.includes('/system')) return 'System Settings';
      return 'Admin';
    }

    // Default fallback
    return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
  };

  // Generate breadcrumb items from current route
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (customItems) {
      return customItems;
    }

    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Add home if requested
    if (showHome) {
      breadcrumbs.push({
        label: 'Home',
        path: '/',
        isCurrent: pathSegments.length === 0,
      });
    }

    // Build path progressively
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;
      
      // Get label from mapping or generate dynamically
      const label = routeLabels[currentPath] || getDynamicLabel(currentPath, segment);
      
      breadcrumbs.push({
        label,
        path: currentPath,
        isCurrent: isLast,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = useMemo(() => generateBreadcrumbs(), [location.pathname, customItems, showHome]);

  // Handle mobile collapse
  const shouldCollapse = breadcrumbs.length > maxItems;
  const getVisibleItems = (): (BreadcrumbItem | CollapsedItem)[] => {
    if (!shouldCollapse) return breadcrumbs;

    const firstItem = breadcrumbs[0];
    const lastItem = breadcrumbs[breadcrumbs.length - 1];
    const middleItems = breadcrumbs.slice(1, -1);

    return [
      firstItem,
      { label: '...', path: '', isCollapsed: true },
      ...middleItems.slice(-1), // Show last middle item
      lastItem,
    ];
  };

  const visibleItems = getVisibleItems();

  if (breadcrumbs.length <= 1) {
    return null; // Don't show breadcrumb for single-level pages
  }

  return (
    <nav className={`flex items-center space-x-1 text-sm ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1">
                 {visibleItems.map((item, index) => {
           const isLast = index === visibleItems.length - 1;
           const isCollapsed = 'isCollapsed' in item && item.isCollapsed;
           const isCurrent = 'isCurrent' in item && item.isCurrent;

           return (
            <li key={index} className="flex items-center">
              {/* Separator */}
              {index > 0 && !isCollapsed && (
                <ChevronRightIcon />
              )}

              {/* Breadcrumb Item */}
              <div className="flex items-center">
                {isCollapsed ? (
                  // Collapsed items (ellipsis)
                  <span className="px-2 py-1 text-gray-400">
                    <EllipsisIcon />
                  </span>
                                 ) : isCurrent ? (
                   // Current page (non-clickable, highlighted)
                   <span className="px-2 py-1 text-gray-900 font-medium truncate max-w-xs sm:max-w-md">
                     {item.label}
                   </span>
                ) : (
                  // Clickable breadcrumb item
                  <Link
                    to={item.path}
                    className="px-2 py-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors duration-200 truncate max-w-xs sm:max-w-md"
                    title={item.label}
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb; 