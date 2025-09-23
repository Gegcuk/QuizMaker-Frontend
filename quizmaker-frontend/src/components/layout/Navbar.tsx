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
  /*  Link groups – decide once so JSX stays tidy                          */
  /* -------------------------------------------------------------------- */
  const guestLinks = (
    <>
      <Link to="/login" className="block px-4 py-2 hover:underline text-theme-text-secondary hover:text-theme-text-primary">
        Login
      </Link>
      <Link to="/register" className="block px-4 py-2 hover:underline text-theme-text-secondary hover:text-theme-text-primary">
        Register
      </Link>
    </>
  );

  const authLinks = (
    <>
      <Link to="/quizzes" className="block px-4 py-2 hover:underline text-theme-text-secondary hover:text-theme-text-primary">
        All Quizzes
      </Link>
      <Link to="/my-quizzes" className="block px-4 py-2 hover:underline text-theme-text-secondary hover:text-theme-text-primary">
        My Quizzes
      </Link>
      <Link to="/questions" className="block px-4 py-2 hover:underline text-theme-text-secondary hover:text-theme-text-primary">
        Questions
      </Link>
      {hasRole(['ROLE_QUIZ_CREATOR', 'ROLE_MODERATOR', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN']) && (
        <>
          <Link to="/documents" className="block px-4 py-2 hover:underline text-theme-text-secondary hover:text-theme-text-primary">
            Documents
          </Link>
        </>
      )}
      <Link to="/profile" className="block px-4 py-2 hover:underline text-theme-text-secondary hover:text-theme-text-primary">
        Profile
      </Link>
      <Link to="/settings" className="block px-4 py-2 hover:underline text-theme-text-secondary hover:text-theme-text-primary">
        Settings
      </Link>
      {/* Logout is a <button> so it can call logout() */}
      <button
        onClick={handleLogout}
        className="block px-4 py-2 text-left hover:underline text-theme-text-secondary hover:text-theme-text-primary"
      >
        Logout
      </button>
    </>
  );

  return (
    <header className="bg-theme-bg-primary border-b border-theme-border-primary shadow-theme">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* ----- Logo / site title ------------------------------------ */}
          <Link to="/quizzes" className="text-xl font-semibold text-theme-text-primary">
            QuizMaker
          </Link>

          {/* ----- Desktop links (hidden on mobile via md:flex) ---------- */}
          <div className="hidden md:flex items-center space-x-6">
            {isLoggedIn ? authLinks : guestLinks}
          </div>

          {/* ----- Right side controls ------------------------------------ */}
          <div className="flex items-center space-x-4">
            {/* Color Scheme Dropdown */}
            <ColorSchemeDropdown />
            
            {/* Theme Toggle */}
            <ThemeToggle size="sm" />
            
            {/* ----- Hamburger button (only visible on mobile) ------------- */}
            <button
              aria-label="Toggle navigation menu"
              className="md:hidden text-2xl focus:outline-none text-theme-text-secondary hover:text-theme-text-primary"
              onClick={() => setIsOpen((prev) => !prev)}
            >
              ☰
            </button>
          </div>
        </div>

        {/* ----- Mobile dropdown (only when isOpen && below md) ---------- */}
        {isOpen && (
          <div className="md:hidden border-t border-theme-border-primary py-2">
            {/* Tailwind's block/py-2 classes stack links vertically */}
            {isLoggedIn ? authLinks : guestLinks}
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
