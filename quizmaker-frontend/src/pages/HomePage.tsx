// src/pages/HomePage.tsx
// Enhanced landing page with research-forward hero and quick explainer grid.

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components';
import { Seo } from '@/features/seo';
import { useAuth } from '../features/auth';

const HomePage: React.FC = () => {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const primaryCta = isLoggedIn
    ? { label: 'Go to My Quizzes', href: '/my-quizzes' }
    : { label: 'Login', href: '/login' };
  const secondaryCta = isLoggedIn
    ? { label: 'Browse Quizzes', href: '/quizzes' }
    : { label: 'Register', href: '/register' };

  return (
    <>
      <Seo
        title="AI Quiz Generator & Quiz Maker for Teachers & Learners | Quizzence"
        description="Create quizzes in seconds from text, PDFs or links. Quizzence uses AI to build engaging quizzes for university courses, school classes and self-study – free to start."
        canonicalPath="/"
        ogType="website"
      />
      <main className="flex-1">
        <section className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 text-center bg-theme-bg-secondary">
          <h1 className="text-4xl md:text-5xl font-extrabold text-theme-interactive-primary mb-4">
            Welcome to Quizzence
          </h1>
        <p className="max-w-2xl text-lg md:text-xl text-theme-text-secondary mb-8">
          <strong>Research-based quizzes</strong> that help students in universities and schools learn faster, understand deeper and remember longer:{' '}
          <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-theme-border-primary bg-theme-bg-primary px-2 py-1 text-sm font-semibold text-theme-interactive-primary align-middle">
            +10–13 pp better exam scores
          </span>{' '}  
          <Link
            to="/blog/retrieval-practice-fastest-way-to-make-learning-stick/"
            className="ml-1 text-theme-interactive-primary hover:text-theme-interactive-primary-hover"
          >
            See the research →
          </Link>
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate(primaryCta.href)}
          >
            {primaryCta.label}
          </Button>
          <Button
            variant="outline"
            size="md"
            onClick={() => navigate(secondaryCta.href)}
          >
            {secondaryCta.label}
          </Button>
        </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3 max-w-4xl w-full">
            <div className="rounded-2xl border border-theme-border-primary bg-theme-bg-primary p-4 text-left">
              <h3 className="font-semibold text-theme-text-primary mb-1">1) Paste any content</h3>
              <p className="text-sm text-theme-text-secondary">Upload a document or paste plain text. We extract key ideas and terms.</p>
            </div>
            <div className="rounded-2xl border border-theme-border-primary bg-theme-bg-primary p-4 text-left">
              <h3 className="font-semibold text-theme-text-primary mb-1">2) Pre-quiz → learn → post-quiz</h3>
              <p className="text-sm text-theme-text-secondary">Use 1–3 pre-questions, then 4–6 post-questions with feedback.</p>
            </div>
            <div className="rounded-2xl border border-theme-border-primary bg-theme-bg-primary p-4 text-left">
              <h3 className="font-semibold text-theme-text-primary mb-1">3) Smart spacing</h3>
              <p className="text-sm text-theme-text-secondary">Repeat key quizzes to lift your grades; we’ll add automated spacing soon.</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs text-theme-text-tertiary">
            <span className="inline-flex items-center rounded-full border border-theme-border-primary px-2.5 py-1">+10–13 pp on exams</span>
            <span className="inline-flex items-center rounded-full border border-theme-border-primary px-2.5 py-1">g≈0.6–0.7 effect size</span>
            <span className="inline-flex items-center rounded-full border border-theme-border-primary px-2.5 py-1">10–20% spacing rule</span>
          </div>
        </section>
      </main>
    </>
  );
};

export default HomePage;
