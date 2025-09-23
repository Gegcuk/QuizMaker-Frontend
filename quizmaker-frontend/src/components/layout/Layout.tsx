import React from 'react';
import { Navbar } from './';
import { Outlet } from 'react-router-dom';

const Layout: React.FC = () => (
  <>
    <Navbar />
    {/* Main content area with consistent max-width and padding */}
    <main className="min-h-screen bg-theme-bg-secondary">
      <Outlet />
    </main>
  </>
);

export default Layout;