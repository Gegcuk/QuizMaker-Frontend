import React from 'react';
import PageContainer from '@/components/layout/PageContainer';

const PrivacyPage: React.FC = () => {
  return (
    <PageContainer
      title="Privacy Policy"
      showHeader
    >
      <article className="prose max-w-none text-theme-text-primary prose-headings:text-theme-text-primary prose-p:text-theme-text-secondary dark:prose-invert">
        <section className="mb-10">
          <h2>1. Data we collect</h2>
          <p>
            Quizzence stores account information, quiz metadata, and learning analytics necessary to deliver personalised quiz
            experiences. File uploads processed through the document services are encrypted in transit and stored according to our
            retention schedule.
          </p>
        </section>

        <section className="mb-10">
          <h2>2. How we use your data</h2>
          <p>
            Data flows through our axios-based API layer into feature-scoped services. We use this data to render quizzes,
            maintain leaderboards, power AI-driven question generation, and notify you about platform updates. We never sell your
            personal information.
          </p>
        </section>

        <section className="mb-10">
          <h2>3. Sharing and third parties</h2>
          <p>
            We share minimal information with trusted processors required to run infrastructure, authentication, and analytics.
            Each processor agrees to maintain at least the same level of protection we uphold within our own codebase.
          </p>
        </section>

        <section className="mb-10">
          <h2>4. Security</h2>
          <p>
            Our frontend enforces access control via ProtectedRoute and token-aware hooks, while backend systems implement role
            validation and rate limiting. We audit dependencies regularly and patch vulnerabilities promptly.
          </p>
        </section>

        <section className="mb-10">
          <h2>5. Your choices</h2>
          <p>
            You can update account settings, request exports, or delete data through the Settings page. Contact us for manual
            requests and we will respond within 30 days.
          </p>
        </section>

        <section>
          <h2>6. Contact</h2>
          <p>
            Questions about privacy can be directed to
            <a className="ml-1 text-theme-interactive-primary hover:text-theme-interactive-info" href="mailto:privacy@quizzence.com">
              privacy@quizzence.com
            </a>
            or through the support form. Architecture-specific privacy queries may be addressed to Aleksey Lazunin via LinkedIn.
          </p>
        </section>
      </article>
    </PageContainer>
  );
};

export default PrivacyPage;