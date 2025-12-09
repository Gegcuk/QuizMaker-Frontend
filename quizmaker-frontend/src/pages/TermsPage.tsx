import React from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { Seo } from '@/features/seo';

const TermsPage: React.FC = () => {
  return (
    <>
      <Seo
        title="Terms of Service | Quizzence"
        description="Read the terms of service for using Quizzence, our AI-powered quiz and learning platform."
        canonicalPath="/terms"
        ogType="website"
      />
      <PageContainer
        title="Terms & Conditions"
        showHeader
      >
        <article className="prose max-w-none text-theme-text-primary prose-headings:text-theme-text-primary prose-p:text-theme-text-secondary dark:prose-invert">
          <section className="mb-10">
            <h2>1. Accepting these terms</h2>
            <p>
              By accessing Quizzence you agree to operate within our feature-first architecture and API boundaries. The frontend
              integrates React Router layouts, protected routes for private flows, and axios-powered services that assume secure,
              authenticated requests. Use of the platform signifies your commitment to respecting these constraints and any
              additional agreements reached with the Quizzence team.
            </p>
          </section>

          <section className="mb-10">
            <h2>2. Account responsibilities</h2>
            <p>
              You are responsible for safeguarding credentials issued to you. Our authentication hooks rely on valid tokens to
              manage protected quiz creation, document management, and analytics routes. Notify support immediately at
              <a className="ml-1 text-theme-interactive-primary hover:text-theme-interactive-info" href="mailto:support@quizzence.com">
                support@quizzence.com
              </a>
              if you suspect unauthorized activity so we can revoke sessions via our centralized auth services.
            </p>
          </section>

          <section className="mb-10">
            <h2>3. Content ownership & usage</h2>
            <p>
              Quiz content you create remains yours. Granting Quizzence a non-exclusive license allows us to render quizzes through
              our shared UI primitives, store metadata in associated services, and improve recommendation models. You warrant that
              uploaded questions and documents respect copyright and are free from prohibited content.
            </p>
          </section>

          <section className="mb-10">
            <h2>4. Acceptable use</h2>
            <p>
              Do not reverse engineer security features, spam the API, or attempt to bypass role-based routes. Our ProtectedRoute
              component, tagging workflows, and admin tooling keep the community safe. Breaches may lead to account suspension or
              removal.
            </p>
          </section>

          <section className="mb-10">
            <h2>5. Service availability</h2>
            <p>
              We strive for high availability through modular deployments. However, maintenance windows, dependency upgrades, or
              upstream API changes may interrupt service. Critical notices are communicated via the in-app notification centre and
              official social channels listed in the footer.
            </p>
          </section>

          <section className="mb-10">
            <h2>6. Feedback and contributions</h2>
            <p>
              Feedback helps us evolve the architecture. Suggestions submitted through support channels or directly to Aleksey
              Lazunin may be incorporated without obligation to provide compensation, while respecting confidentiality agreements
              when applicable.
            </p>
          </section>

          <section>
            <h2>7. Contact</h2>
            <p>
              For legal questions, contact <a className="text-theme-interactive-primary hover:text-theme-interactive-info" href="mailto:legal@quizzence.com">legal@quizzence.com</a>.
              For architectural discussions, reach out to Aleksey Lazunin via LinkedIn using the footer link.
            </p>
          </section>
        </article>
      </PageContainer>
    </>
  );
};

export default TermsPage;
