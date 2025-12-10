import React from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { Seo } from '@/features/seo';

const TermsPage: React.FC = () => {
  return (
    <>
      <Seo
        title="Terms of Service | Quizzence"
        description="Read the terms of service for using Quizzence, our AI-powered quiz and learning platform."
        canonicalPath="/terms/"
        ogType="website"
      />
      <PageContainer title="Terms & Conditions" showHeader subtitle="The ground rules for using Quizzence">
        <div className="space-y-6">
          <div className="rounded-2xl border border-theme-border-primary bg-theme-bg-primary/70 p-4 text-sm text-theme-text-secondary">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-theme-bg-tertiary text-theme-text-secondary font-semibold">ℹ️</span>
              <div>
                <p className="text-theme-text-primary font-semibold">Last updated: 10 December 2025</p>
                <p className="text-theme-text-secondary">Quizzence is operated by Aleksei Lazunin. By using the website and app, you agree to these terms.</p>
              </div>
            </div>
          </div>

          <article className="prose max-w-none text-theme-text-primary prose-headings:text-theme-text-primary prose-p:text-theme-text-secondary prose-h2:text-2xl prose-h2:font-semibold prose-h3:text-lg prose-h3:font-semibold prose-li:leading-relaxed prose-li:marker:text-theme-interactive-primary prose-strong:text-theme-text-primary dark:prose-invert">
            <section className="p-6 rounded-2xl border border-theme-border-primary bg-theme-bg-primary shadow-sm space-y-3">
              <h2 className="text-2xl font-semibold text-theme-text-primary">Quick overview</h2>
              <p className="text-theme-text-secondary">By using Quizzence you’re agreeing to:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Use the platform in a reasonable, legal way.</li>
                <li>Keep your account details safe.</li>
                <li>Stay in control of the content you create, while giving us permission to store and display it.</li>
                <li>Accept that we can’t promise perfect uptime, perfect grades, or zero bugs.</li>
              </ul>
              <p className="text-theme-text-secondary">If any of that sounds worrying, please read the full text below (or don’t use Quizzence).</p>
            </section>

            <section className="p-6 rounded-2xl border border-theme-border-primary bg-theme-bg-primary shadow-sm space-y-3">
              <h2 className="text-2xl font-semibold text-theme-text-primary">1. What these terms cover</h2>
              <p>Quizzence is an AI-powered quiz and learning platform designed mainly for:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>University lecturers and professors</li>
                <li>University and college students</li>
                <li>School teachers</li>
                <li>Older pupils and self-learners</li>
              </ul>
              <p>These terms explain the basic rules for using Quizzence, whether you’re creating quizzes, taking quizzes, trying out a free plan, or using it as part of your teaching or studies.</p>
              <p>These terms work together with our Privacy Policy. If you don’t agree with these terms or the Privacy Policy, please don’t use Quizzence.</p>
            </section>

            <section className="p-6 rounded-2xl border border-theme-border-primary bg-theme-bg-primary shadow-sm space-y-3">
              <h2 className="text-2xl font-semibold text-theme-text-primary">2. Who can use Quizzence</h2>
              <p>You can use Quizzence if you are old enough to use online learning tools in your country and have the legal right to agree to these terms (for example, you are over the age of majority or have permission from a parent, guardian, school or university).</p>
              <p>If you are using Quizzence on behalf of an organisation, you confirm that you are authorised to accept these terms for that organisation and will follow any internal policies that apply.</p>
            </section>

            <section className="p-6 rounded-2xl border border-theme-border-primary bg-theme-bg-primary shadow-sm space-y-3">
              <h2 className="text-2xl font-semibold text-theme-text-primary">3. Your account and security</h2>
              <p>You’re responsible for anything that happens under your account:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Keep your email, password and any sign-in links secret and safe.</li>
                <li>Don’t share your login with other people. If colleagues need access, they should use their own accounts.</li>
                <li>Avoid reusing passwords from other services.</li>
              </ul>
              <p>If you think someone else has accessed your account, change your password and let us know at <a className="text-theme-interactive-primary hover:text-theme-interactive-info" href="mailto:support@quizzence.com">support@quizzence.com</a> so we can help secure it.</p>
            </section>

            <section className="p-6 rounded-2xl border border-theme-border-primary bg-theme-bg-primary shadow-sm space-y-3">
              <h2 className="text-2xl font-semibold text-theme-text-primary">4. Your content and how we use it</h2>
              <p>You own the teaching and learning content you create in Quizzence (quiz titles, questions, answers, explanations, tags, and any files you upload). If you create content as part of your job, your employer may own it under your employment contract.</p>
              <p>By using Quizzence, you give us a non-exclusive, worldwide licence to store, process (including via AI), display, back up and log your content as needed to operate and improve the service. You can usually delete your content at any time in the product.</p>
              <p>You are responsible for ensuring your content respects copyright and other legal rights, is appropriate for your learners, and does not contain illegal or harmful material.</p>
            </section>

            <section className="p-6 rounded-2xl border border-theme-border-primary bg-theme-bg-primary shadow-sm space-y-3">
              <h2 className="text-2xl font-semibold text-theme-text-primary">5. Our content and intellectual property</h2>
              <p>Quizzence (the website, app, software, design, branding, and any templates we provide) is owned by us or our licensors. We grant you a personal, limited, non-transferable licence to use Quizzence for teaching, studying or personal learning under these terms.</p>
              <p>You must not copy, resell or redistribute Quizzence as your own service, reverse engineer it (except where allowed by law), or remove ownership notices.</p>
            </section>

            <section className="p-6 rounded-2xl border border-theme-border-primary bg-theme-bg-primary shadow-sm space-y-3">
              <h2 className="text-2xl font-semibold text-theme-text-primary">6. Acceptable use</h2>
              <p>To keep Quizzence safe and useful, you agree not to:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Break, disable or bypass our security or access controls.</li>
                <li>Harass, threaten or harm other people.</li>
                <li>Upload illegal, hateful, extremely violent or clearly inappropriate content.</li>
                <li>Use automated tools (bots, scripts, scrapers) to overload or spam our systems or APIs.</li>
                <li>Pretend to be someone you’re not, or misrepresent your role or identity.</li>
              </ul>
              <p>If your use puts others or the service at risk, we may suspend or close your account. We’ll aim to be fair and proportionate.</p>
            </section>

            <section className="p-6 rounded-2xl border border-theme-border-primary bg-theme-bg-primary shadow-sm space-y-3">
              <h2 className="text-2xl font-semibold text-theme-text-primary">7. Paid features, plans and limits</h2>
              <p>Some parts of Quizzence may be free. Others may require a paid subscription, have usage limits (e.g., AI generations per month), or start as trials that convert to paid plans.</p>
              <p>When you choose a paid plan, we’ll show the price, billing period and main limits. If prices or limits change, we’ll give clear notice before changes apply to your existing subscription, and you can cancel before the new price takes effect. Payments are handled securely by our providers.</p>
            </section>

            <section className="p-6 rounded-2xl border border-theme-border-primary bg-theme-bg-primary shadow-sm space-y-3">
              <h2 className="text-2xl font-semibold text-theme-text-primary">8. Service changes and availability</h2>
              <p>We do our best to keep Quizzence reliable, but we can’t promise it will always be online or error-free. We may change, pause or discontinue features to improve the product, fix security issues or respond to technical limits.</p>
              <p>Where changes significantly affect how you use Quizzence, we’ll aim to give reasonable notice via in-product messages and/or email. Technical requirements (e.g., supported browsers) may change over time.</p>
            </section>

            <section className="p-6 rounded-2xl border border-theme-border-primary bg-theme-bg-primary shadow-sm space-y-3">
              <h2 className="text-2xl font-semibold text-theme-text-primary">9. Termination and closing your account</h2>
              <p>You can stop using Quizzence at any time. To close your account, use in-product options or contact <a className="text-theme-interactive-primary hover:text-theme-interactive-info" href="mailto:support@quizzence.com">support@quizzence.com</a>. We may retain limited records where required by law or for legitimate reasons (e.g., billing or security logs).</p>
              <p>We may suspend or terminate access if you seriously or repeatedly break these terms, if required by law, or if we discontinue the service. Where reasonable, we’ll try to give notice so you can export important data.</p>
            </section>

            <section className="p-6 rounded-2xl border border-theme-border-primary bg-theme-bg-primary shadow-sm space-y-3">
              <h2 className="text-2xl font-semibold text-theme-text-primary">10. Disclaimers and limitation of liability</h2>
              <p>Quizzence supports learning and teaching but doesn’t guarantee grades, exam results, admissions outcomes or jobs. You remain responsible for how you prepare, teach and study.</p>
              <p>To the fullest extent permitted by law, Quizzence is provided “as is” and “as available”, without warranties of fitness for a particular purpose. Quizzence and its creator (Aleksei Lazunin) are not liable for indirect or consequential losses, loss of profits, opportunities, data or reputation, or harms outside our reasonable control.</p>
              <p>If we’re found liable for a claim related to your use of Quizzence, total liability will be limited to the amount you paid in the 3 months before the issue arose, where the law allows such a limitation. Nothing here excludes liability where it would be unlawful to do so.</p>
            </section>

            <section className="p-6 rounded-2xl border border-theme-border-primary bg-theme-bg-primary shadow-sm space-y-3">
              <h2 className="text-2xl font-semibold text-theme-text-primary">11. Changes to these terms</h2>
              <p>We may update these terms when we launch new features, change how the service works, or need to reflect legal requirements. When we make material changes, we’ll update the “Last updated” date and, where appropriate, notify you in the product or by email.</p>
              <p>If you continue using Quizzence after changes take effect, we’ll treat that as acceptance. If you don’t agree, stop using Quizzence and consider closing your account.</p>
            </section>

            <section className="p-6 rounded-2xl border border-theme-border-primary bg-theme-bg-primary shadow-sm space-y-3">
              <h2 className="text-2xl font-semibold text-theme-text-primary">12. Governing law</h2>
              <p>These terms are governed by the laws of England and Wales, unless mandatory local rules require otherwise. We’ll try to resolve disputes informally first; otherwise, disputes will generally be handled by the courts of England and Wales, unless consumer protection rules require a different court where you live.</p>
            </section>

            <section className="p-6 rounded-2xl border border-theme-border-primary bg-theme-bg-primary shadow-sm space-y-3">
              <h2 className="text-2xl font-semibold text-theme-text-primary">13. Contact</h2>
              <p>If you have questions about these terms or how they apply to your university, faculty, school or organisation, you can reach me at:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>General and legal: <a className="text-theme-interactive-primary hover:text-theme-interactive-info" href="mailto:legal@quizzence.com">legal@quizzence.com</a></li>
                <li>Support: <a className="text-theme-interactive-primary hover:text-theme-interactive-info" href="mailto:support@quizzence.com">support@quizzence.com</a></li>
              </ul>
              <p>I’m a one-person team (Aleksei Lazunin) and will do my best to respond in a reasonable timeframe.</p>
            </section>
          </article>
        </div>
      </PageContainer>
    </>
  );
};

export default TermsPage;
