// src/pages/HomePage.tsx
// Public landing page with research-forward product context and crawlable metadata.

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
        title="AI Quiz Generator for Students & Teachers | Quizzence"
        description="Create AI-powered quizzes from text, PDFs, or links. Practise retrieval, learn with feedback, and revisit key ideas with Quizzence."
        canonicalPath="/"
        ogType="website"
      />

      <section
        aria-labelledby="homepage-title"
        className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-theme-bg-secondary px-4 py-16 text-center"
      >
        <h1
          id="homepage-title"
          className="mb-4 text-4xl font-extrabold text-theme-interactive-primary md:text-5xl"
        >
          Create AI quizzes that help students learn and remember
        </h1>
        <p className="mb-8 max-w-2xl text-lg text-theme-text-secondary md:text-xl">
          Turn study material into research-based practice for university courses, school classes, and independent learning.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button variant="primary" size="md" onClick={() => navigate(primaryCta.href)}>
            {primaryCta.label}
          </Button>
          <Button variant="outline" size="md" onClick={() => navigate(secondaryCta.href)}>
            {secondaryCta.label}
          </Button>
        </div>
      </section>

      <section aria-labelledby="how-it-works-title" className="border-y border-theme-border-primary bg-theme-bg-primary">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 id="how-it-works-title" className="text-2xl font-bold text-theme-text-primary sm:text-3xl">
              How Quizzence turns study material into useful practice
            </h2>
            <p className="mt-3 text-theme-text-secondary">
              Build a quiz from your source material, answer questions before and after learning, and return to the ideas that need more practice.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="border-t-2 border-theme-interactive-primary pt-4">
              <h3 className="text-lg font-semibold text-theme-text-primary">Start with your material</h3>
              <p className="mt-2 text-sm text-theme-text-secondary">
                Paste text, upload a document, or use a link as the starting point for a focused quiz.
              </p>
            </div>
            <div className="border-t-2 border-theme-interactive-primary pt-4">
              <h3 className="text-lg font-semibold text-theme-text-primary">Practise with feedback</h3>
              <p className="mt-2 text-sm text-theme-text-secondary">
                Use pre-questions, learning prompts, and post-questions to identify what you understand and what to revisit.
              </p>
            </div>
            <div className="border-t-2 border-theme-interactive-primary pt-4">
              <h3 className="text-lg font-semibold text-theme-text-primary">Review key ideas again</h3>
              <p className="mt-2 text-sm text-theme-text-secondary">
                Revisit important quizzes as part of a study routine that reinforces understanding over time.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="who-its-for-title" className="bg-theme-bg-secondary">
        <div className="mx-auto grid max-w-5xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <h2 id="who-its-for-title" className="text-2xl font-bold text-theme-text-primary sm:text-3xl">
              Built for students and educators who need clear practice
            </h2>
            <p className="mt-4 text-theme-text-secondary">
              Quizzence helps learners turn dense notes, reading, and course material into questions they can answer. Educators can use the same workflow to create structured practice from their teaching material.
            </p>
          </div>
          <div className="border-l-2 border-theme-interactive-primary pl-5">
            <h2 className="text-2xl font-bold text-theme-text-primary sm:text-3xl">Grounded in learning research</h2>
            <p className="mt-4 text-theme-text-secondary">
              Retrieval practice and revisiting material are useful study strategies. Quizzence makes those steps easier to apply while keeping the source material and feedback close to the questions.
            </p>
            <Link
              to="/blog/retrieval-practice-fastest-way-to-make-learning-stick/"
              className="mt-4 inline-flex text-sm font-medium text-theme-interactive-primary transition-colors hover:text-theme-interactive-primary-hover"
            >
              Read the retrieval-practice research
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="homepage-faq-title" className="border-t border-theme-border-primary bg-theme-bg-primary">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 id="homepage-faq-title" className="text-2xl font-bold text-theme-text-primary sm:text-3xl">
            Questions students ask before they start
          </h2>
          <dl className="mt-8 grid gap-8 md:grid-cols-3">
            <div>
              <dt className="text-lg font-semibold text-theme-text-primary">What can I make a quiz from?</dt>
              <dd className="mt-2 text-sm text-theme-text-secondary">
                Start with text, a document, or a link, then choose the quiz workflow that fits the material you are studying.
              </dd>
            </div>
            <div>
              <dt className="text-lg font-semibold text-theme-text-primary">Can I learn from my mistakes?</dt>
              <dd className="mt-2 text-sm text-theme-text-secondary">
                Yes. Feedback and follow-up questions help you identify which ideas need another pass before you move on.
              </dd>
            </div>
            <div>
              <dt className="text-lg font-semibold text-theme-text-primary">Is Quizzence only for teachers?</dt>
              <dd className="mt-2 text-sm text-theme-text-secondary">
                No. It is designed for independent learners as well as educators who want to turn source material into clear practice.
              </dd>
            </div>
          </dl>
          <Link
            to="/faq"
            className="mt-8 inline-flex text-sm font-medium text-theme-interactive-primary transition-colors hover:text-theme-interactive-primary-hover"
          >
            Explore all frequently asked questions
          </Link>
        </div>
      </section>
    </>
  );
};

export default HomePage;
