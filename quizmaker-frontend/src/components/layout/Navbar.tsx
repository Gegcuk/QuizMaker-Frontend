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
      {hasRole(['ROLE_QUIZ_CREATOR', 'ROLE_MODERATOR', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN']) && (
        <Link to="/documents" className={linkClasses}>
          Documents
        </Link>
      )}
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
      {hasRole(['ROLE_QUIZ_CREATOR', 'ROLE_MODERATOR', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN']) && (
        <Link to="/documents" className={mobileLinkClasses}>
          Documents
        </Link>
      )}
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
    <header className="bg-theme-bg-primary border-b border-theme-border-primary shadow-theme sticky top-0 z-50 bg-theme-bg-primary text-theme-text-primary">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* ----- Logo / site title ------------------------------------ */}
          <Link 
            to="/quizzes" 
            className="text-xl font-bold text-theme-text-primary hover:text-theme-interactive-primary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:ring-offset-2 focus:ring-offset-theme-bg-primary rounded-lg px-2 py-1"
          >
            Quizzence
          </Link>

          {/* ----- Desktop links (hidden on mobile via md:flex) ---------- */}
          <div className="hidden md:flex items-center space-x-1">
            {isLoggedIn ? authLinks : guestLinks}
          </div>

          {/* ----- Right side controls ------------------------------------ */}
          <div className="flex items-center space-x-3">
            {/* Color Scheme Dropdown */}
            <ColorSchemeDropdown />
            
            {/* Profile Icon (desktop only) */}
            {isLoggedIn && (
              <Link
                to="/profile"
                aria-label="Profile"
                className="hidden md:flex p-2 rounded-lg text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-tertiary focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:ring-offset-2 focus:ring-offset-theme-bg-primary transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Link>
            )}
            
            {/* Settings Icon (desktop only) */}
            {isLoggedIn && (
              <Link
                to="/settings"
                aria-label="Settings"
                className="hidden md:flex p-2 rounded-lg text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-tertiary focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:ring-offset-2 focus:ring-offset-theme-bg-primary transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>
            )}
            
            {/* Logout Icon (desktop only) */}
            {isLoggedIn && (
              <button
                onClick={handleLogout}
                aria-label="Logout"
                className="hidden md:flex p-2 rounded-lg text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-tertiary focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:ring-offset-2 focus:ring-offset-theme-bg-primary transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            )}
            
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
          <div className="md:hidden border-t border-theme-border-primary bg-theme-bg-primary bg-theme-bg-primary text-theme-text-primary">
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
