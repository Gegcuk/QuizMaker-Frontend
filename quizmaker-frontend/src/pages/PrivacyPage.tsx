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
      <PageContainer title="Privacy Policy" showHeader subtitle="How we handle your data, in plain language">
        <div className="space-y-6">
          <div className="rounded-2xl border border-theme-border-primary bg-theme-bg-primary/70 p-4 text-sm text-theme-text-secondary">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-theme-bg-tertiary text-theme-text-secondary font-semibold">ℹ️</span>
              <div>
                <p className="text-theme-text-primary font-semibold">Last updated: 10 December 2025</p>
                <p className="text-theme-text-secondary">Quizzence is an AI-powered quiz and learning platform. This page explains, in plain language, how we handle your data when you use the website and app.</p>
              </div>
            </div>
          </div>

          <article className="prose max-w-none text-theme-text-primary prose-headings:text-theme-text-primary prose-p:text-theme-text-secondary prose-h2:text-2xl prose-h2:font-semibold prose-h3:text-lg prose-h3:font-semibold prose-h3:mt-4 prose-li:leading-relaxed prose-li:marker:text-theme-interactive-primary prose-strong:text-theme-text-primary dark:prose-invert">
            <section className="p-6 rounded-2xl border border-theme-border-primary bg-theme-bg-primary shadow-sm space-y-3">
              <h2 className="text-2xl font-semibold text-theme-text-primary">Quick summary</h2>
              <p className="mb-3 text-theme-text-secondary">If you only read one section, read this one:</p>
              <ul className="leading-relaxed list-disc pl-5 space-y-2">
                <li>We collect only the information we need to run your account, generate quizzes and show learning insights.</li>
                <li>We do not sell your personal information.</li>
                <li>We use a small set of trusted providers for hosting, authentication, email and analytics, and we expect them to protect your data.</li>
                <li>You can ask us to export or delete your account data, unless we’re legally required to keep some records (for example, billing).</li>
                <li>If you are a lecturer, professor, student or school teacher, you stay in control of how you use Quizzence in your courses, classes and studies.</li>
              </ul>
            </section>

            <section className="p-6 rounded-2xl border border-theme-border-primary bg-theme-bg-primary shadow-sm space-y-3">
              <h2 className="text-2xl font-semibold text-theme-text-primary">1. Who we are and when this policy applies</h2>
              <p>
                When we say “Quizzence”, “we” or “us”, we mean the operator of the Quizzence platform (website and app).
                For the purposes of UK and EU data protection law (UK GDPR / GDPR), Quizzence is the “data controller” for the personal information described in this policy, unless we state otherwise.
              </p>
              <p>This Privacy Policy applies when you:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Visit our website or app (whether you have an account or not).</li>
                <li>Create an account and log in.</li>
                <li>Use Quizzence to create, share or complete quizzes.</li>
                <li>Contact us by email or through in-product forms.</li>
              </ul>
              <p>
                If you are using Quizzence as part of a school, university or other organisation, that organisation may also be a “controller” for some of the data about you (for example, if they manage your account or assignments). In those cases, their policies and instructions also apply.
              </p>
            </section>

            <section className="p-6 rounded-2xl border border-theme-border-primary bg-theme-bg-primary shadow-sm space-y-3">
              <h2 className="text-2xl font-semibold text-theme-text-primary">2. Data we collect</h2>
              <p>We collect the minimum information we need to operate the service and improve learning features. Depending on how you use Quizzence, this may include:</p>
              <h3 className="text-lg font-semibold text-theme-text-primary">2.1. Account and profile data</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Your name or display name.</li>
                <li>Email address and password (or OAuth login details if you sign in with a third-party provider such as Google).</li>
                <li>Role or context you choose to give us (e.g. teacher, lecturer, student).</li>
              </ul>
              <h3 className="text-lg font-semibold text-theme-text-primary">2.2. Content you create</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Quizzes, questions, answers, tags, explanations, hints and other learning materials you create or upload.</li>
                <li>Any documents, slides or other files you choose to upload so we can generate quizzes from them.</li>
                <li>Settings and metadata attached to quizzes (e.g. subject, difficulty, intended audience).</li>
              </ul>
              <h3 className="text-lg font-semibold text-theme-text-primary">2.3. Learning activity</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Which quizzes you or your learners attempt.</li>
                <li>Scores, attempts, completion status and progress over time.</li>
                <li>High-level analytics about quiz performance (e.g. which questions are commonly missed).</li>
              </ul>
              <h3 className="text-lg font-semibold text-theme-text-primary">2.4. Technical and usage data</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Basic device and browser information (e.g. type of device, operating system, browser).</li>
                <li>IP address and approximate region (not precise GPS data).</li>
                <li>How you move around the site (pages visited, buttons clicked, time spent), often collected using cookies or similar technologies.</li>
              </ul>
              <p>We use this to keep the service reliable, secure and to understand which features are useful.</p>
              <h3 className="text-lg font-semibold text-theme-text-primary">2.5. Communication data</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Messages you send us via email or support forms.</li>
                <li>Your preferences (for example, if you ask not to receive certain types of messages).</li>
              </ul>
              <p>We do not intentionally collect sensitive categories of data such as health information or political opinions. Please avoid putting this kind of information into your quizzes or uploads.</p>
            </section>

            <section className="p-6 rounded-2xl border border-theme-border-primary bg-theme-bg-primary shadow-sm space-y-3">
              <h2 className="text-2xl font-semibold text-theme-text-primary">3. How we use your data (and legal bases)</h2>
              <p>Under UK and EU data protection law, we must have a legal reason (“legal basis”) for using your data. In practice, most things we do fall into four buckets: contract, legitimate interests, consent and legal obligations.</p>
              <h3 className="text-lg font-semibold text-theme-text-primary">3.1. Run your account and deliver the service (contract)</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Create, store and display your quizzes and learning materials.</li>
                <li>Let you log in, log out and manage your profile.</li>
                <li>Show your learning activity, scores and progress over time.</li>
                <li>Provide teacher features like assignments, tracking and class-level insights (if implemented).</li>
              </ul>
              <p className="mb-6">Legal basis: necessary to perform a contract with you (providing the service you signed up for).</p>

              <h3 className="text-lg font-semibold text-theme-text-primary">3.2. Generate quizzes and feedback using AI (contract / legitimate interests)</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Turn your notes, documents or prompts into quiz questions.</li>
                <li>Suggest question variants or explanations using AI models.</li>
                <li>Improve how well quiz generation works by analysing overall patterns and error rates.</li>
              </ul>
              <p className="mb-6">Legal basis: contract (features you requested) and legitimate interests (making the product better while respecting your privacy).</p>

              <h3 className="text-lg font-semibold text-theme-text-primary">3.3. Keep the service secure and reliable (legitimate interests / legal obligations)</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Protect accounts, detect abuse or suspicious activity.</li>
                <li>Prevent attacks or attempts to break security.</li>
                <li>Enforce our Terms of Service.</li>
              </ul>
              <p className="mb-6">Legal basis: legitimate interests (security of our service and users) and, in some cases, legal obligations (e.g. responding to lawful requests).</p>

              <h3 className="text-lg font-semibold text-theme-text-primary">3.4. Communicate with you (contract / legitimate interests / consent)</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Send essential emails about your account (verification emails, password resets, changes to core terms).</li>
                <li>Notify you about product updates or new features that are likely to be relevant.</li>
                <li>Send optional tips and content about learning and quizzes, where you’ve chosen to receive them.</li>
              </ul>
              <p className="mb-6">
                Legal basis: contract for essential service messages; legitimate interests or consent for optional updates and tips (you can opt out at any time via unsubscribe links or settings).
              </p>

              <h3 className="text-lg font-semibold text-theme-text-primary">3.5. Analyse and improve Quizzence (legitimate interests)</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Understand which features are used most.</li>
                <li>Troubleshoot crashes or errors.</li>
                <li>Test new designs and flows to make the product clearer and faster.</li>
              </ul>
              <p>We do this mostly with aggregated or anonymised data and always aim to use the minimum personal information necessary.</p>
            </section>

            <section className="p-6 rounded-2xl border border-theme-border-primary bg-theme-bg-primary shadow-sm space-y-3">
              <h2 className="text-2xl font-semibold text-theme-text-primary">4. Cookies, analytics and similar technologies</h2>
              <p>Like most online services, we use cookies and similar technologies:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Essential cookies</strong> – needed for things like keeping you logged in and maintaining security.</li>
                <li><strong>Analytics cookies</strong> – help us understand how people use Quizzence so we can improve it.</li>
                <li><strong>Preference cookies</strong> – remember choices like theme, language or interface preferences.</li>
              </ul>
              <p>You can usually clear or block cookies in your browser settings. If you block essential cookies, some parts of Quizzence may not work properly.</p>
              <p>If we introduce cookie banners or more detailed cookie controls in future, those settings will sit alongside this section.</p>
            </section>

            <section className="p-6 rounded-2xl border border-theme-border-primary bg-theme-bg-primary shadow-sm space-y-3">
              <h2 className="text-2xl font-semibold text-theme-text-primary">5. AI and how your content is processed</h2>
              <p>Quizzence uses AI models to generate quiz questions and feedback from the content you provide. To do this we may:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Send chunks of your content (e.g. text from notes, documents, web pages) to AI service providers acting as data processors on our behalf.</li>
                <li>Store prompts and AI responses for a time so we can show you your generated quizzes, improve prompt templates, debug issues and prevent abuse.</li>
              </ul>
              <p>We do not use your personal content to train public AI models that anyone else can use outside Quizzence. If we ever plan to change that, we will be very clear and give you choices.</p>
            </section>

            <section className="p-6 rounded-2xl border border-theme-border-primary bg-theme-bg-primary shadow-sm space-y-3">
              <h2 className="text-2xl font-semibold text-theme-text-primary">6. Sharing your data and third-party providers</h2>
              <p>We don’t sell your data. We do share it with a small set of third parties when necessary to run the service. Typical categories include:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Hosting and infrastructure (cloud servers, databases, storage).</li>
                <li>Authentication and security (login providers, email verification).</li>
                <li>Email delivery (sending transactional emails and, if you opt in, newsletters).</li>
                <li>Analytics and monitoring (understanding usage patterns and performance).</li>
                <li>Payment processing (if and when paid plans are available).</li>
              </ul>
              <p>These partners act as data processors, meaning they can only use your data to provide their services to us and must protect it according to contracts and data protection law.</p>
              <p>We may also share data if required to comply with law or a valid legal process, or to protect the rights, safety and security of you, other users, Quizzence or the public.</p>
              <p>If Quizzence is ever involved in a merger, acquisition or similar event, data may be transferred to the new operator, who must respect this policy (or notify you of changes).</p>
            </section>

            <section className="p-6 rounded-2xl border border-theme-border-primary bg-theme-bg-primary shadow-sm space-y-3">
              <h2 className="text-2xl font-semibold text-theme-text-primary">7. International transfers</h2>
              <p>
                Our servers and some of our service providers may be located outside the country where you live. That means your data may be transferred to and processed in other countries, including outside the UK and European Economic Area (EEA).
              </p>
              <p>
                Where we transfer personal data from the UK or EEA to a country that doesn’t have an “adequate” level of protection under UK/EU law, we use appropriate legal safeguards, such as standard contractual clauses or equivalent mechanisms, to protect your data.
              </p>
            </section>

            <section className="p-6 rounded-2xl border border-theme-border-primary bg-theme-bg-primary shadow-sm space-y-3">
              <h2 className="text-2xl font-semibold text-theme-text-primary">8. How long we keep your data</h2>
              <p>We keep personal data only for as long as we reasonably need it for the purposes described in this policy, including:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>As long as you have an active account.</li>
                <li>A reasonable period afterwards in case you return, for backup, security and audit purposes.</li>
                <li>Longer where we are required to do so by law (for example, basic billing records and tax/invoice information).</li>
              </ul>
              <p>As a rough guide:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Account and profile data: kept while your account is active, then deleted or anonymised after a grace period.</li>
                <li>Quizzes and content: kept while your account is active, or until you delete them.</li>
                <li>Logs and analytics: kept for shorter periods wherever possible, and aggregated/anonymised over time.</li>
              </ul>
              <p>If you delete your account, we will remove or anonymise your personal data within a reasonable time, except where we must keep some information for legal or legitimate business reasons.</p>
            </section>

            <section className="p-6 rounded-2xl border border-theme-border-primary bg-theme-bg-primary shadow-sm space-y-3">
              <h2 className="text-2xl font-semibold text-theme-text-primary">9. How we protect your data</h2>
              <p>We take reasonable technical and organisational measures, such as:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Using HTTPS to encrypt data in transit between your device and our servers.</li>
                <li>Access controls and authentication to limit who can see what.</li>
                <li>Keeping systems and libraries reasonably up to date and applying security patches.</li>
                <li>Monitoring for unusual patterns that might indicate abuse or attacks.</li>
              </ul>
              <p>If we ever become aware of a data breach that is likely to result in a high risk to your rights and freedoms, we will notify you and, where required, regulators.</p>
              <p>EdTech platforms are expected to be especially careful with learner data, and we design Quizzence with that in mind.</p>
            </section>

            <section className="p-6 rounded-2xl border border-theme-border-primary bg-theme-bg-primary shadow-sm space-y-3">
              <h2 className="text-2xl font-semibold text-theme-text-primary">10. Your rights</h2>
              <p>Depending on where you live (for example, in the UK or EEA), you may have the following rights over your personal data:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Access</strong> – Ask for a copy of the personal data we hold about you.</li>
                <li><strong>Correction</strong> – Ask us to fix inaccurate or incomplete data.</li>
                <li><strong>Deletion</strong> – Ask us to delete your data in certain circumstances (“right to be forgotten”).</li>
                <li><strong>Restriction</strong> – Ask us to limit how we use your data in certain cases.</li>
                <li><strong>Portability</strong> – Ask for your data in a structured, commonly used format.</li>
                <li><strong>Objection</strong> – Object to certain types of processing, especially where based on legitimate interests or direct marketing.</li>
                <li><strong>Withdraw consent</strong> – Where we rely on consent (for example, for optional emails), you can withdraw it at any time.</li>
              </ul>
              <p>
                To exercise these rights, contact us using the details below. We may need to verify your identity before responding. We aim to respond within 30 days, although complex requests may take longer.
              </p>
              <p>
                You also have the right to lodge a complaint with your local data protection authority (for example, the Information Commissioner’s Office (ICO) in the UK) if you are unhappy with how we handle your data. We’d appreciate the chance to resolve issues directly first.
              </p>
            </section>

            <section className="p-6 rounded-2xl border border-theme-border-primary bg-theme-bg-primary shadow-sm space-y-3">
              <h2 className="text-2xl font-semibold text-theme-text-primary">11. Students, teachers and children</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  Quizzence is primarily designed for adult users such as university lecturers, professors, tutors, and older students. However, teachers may choose to use Quizzence with younger learners.
                </li>
                <li>
                  If you are using Quizzence in a school or university setting, you are responsible for ensuring you have the right permissions and legal basis to use student data in this way (for example, under your institution’s policies and local law).
                </li>
                <li>
                  If you are a parent or guardian and believe a child has used Quizzence without appropriate consent or supervision, please contact us so we can review and, if needed, delete the account or data.
                </li>
              </ul>
              <p>We do not knowingly allow children to create accounts that bypass the rules or age restrictions of their country or school.</p>
            </section>

            <section className="p-6 rounded-2xl border border-theme-border-primary bg-theme-bg-primary shadow-sm space-y-3">
              <h2 className="text-2xl font-semibold text-theme-text-primary">12. Changes to this policy</h2>
              <p>
                We may update this Privacy Policy from time to time, for example if we add new features that affect how we handle data, start using new service providers, or need to reflect changes in law or guidance.
              </p>
              <p>
                When we make significant changes, we’ll update the “Last updated” date at the top and, where appropriate, notify you in the product or by email. If you keep using Quizzence after changes take effect, we’ll treat that as acceptance of the updated policy. If you don’t agree with the new version, you should stop using Quizzence and, if you wish, delete your account.
              </p>
            </section>

            <section className="p-6 rounded-2xl border border-theme-border-primary bg-theme-bg-primary shadow-sm space-y-3">
              <h2 className="text-2xl font-semibold text-theme-text-primary">13. How to contact us</h2>
              <p>
                If you have questions about this Privacy Policy or how we handle your data, you can contact us at{' '}
                <a className="text-theme-interactive-primary hover:text-theme-interactive-info" href="mailto:privacy@quizzence.com">
                  privacy@quizzence.com
                </a>{' '}
                or via the support/contact options shown in the Quizzence app.
              </p>
              <p>
                If you are a university, school or other organisation with specific data protection requirements (for example, a Data Processing Agreement), please mention this when you contact us so we can respond appropriately.
              </p>
              <p>
                You can also connect with me directly on{' '}
                <a
                  className="text-theme-interactive-primary hover:text-theme-interactive-info"
                  href="https://www.linkedin.com/in/alekseylazunin/"
                  target="_blank"
                  rel="noreferrer"
                >
                  LinkedIn
                </a>
                .
              </p>
            </section>
          </article>
        </div>
      </PageContainer>
    </>
  );
};

export default PrivacyPage;
