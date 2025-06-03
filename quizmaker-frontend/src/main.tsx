// src/main.tsx (minimal example – adjust if you already have code here)
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import AppRoutes from './routes/AppRoutes'; // ⬅️ the file you just added
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* Your AuthProvider should wrap everything that needs useAuth() */}
      <AppRoutes />
    </BrowserRouter>
  </React.StrictMode>,
);
