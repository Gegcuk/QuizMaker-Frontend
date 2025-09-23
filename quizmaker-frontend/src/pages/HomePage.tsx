// src/pages/HomePage.tsx
// ---------------------------------------------------------------------------
// A simple hero-style landing page.
// • If the visitor is already logged in → “Browse Quizzes” CTA.
// • Otherwise → “Login” + “Register” buttons.
// ---------------------------------------------------------------------------

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components';
import { useAuth } from '../features/auth';

const HomePage: React.FC = () => {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  return (
    <main className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 text-center bg-theme-bg-secondary">
      {/* Site title ---------------------------------------------------- */}
      <h1 className="text-4xl md:text-5xl font-extrabold text-theme-interactive-primary mb-4">
        Welcome to QuizMaker
      </h1>

      {/* Tagline ------------------------------------------------------- */}
      <p className="max-w-xl text-lg md:text-xl text-theme-text-secondary mb-8">
        Create, share and master knowledge with engaging quizzes. Challenge
        yourself or compete with friends — it’s fast, fun and free.
      </p>


      {/* Call-to-action section --------------------------------------- */}
      {isLoggedIn ? (
        <Button variant="primary" size="lg" onClick={() => navigate('/quizzes')}>
          Browse Quizzes
        </Button>
      ) : (
        <div className="flex space-x-4">
          <Button variant="primary" size="md" onClick={() => navigate('/login')}>
            Login
          </Button>
          <Button variant="outline" size="md" onClick={() => navigate('/register')}>
            Register
          </Button>
        </div>
      )}
    </main>
  );
};

export default HomePage;
