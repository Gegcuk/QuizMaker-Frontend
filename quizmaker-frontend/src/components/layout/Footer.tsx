import React from 'react';
import { Link } from 'react-router-dom';

// Simple SVG icons for social links (no external dependencies)
const GitHubIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
  </svg>
);

const LinkedInIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const TwitterIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
  </svg>
);

const EmailIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const version = '1.0.0'; // This could be imported from package.json or env

  const quickLinks = [
    { name: 'About Us', href: '/about' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Contact Support', href: '/contact' },
    { name: 'Help/FAQ', href: '/help' },
  ];

  const socialLinks = [
    {
      name: 'GitHub',
      href: 'https://github.com/quizmaker',
      icon: GitHubIcon,
    },
    {
      name: 'LinkedIn',
      href: 'https://linkedin.com/company/quizmaker',
      icon: LinkedInIcon,
    },
    {
      name: 'Twitter',
      href: 'https://twitter.com/quizmaker',
      icon: TwitterIcon,
    },
    {
      name: 'Email',
      href: 'mailto:support@quizmaker.com',
      icon: EmailIcon,
    },
  ];

  return (
    <footer className="bg-theme-bg-primary border-t border-theme-border-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center mb-4">
              <div className="text-2xl font-bold text-theme-text-primary">QuizMaker</div>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              Empowering educators and learners with intelligent quiz creation and assessment tools.
            </p>
            <p className="text-gray-500 text-xs">
              Version {version}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-theme-text-primary tracking-wider uppercase mb-4">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-600 hover:text-theme-text-primary text-sm transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-sm font-semibold text-theme-text-primary tracking-wider uppercase mb-4">
              Product
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/quizzes"
                  className="text-gray-600 hover:text-theme-text-primary text-sm transition-colors duration-200"
                >
                  Browse Quizzes
                </Link>
              </li>
              <li>
                <Link
                  to="/quizzes/create"
                  className="text-gray-600 hover:text-theme-text-primary text-sm transition-colors duration-200"
                >
                  Create Quiz
                </Link>
              </li>
              <li>
                <Link
                  to="/analytics"
                  className="text-gray-600 hover:text-theme-text-primary text-sm transition-colors duration-200"
                >
                  Analytics
                </Link>
              </li>
              <li>
                <Link
                  to="/api-docs"
                  className="text-gray-600 hover:text-theme-text-primary text-sm transition-colors duration-200"
                >
                  API Documentation
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="text-sm font-semibold text-theme-text-primary tracking-wider uppercase mb-4">
              Connect With Us
            </h3>
            <div className="flex space-x-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    aria-label={social.name}
                  >
                    <Icon />
                  </a>
                );
              })}
            </div>
            
            {/* Contact Info */}
            <div className="mt-6">
              <p className="text-gray-600 text-sm mb-2">
                Need help? Contact us:
              </p>
              <a
                href="mailto:support@quizmaker.com"
                className="text-blue-600 hover:text-blue-800 text-sm transition-colors duration-200"
              >
                support@quizmaker.com
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Section - Legal */}
        <div className="mt-12 pt-8 border-t border-theme-border-primary">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Copyright */}
            <div className="text-gray-500 text-sm">
              © {currentYear} QuizMaker. All rights reserved.
            </div>

            {/* Legal Links */}
            <div className="flex flex-wrap justify-center md:justify-end space-x-6 text-sm">
              <Link
                to="/privacy"
                className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms"
                className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                Terms of Service
              </Link>
              <Link
                to="/cookies"
                className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                Cookie Policy
              </Link>
              <Link
                to="/accessibility"
                className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                Accessibility
              </Link>
            </div>
          </div>

          {/* Additional Legal Info */}
          <div className="mt-4 text-center md:text-left">
            <p className="text-gray-400 text-xs">
              QuizMaker is committed to providing accessible and secure educational technology solutions.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 