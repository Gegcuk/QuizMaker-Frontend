import React from 'react';
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
        customBreadcrumbItems={[
          { label: 'Home', path: '/' },
          { label: 'Values', path: '/values/', isCurrent: true },
        ]}
      >
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Hero Image */}
          <div className="w-full -mx-4 md:mx-0">
            <HeroImagePlaceholder />
          </div>
          <ValuesPageContent />
        </div>
      </PageContainer>
    </>
  );
};

export default ValuesPage;
