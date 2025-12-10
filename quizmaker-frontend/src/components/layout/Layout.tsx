import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Footer, Navbar } from './';

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  return null;
};

const Layout: React.FC = () => (
  <div className="min-h-screen flex flex-col bg-theme-bg-secondary">
    <Navbar />
    <ScrollToTop />
    {/* Main content area grows to push footer to the bottom when content is short */}
    <main className="flex-1">
      <Outlet />
    </main>
    <Footer />
  </div>
);

export default Layout;
