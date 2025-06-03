// src/pages/HomePage.tsx
// ---------------------------------------------------------------------------
// A simple hero-style landing page.
// • If the visitor is already logged in → “Browse Quizzes” CTA.
// • Otherwise → “Login” + “Register” buttons.
// ---------------------------------------------------------------------------

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const HomePage: React.FC = () => {
  const { isLoggedIn } = useAuth();

  return (
    <main className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 text-center bg-gradient-to-br from-indigo-50 to-white">
      {/* Site title ---------------------------------------------------- */}
      <h1 className="text-4xl md:text-5xl font-extrabold text-indigo-700 mb-4">
        Welcome to QuizMaker
      </h1>

      {/* Tagline ------------------------------------------------------- */}
      <p className="max-w-xl text-lg md:text-xl text-gray-700 mb-8">
        Create, share and master knowledge with engaging quizzes. Challenge
        yourself or compete with friends — it’s fast, fun and free.
      </p>

      {/* Call-to-action section --------------------------------------- */}
      {isLoggedIn ? (
        <Link
          to="/quizzes"
          className="inline-block px-8 py-3 bg-indigo-600 text-white rounded-md text-lg font-medium hover:bg-indigo-700 transition"
        >
          Browse Quizzes
        </Link>
      ) : (
        <div className="flex space-x-4">
          <Link
            to="/login"
            className="px-6 py-3 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 transition"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="px-6 py-3 border border-indigo-600 text-indigo-600 rounded-md font-medium hover:bg-indigo-50 transition"
          >
            Register
          </Link>
        </div>
      )}
    </main>
  );
};

export default HomePage;
