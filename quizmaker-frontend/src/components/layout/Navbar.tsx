// src/components/Navbar.tsx
// ---------------------------------------------------------------------------
// Responsive site header.  Renders two different link sets depending on
// whether the user is logged in (from AuthContext).
//  • Desktop (≥ md): logo on the left, links inline on the right.
//  • Mobile  (< md): hamburger "☰" toggles a vertical dropdown.
// ---------------------------------------------------------------------------

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth';
import { ThemeToggle } from '../ui';
import ColorSchemeDropdown from '../ui/ColorSchemeDropdown';

const Navbar: React.FC = () => {
  const { isLoggedIn, user, logout } = useAuth();          // ← auth-aware menu
  const [isOpen, setIsOpen] = useState<boolean>(false); // ← mobile toggle
  const navigate = useNavigate();

  /** Handles the logout click: AuthProvider already handles navigation */
  const handleLogout = async () => {
    await logout();
  };

  /** Check if user has required role */
  const hasRole = (requiredRoles: string[]) => {
    if (!user?.roles) return false;
    return requiredRoles.some(role => user.roles.includes(role));
  };

  /* -------------------------------------------------------------------- */
  /*  Link groups – modern styling with consistent design                 */
  /* -------------------------------------------------------------------- */
  const linkClasses = "relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-theme-bg-tertiary text-theme-text-secondary hover:text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:ring-offset-2 focus:ring-offset-theme-bg-primary";
  const mobileLinkClasses = "block px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-theme-bg-tertiary text-theme-text-secondary hover:text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:ring-offset-2";
  
  const guestLinks = (
    <>
      <Link to="/login" className={linkClasses}>
        Login
      </Link>
      <Link to="/register" className={`${linkClasses} bg-theme-interactive-primary text-theme-text-inverse hover:bg-theme-interactive-primary-hover`}>
        Register
      </Link>
    </>
  );

  const guestMobileLinks = (
    <>
      <Link to="/login" className={mobileLinkClasses}>
        Login
      </Link>
      <Link to="/register" className={`${mobileLinkClasses} bg-theme-interactive-primary text-theme-text-inverse hover:bg-theme-interactive-primary-hover`}>
        Register
      </Link>
    </>
  );

  const authLinks = (
    <>
      <Link to="/quizzes" className={linkClasses}>
        All Quizzes
      </Link>
      <Link to="/my-quizzes" className={linkClasses}>
        My Quizzes
      </Link>
      <Link to="/questions" className={linkClasses}>
        Questions
      </Link>
      {hasRole(['ROLE_QUIZ_CREATOR', 'ROLE_MODERATOR', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN']) && (
        <Link to="/documents" className={linkClasses}>
          Documents
        </Link>
      )}
      <Link to="/profile" className={linkClasses}>
        Profile
      </Link>
      <Link to="/settings" className={linkClasses}>
        Settings
      </Link>
      <button
        onClick={handleLogout}
        className={`${linkClasses} text-left`}
      >
        Logout
      </button>
    </>
  );

  const authMobileLinks = (
    <>
      <Link to="/quizzes" className={mobileLinkClasses}>
        All Quizzes
      </Link>
      <Link to="/my-quizzes" className={mobileLinkClasses}>
        My Quizzes
      </Link>
      <Link to="/questions" className={mobileLinkClasses}>
        Questions
      </Link>
      {hasRole(['ROLE_QUIZ_CREATOR', 'ROLE_MODERATOR', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN']) && (
        <Link to="/documents" className={mobileLinkClasses}>
          Documents
        </Link>
      )}
      <Link to="/profile" className={mobileLinkClasses}>
        Profile
      </Link>
      <Link to="/settings" className={mobileLinkClasses}>
        Settings
      </Link>
      <button
        onClick={handleLogout}
        className={`${mobileLinkClasses} text-left`}
      >
        Logout
      </button>
    </>
  );

  return (
    <header className="bg-theme-bg-primary border-b border-theme-border-primary shadow-theme sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* ----- Logo / site title ------------------------------------ */}
          <Link 
            to="/quizzes" 
            className="text-xl font-bold text-theme-text-primary hover:text-theme-interactive-primary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:ring-offset-2 focus:ring-offset-theme-bg-primary rounded-lg px-2 py-1"
          >
            QuizMaker
          </Link>

          {/* ----- Desktop links (hidden on mobile via md:flex) ---------- */}
          <div className="hidden md:flex items-center space-x-1">
            {isLoggedIn ? authLinks : guestLinks}
          </div>

          {/* ----- Right side controls ------------------------------------ */}
          <div className="flex items-center space-x-3">
            {/* Color Scheme Dropdown */}
            <ColorSchemeDropdown />
            
            {/* Theme Toggle */}
            <ThemeToggle size="sm" />
            
            {/* ----- Modern hamburger button (only visible on mobile) ------------- */}
            <button
              aria-label="Toggle navigation menu"
              className="md:hidden p-2 rounded-lg text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-tertiary focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:ring-offset-2 focus:ring-offset-theme-bg-primary transition-all duration-200"
              onClick={() => setIsOpen((prev) => !prev)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* ----- Modern mobile dropdown (only when isOpen && below md) ---------- */}
        {isOpen && (
          <div className="md:hidden border-t border-theme-border-primary bg-theme-bg-primary">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {isLoggedIn ? authMobileLinks : guestMobileLinks}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
