// src/components/Navbar.tsx
// ---------------------------------------------------------------------------
// Responsive site header.  Renders two different link sets depending on
// whether the user is logged in (from AuthContext).
//  • Desktop (≥ md): logo on the left, links inline on the right.
//  • Mobile  (< md): hamburger “☰” toggles a vertical dropdown.
// ---------------------------------------------------------------------------

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const { isLoggedIn, logout } = useAuth();          // ← auth-aware menu
  const [isOpen, setIsOpen] = useState<boolean>(false); // ← mobile toggle
  const navigate = useNavigate();

  /** Handles the logout click: call AuthContext → redirect to /login */
  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
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
      <Link to="/tags" className="block px-4 py-2 hover:underline">
        Tags
      </Link>
      <Link to="/categories" className="block px-4 py-2 hover:underline">
        Categories
      </Link>
      <Link to="/questions" className="block px-4 py-2 hover:underline">
        Questions
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
          <Link to="/" className="text-xl font-semibold">
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
            {/* Tailwind’s block/py-2 classes stack links vertically */}
            {isLoggedIn ? authLinks : guestLinks}
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
