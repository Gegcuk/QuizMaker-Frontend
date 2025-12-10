import React from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { Seo } from '@/features/seo';

const PrivacyPage: React.FC = () => {
  return (
    <>
      <Seo
        title="Privacy Policy | Quizzence"
        description="Learn how Quizzence handles your account data, quiz results and learning analytics in our privacy policy."
        canonicalPath="/privacy/"
        ogType="website"
      />
      <PageContainer title="Privacy Policy" showHeader>
        <article className="prose max-w-none text-theme-text-primary prose-headings:text-theme-text-primary prose-p:text-theme-text-secondary dark:prose-invert">
          <section className="mb-8">
            <h2>Quick summary</h2>
            <p className="mb-3">
              This page explains how Quizzence handles your data in plain language. The short version:
            </p>
            <ul>
              <li>We collect only the information we need to run your account, generate quizzes and provide learning insights.</li>
              <li>We do not sell your personal information.</li>
              <li>We use trusted providers for hosting, authentication and analytics, and expect them to protect your data.</li>
              <li>You can ask us to export or delete your account data, subject to legal obligations to keep some records.</li>
              <li>If you are a university lecturer, professor, student or school teacher, you remain in control of how you use Quizzence in your courses, classes and studies.</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2>1. Data we collect</h2>
            <p>
              Quizzence collects the minimum information needed to operate the service and improve learning features. This may
              include:
            </p>
            <ul>
              <li>Account details such as your name, email address and login credentials.</li>
              <li>Quiz content you create, including questions, answers, tags and related metadata.</li>
              <li>Learning activity, such as which quizzes were attempted, scores and progress over time.</li>
              <li>Files you choose to upload so we can generate quizzes from them.</li>
              <li>Basic technical data such as device type, browser and approximate region, to help keep the service reliable.</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2>2. How we use your data</h2>
            <p>
              We use your information to:
            </p>
            <ul>
              <li>Create, store and display quizzes and related learning materials.</li>
              <li>Generate quiz questions and feedback using AI models and other algorithms.</li>
              <li>Provide learning analytics, such as scores, progress and engagement over time.</li>
              <li>Protect your account, prevent abuse and keep the service secure.</li>
              <li>Communicate important updates about the product or your account.</li>
            </ul>
            <p>
              We do <strong>not</strong> sell your personal information. Where we use aggregated or anonymised data to understand
              how Quizzence is used, we remove direct identifiers wherever reasonably possible.
            </p>
          </section>

          <section className="mb-10">
            <h2>3. Sharing and third parties</h2>
            <p>
              We rely on a small number of trusted providers to host the service, manage authentication, send email and measure
              usage. These providers act as data processors on our behalf and are required to protect your information and use it
              only to deliver their services to us.
            </p>
            <p>
              We may share information if we are legally required to do so (for example, in response to a court order) or to
              protect the rights, safety and security of our users and the service.
            </p>
          </section>

          <section className="mb-10">
            <h2>4. Security</h2>
            <p>
              We take reasonable technical and organisational measures to protect your data, including secure transport (HTTPS) and
              access controls on both the frontend and backend. No online service can guarantee perfect security, but we monitor for
              unusual activity and work to patch vulnerabilities promptly.
            </p>
          </section>

          <section className="mb-10">
            <h2>5. Your choices and rights</h2>
            <p>
              You can:
            </p>
            <ul>
              <li>Update your account details in the profile or settings area.</li>
              <li>Delete individual quizzes or other content you have created.</li>
              <li>Contact us to request an export or deletion of your account data.</li>
            </ul>
            <p>
              We aim to respond to reasonable requests within 30 days, subject to any legal or contractual obligations that require
              us to retain some information for a longer period (for example, basic billing or audit records).
            </p>
          </section>

          <section>
            <h2>6. Contact</h2>
            <p>
              Questions about privacy can be directed to
              <a className="ml-1 text-theme-interactive-primary hover:text-theme-interactive-info" href="mailto:privacy@quizzence.com">
                privacy@quizzence.com
              </a>
              or through the support form in the product. If you are a university or other organisation with specific data protection
              requirements, please mention this when you contact us so we can respond appropriately.
            </p>
          </section>
        </article>
      </PageContainer>
    </>
  );
};

export default PrivacyPage;
