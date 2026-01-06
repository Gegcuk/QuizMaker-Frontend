import React from 'react';
import { Link } from 'react-router-dom';
import { PageContainer } from '@/components';
import { Seo } from '@/features/seo';
import { ValuesPageContent, HeroImagePlaceholder } from '@/features/values';

const ValuesPage: React.FC = () => {
  return (
    <>
      <Seo
        title="Values, Mission, and Vision | Quizzence"
        description="The principles behind Quizzence: transparency, evidence-based learning, dialogue, and continuous growth — with a focus on turning noisy information into real understanding."
        canonicalPath="/values/"
        ogType="website"
      />
      <PageContainer
        title="Values, Mission, and Vision"
        subtitle="Less noise — more meaning."
        showHeader
        showBreadcrumb
      >
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Hero Image */}
          <div className="w-full -mx-4 md:mx-0">
            <HeroImagePlaceholder />
          </div>
          <ValuesPageContent />
          {/* Link to FAQ */}
          <div className="text-center pt-8 border-t border-theme-border-primary">
            <p className="text-sm text-theme-text-secondary">
              Have questions? Check out our{' '}
              <Link
                to="/faq"
                className="text-theme-interactive-primary hover:text-theme-interactive-primary-hover underline"
              >
                FAQ page
              </Link>
              {' '}for answers to common questions.
            </p>
          </div>
        </div>
      </PageContainer>
    </>
  );
};

export default ValuesPage;
