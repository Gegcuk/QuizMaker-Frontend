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
              Quizzence is an AI‑powered quiz and learning platform designed for responsible university students, professors,
              school teachers and older pupils. By creating an account or using the product, you agree to these terms and to any
              additional policies we link from this page. If you do not agree, please do not use Quizzence.
            </p>
            <p>
              If you are using Quizzence on behalf of a university, faculty, department or other organisation, you confirm that you
              are authorised to accept these terms for that organisation and that you will ensure your use of Quizzence complies
              with any internal policies that apply.
            </p>
          </section>

          <section className="mb-10">
            <h2>2. Account responsibilities</h2>
            <p>
              You are responsible for keeping your login details (email, password and any sign‑in links) safe. Do not share your
              account with other people or reuse passwords from other services. You agree to let us know straight away at
              <a className="ml-1 text-theme-interactive-primary hover:text-theme-interactive-info" href="mailto:support@quizzence.com">
                support@quizzence.com
              </a>
              if you suspect unauthorised access so we can help secure your account.
            </p>
            <p>
              You must be old enough to use online learning tools in your country, or have permission from a parent, guardian or
              institution where required.
            </p>
          </section>

          <section className="mb-10">
            <h2>3. Content ownership & usage</h2>
            <p>
              You own the quizzes, questions and other teaching materials you create in Quizzence, unless you created them as part
              of your job and your employer owns that content under your contract. By using Quizzence you give us a
              non‑exclusive licence to store, process and display that content so we can run the service, improve learning
              features and keep reliable backups.
            </p>
            <p>
              You are responsible for making sure anything you upload or paste into Quizzence respects copyright and other legal
              rights, and does not contain harmful, discriminatory or illegal material.
            </p>
          </section>

          <section className="mb-10">
            <h2>4. Acceptable use</h2>
            <p>
              You agree not to misuse Quizzence. In particular, you must not:
            </p>
            <ul>
              <li>Try to break, disable or bypass our security or access controls.</li>
              <li>Use Quizzence to harass, harm or exploit other people.</li>
              <li>Upload content that is illegal, hateful, or clearly inappropriate for students.</li>
              <li>Use automated tools to overload or “spam” our systems or APIs.</li>
            </ul>
            <p>
              If we believe your use puts other users, students or the service at risk, we may suspend or close your account.
            </p>
          </section>

          <section className="mb-10">
            <h2>5. Service changes and availability</h2>
            <p>
              We work to keep Quizzence reliable and available, but we cannot promise the service will always be online or free
              from errors. We may change, pause or discontinue features from time to time, for example to improve the product,
              address security issues or respond to technical limits.
            </p>
            <p>
              If we make major changes that significantly affect how you use Quizzence, we will aim to give reasonable notice
              through the product or by email where possible.
            </p>
          </section>

          <section className="mb-10">
            <h2>6. Paid features and limits</h2>
            <p>
              Some parts of Quizzence may be free, while others may be paid or limited by usage. If you choose a paid plan, the
              applicable pricing and limits will be shown in the product or on our website. We may update prices or limits in
              future; when we do, we will give clear notice before changes apply to your existing subscription.
            </p>
          </section>

          <section className="mb-10">
            <h2>7. Limitation of liability</h2>
            <p>
              Quizzence is built to support learning, but no tool can guarantee specific grades, test scores or outcomes. To the
              fullest extent permitted by law, Quizzence and its creators are not liable for indirect, incidental or consequential
              losses arising from your use of the service.
            </p>
            <p>
              If we are found liable for any claim connected with your use of Quizzence, our total liability will be limited to the
              amount you paid us for the service in the 3 months before the issue arose, where the law allows such a limitation.
            </p>
          </section>

          <section>
            <h2>8. Contact</h2>
            <p>
              If you have questions about these terms or how they apply to your university, faculty or organisation, contact
              <a className="ml-1 text-theme-interactive-primary hover:text-theme-interactive-info" href="mailto:legal@quizzence.com">
                legal@quizzence.com
              </a>
              or reach out using the support details in the footer.
            </p>
          </section>
        </article>
      </PageContainer>
    </>
  );
};

export default TermsPage;
