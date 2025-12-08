import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../features/auth';

// Simple SVG icons for social links (no external dependencies)
const GitHubIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.476 2 2 6.486 2 12.02c0 4.425 2.866 8.18 6.84 9.503.499.092.682-.217.682-.484 0-.236-.008-.868-.013-1.702-2.783.604-3.37-1.344-3.37-1.344-.453-1.157-1.11-1.465-1.11-1.465-.907-.62.07-.608.07-.608 1.002.07 1.53 1.033 1.53 1.033.892 1.53 2.34 1.087 2.91.831.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.952 0-1.093.39-1.988 1.03-2.688-.104-.252-.447-1.271.098-2.65 0 0 .84-.27 2.75 1.025A9.563 9.563 0 0112 6.843a9.56 9.56 0 012.504.338c1.909-1.296 2.747-1.027 2.747-1.027.545 1.38.201 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.36.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0022 12.02C22 6.486 17.522 2 12 2z"
    />
  </svg>
);

const LinkedInIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.57c0-1.327-.027-3.036-1.852-3.036-1.853 0-2.136 1.445-2.136 2.938v5.668H9.351V9h3.414v1.562h.046c.477-.9 1.637-1.85 3.37-1.85 3.6 0 4.266 2.37 4.266 5.455v6.285zM5.337 7.433c-1.144 0-2.063-.927-2.063-2.065 0-1.139.92-2.064 2.063-2.064 1.14 0 2.064.925 2.064 2.064 0 1.138-.925 2.065-2.064 2.065zm1.782 13.02H3.555V9h3.564v11.453zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.454C23.205 24 24 23.227 24 22.271V1.729C24 .774 23.205 0 22.225 0z" />
  </svg>
);

const TwitterIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.35 8.35 0 0022 5.92a8.2 8.2 0 01-2.356.646 4.118 4.118 0 001.804-2.27 8.223 8.223 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.105 4.105 0 001.27 5.477 4.07 4.07 0 01-1.857-.511v.052a4.106 4.106 0 003.292 4.023 4.097 4.097 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.614 11.614 0 006.29 1.844" />
  </svg>
);

const EmailIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const { isLoggedIn } = useAuth();

  const navigationGroups = [
    {
      heading: 'Platform',
      links: [
        { label: 'Home', to: isLoggedIn ? '/quizzes' : '/' },
        { label: 'Browse Quizzes', to: '/quizzes' },
        { label: 'Create Quiz', to: '/quizzes/create' },
        { label: 'Theme Demo', to: '/theme-demo' },
      ],
    },
    {
      heading: 'Resources',
      links: [
        { label: 'Blog', to: '/blog' },
        { label: 'Terms & Conditions', to: '/terms' },
        { label: 'Privacy Policy', to: '/privacy' },
        { label: 'Reset Password', to: '/forgot-password' },
        { label: 'Contact Support', href: 'mailto:support@quizzence.com' },
      ],
    },
  ];

  const legalLinks = [
    { label: 'Privacy Policy', to: '/privacy' },
    { label: 'Terms & Conditions', to: '/terms' },
  ];

  const socialLinks = [
    { name: 'GitHub', href: 'https://github.com/Gegcuk/', icon: GitHubIcon },
    { name: 'Email', href: 'mailto:support@quizzence.com', icon: EmailIcon },
    { name: 'LinkedIn', href: 'https://www.linkedin.com/in/alekseylazunin/', icon: LinkedInIcon },
  ];

  return (
    <footer
      className="border-t border-theme-border-primary bg-theme-bg-primary text-theme-text-primary"
      aria-labelledby="site-footer-heading"
    >
      <h2 id="site-footer-heading" className="sr-only">
        Site footer
      </h2>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-4">
          <div className="space-y-4">
            <div className="text-2xl font-semibold text-theme-text-primary">Quizzence</div>
            <p className="text-sm leading-relaxed text-theme-text-secondary">
              Create engaging quizzes, challenge yourself, and master any subject with our intuitive platform.
            </p>
          </div>

          <div className="space-y-6 lg:col-span-2">
            <div className="grid gap-8 sm:grid-cols-2">
              {navigationGroups.map((group) => (
                <div key={group.heading}>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-theme-text-primary">
                    {group.heading}
                  </h3>
                  <ul className="mt-4 space-y-3">
                    {group.links.map((link) => (
                      <li key={link.label}>
                        {link.to ? (
                          <Link
                            to={link.to}
                            className="text-sm text-theme-text-secondary transition-colors duration-200 hover:text-theme-text-primary"
                          >
                            {link.label}
                          </Link>
                        ) : (
                          <a
                            href={link.href}
                            className="text-sm text-theme-text-secondary transition-colors duration-200 hover:text-theme-text-primary"
                          >
                            {link.label}
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-theme-text-primary">Stay in touch</h3>
              <div className="mt-4 flex space-x-4">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-theme-text-tertiary transition-colors duration-200 hover:text-theme-text-secondary"
                      aria-label={social.name}
                    >
                      <Icon />
                    </a>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        <div className="mt-12 border-t border-theme-border-primary pt-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-theme-text-tertiary">© {currentYear} Quizzence. All rights reserved.</p>
            <div className="flex items-center">
              <p className="text-sm text-theme-text-tertiary">
                Crafted by{' '}
                <a
                  href="https://www.linkedin.com/in/alekseylazunin/"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-theme-interactive-primary hover:text-theme-interactive-info transition-colors duration-200"
                >
                  Aleksey Lazunin
                </a>
              </p>
            </div>
            <nav aria-label="Legal" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {legalLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  className="text-theme-text-tertiary transition-colors duration-200 hover:text-theme-text-secondary"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
