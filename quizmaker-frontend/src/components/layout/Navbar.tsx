// src/components/Navbar.tsx
// ---------------------------------------------------------------------------
// Responsive site header with desktop and mobile navigation. Surfaces a
// prominent “Found a bug?” entry point that opens the dedicated bug report
// modal component (logic lives in the feature, not here).
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../features/auth';
import { ThemeToggle } from '../ui';
import ColorSchemeDropdown from '../ui/ColorSchemeDropdown';
import { billingService } from '@/services';
import type { BalanceDto } from '@/types';
import { Button } from '@/components';
import { BugReportModal } from '@/features/bug-report';

const Navbar: React.FC = () => {
  const { isLoggedIn, user, logout } = useAuth();          // ← auth-aware menu
  const [isOpen, setIsOpen] = useState<boolean>(false);    // ← mobile toggle
  const [balance, setBalance] = useState<BalanceDto | null>(null);
  const [isBugModalOpen, setIsBugModalOpen] = useState(false);

  /** Handles the logout click: AuthProvider already handles navigation */
  const handleLogout = async () => {
    await logout();
  };

  /** Check if user has required role */
  const hasRole = (requiredRoles: string[]) => {
    if (!user?.roles) return false;
    return requiredRoles.some(role => user.roles.includes(role));
  };

  /** Fetch token balance */
  useEffect(() => {
    const fetchBalance = async () => {
      if (!isLoggedIn) {
        setBalance(null);
        return;
      }

      try {
        const balanceData = await billingService.getBalance();
        setBalance(balanceData);
      } catch (error) {
        // Silently fail - balance is optional UI enhancement
        setBalance(null);
      }
    };

    fetchBalance();
  }, [isLoggedIn]);

  /* -------------------------------------------------------------------- */
  /*  Link groups – modern styling with consistent design                 */
  /* -------------------------------------------------------------------- */
  const linkClasses = "relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-theme-bg-tertiary text-theme-text-secondary hover:text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:ring-offset-2 focus:ring-offset-theme-bg-primary";
  const primaryLinkClasses = "relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 bg-theme-interactive-primary text-theme-text-inverse hover:bg-theme-interactive-primary-hover focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:ring-offset-2 focus:ring-offset-theme-bg-primary";
  const mobileLinkClasses = "block px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 hover:bg-theme-bg-tertiary text-theme-text-secondary hover:text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:ring-offset-2";
  const mobilePrimaryLinkClasses = "block px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 bg-theme-interactive-primary text-theme-text-inverse hover:bg-theme-interactive-primary-hover focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:ring-offset-2";
  
  const guestLinks = (
    <>
      <Link to="/blog" className={linkClasses}>
        Blog
      </Link>
      <Link to="/login" className={linkClasses}>
        Login
      </Link>
      <Link to="/register" className={primaryLinkClasses}>
        Register
      </Link>
    </>
  );

  const guestMobileLinks = (
    <>
      <Link to="/blog" className={mobileLinkClasses} onClick={() => setIsOpen(false)}>
        Blog
      </Link>
      <Link to="/login" className={mobileLinkClasses} onClick={() => setIsOpen(false)}>
        Login
      </Link>
      <Link to="/register" className={mobilePrimaryLinkClasses} onClick={() => setIsOpen(false)}>
        Register
      </Link>
    </>
  );

  const authLinks = (
    <>
      <Link to="/my-quizzes" className={linkClasses}>
        My Quizzes
      </Link>
      <Link to="/my-attempts" className={linkClasses}>
        My Attempts
      </Link>
      <Link to="/blog" className={linkClasses}>
        Blog
      </Link>
      <Link to="/billing" className={linkClasses}>
        Billing
      </Link>
      {/* Hidden for now - Documents */}
      {/* {hasRole(['ROLE_QUIZ_CREATOR', 'ROLE_MODERATOR', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN']) && (
        <Link to="/documents" className={linkClasses}>
          Documents
        </Link>
      )} */}
    </>
  );

  const authMobileLinks = (
    <>
      <Link to="/my-quizzes" className={mobileLinkClasses} onClick={() => setIsOpen(false)}>
        My Quizzes
      </Link>
      <Link to="/my-attempts" className={mobileLinkClasses} onClick={() => setIsOpen(false)}>
        My Attempts
      </Link>
      <Link to="/blog" className={mobileLinkClasses} onClick={() => setIsOpen(false)}>
        Blog
      </Link>
      <Link to="/billing" className={mobileLinkClasses} onClick={() => setIsOpen(false)}>
        Billing
      </Link>
      {/* Hidden for now - Documents */}
      {/* {hasRole(['ROLE_QUIZ_CREATOR', 'ROLE_MODERATOR', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN']) && (
        <Link to="/documents" className={mobileLinkClasses} onClick={() => setIsOpen(false)}>
          Documents
        </Link>
      )} */}
      <Link to="/profile" className={mobileLinkClasses} onClick={() => setIsOpen(false)}>
        Profile
      </Link>
      <Button
        onClick={() => {
          handleLogout();
          setIsOpen(false);
        }}
        variant="ghost"
        className="!justify-start !w-full !px-4 !py-3 !text-sm !font-medium hover:!bg-theme-bg-tertiary !text-theme-text-secondary hover:!text-theme-text-primary"
      >
        Logout
      </Button>
    </>
  );

  return (
    <header className="bg-theme-bg-primary border-b border-theme-border-primary shadow-theme sticky top-0 z-50 bg-theme-bg-primary text-theme-text-primary">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* ----- Logo / site title ------------------------------------ */}
          <Link 
            to={isLoggedIn ? "/my-quizzes" : "/"} 
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
            {/* Bug report quick access */}
            <Button
              onClick={() => setIsBugModalOpen(true)}
              variant="outline"
              size="sm"
              className="hidden md:inline-flex bg-gradient-to-r from-rose-500 via-orange-500 to-amber-400 text-white shadow-lg shadow-amber-400/40 border-transparent hover:shadow-amber-500/60 hover:-translate-y-0.5 transition-transform"
              leftIcon={
                <span aria-hidden className="inline-block animate-pulse">
                  🐞
                </span>
              }
            >
              Found a bug?
            </Button>
            {/* Color Scheme Dropdown */}
            <ColorSchemeDropdown />
            
            {/* Profile Icon with Token Balance (desktop only) */}
            {isLoggedIn && (
              <Link
                to="/profile"
                aria-label={balance ? `Profile - ${balance.availableTokens} tokens available` : 'Profile'}
                className="hidden md:flex items-center gap-1.5 px-2 py-2 rounded-lg text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-tertiary focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:ring-offset-2 focus:ring-offset-theme-bg-primary transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {balance && balance.availableTokens > 0 && (
                  <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold text-theme-text-inverse bg-theme-interactive-primary rounded-full">
                    {balance.availableTokens >= 1000 
                      ? `${Math.floor(balance.availableTokens / 1000)}k` 
                      : balance.availableTokens}
                  </span>
                )}
              </Link>
            )}
            
            {/* Logout Icon (desktop only) */}
            {isLoggedIn && (
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="hidden md:flex !p-2 !min-w-0"
                aria-label="Logout"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 013-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </Button>
            )}
            
            {/* ----- Modern hamburger button (only visible on mobile) ------------- */}
            <Button
              onClick={() => setIsOpen((prev) => !prev)}
              variant="ghost"
              size="sm"
              className="md:hidden !p-2 !min-w-0"
              aria-label="Toggle navigation menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
          </div>
        </div>

        {/* ----- Modern mobile dropdown (only when isOpen && below md) ---------- */}
        {isOpen && (
          <div className="md:hidden border-t border-theme-border-primary bg-theme-bg-primary bg-theme-bg-primary text-theme-text-primary">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Button
                onClick={() => {
                  setIsBugModalOpen(true);
                  setIsOpen(false);
                }}
                className="w-full bg-gradient-to-r from-rose-500 via-orange-500 to-amber-400 text-white shadow-lg shadow-amber-400/40 border-transparent"
              >
                Found a bug?
              </Button>
              {isLoggedIn ? authMobileLinks : guestMobileLinks}
            </div>
          </div>
        )}
      </nav>

      {/* Bug report modal (feature-owned logic) */}
      <BugReportModal
        isOpen={isBugModalOpen}
        onClose={() => setIsBugModalOpen(false)}
      />
    </header>
  );
};

export default Navbar;
