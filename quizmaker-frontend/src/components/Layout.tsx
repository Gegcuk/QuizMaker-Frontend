import React from 'react';
import Navbar from './Navbar';
import { Outlet } from 'react-router-dom';

const Layout: React.FC = () => (
  <>
    <Navbar />
    {/* Wrap page content so spacing is consistent */}
    <main className="py-4 px-2">
      <Outlet />
    </main>
  </>
);

export default Layout;