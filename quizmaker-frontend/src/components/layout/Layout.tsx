import React from 'react';
import { Outlet } from 'react-router-dom';
import { Footer, Navbar } from './';

const Layout: React.FC = () => (
  <div className="min-h-screen flex flex-col bg-theme-bg-secondary">
    <Navbar />
    {/* Main content area grows to push footer to the bottom when content is short */}
    <main className="flex-1">
      <Outlet />
    </main>
    <Footer />
  </div>
);

export default Layout;