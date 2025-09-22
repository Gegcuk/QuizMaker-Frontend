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
      <Link to="/login" className="block px-4 py-2 hover:underline">
        Login
      </Link>
      <Link to="/register" className="block px-4 py-2 hover:underline">
        Register
      </Link>
    </>
  );

  const authLinks = (
    <>
      <Link to="/quizzes" className="block px-4 py-2 hover:underline">
        All Quizzes
      </Link>
      <Link to="/my-quizzes" className="block px-4 py-2 hover:underline">
        My Quizzes
      </Link>
      <Link to="/questions" className="block px-4 py-2 hover:underline">
        Questions
      </Link>
      {hasRole(['ROLE_QUIZ_CREATOR', 'ROLE_MODERATOR', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN']) && (
        <>
          <Link to="/documents" className="block px-4 py-2 hover:underline">
            Documents
          </Link>
        </>
      )}
      <Link to="/profile" className="block px-4 py-2 hover:underline">
        Profile
      </Link>
      <Link to="/settings" className="block px-4 py-2 hover:underline">
        Settings
      </Link>
      {/* Logout is a <button> so it can call logout() */}
      <button
        onClick={handleLogout}
        className="block px-4 py-2 text-left hover:underline"
      >
        Logout
      </button>
    </>
  );

  return (
    <header className="bg-white border-b shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* ----- Logo / site title ------------------------------------ */}
          <Link to="/quizzes" className="text-xl font-semibold">
            QuizMaker
          </Link>

          {/* ----- Desktop links (hidden on mobile via md:flex) ---------- */}
          <div className="hidden md:flex space-x-6">
            {isLoggedIn ? authLinks : guestLinks}
          </div>

          {/* ----- Hamburger button (only visible on mobile) ------------- */}
          <button
            aria-label="Toggle navigation menu"
            className="md:hidden text-2xl focus:outline-none"
            onClick={() => setIsOpen((prev) => !prev)}
          >
            ☰
          </button>
        </div>

        {/* ----- Mobile dropdown (only when isOpen && below md) ---------- */}
        {isOpen && (
          <div className="md:hidden border-t py-2">
            {/* Tailwind's block/py-2 classes stack links vertically */}
            {isLoggedIn ? authLinks : guestLinks}
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
