import React from 'react';
import { PageContainer } from '@/components';
import { Seo } from '@/features/seo';
import { FaqPageContent, faqIntroNote, faqPageMeta, faqSections } from '@/features/faq';

const FaqPage: React.FC = () => {
  return (
    <>
      <Seo
        title="FAQ | Quizzence"
        description="Answers to common questions about Quizzence, quizzes, and AI quiz generation."
        canonicalPath="/faq/"
        ogType="website"
      />
      <PageContainer
        title={faqPageMeta.title}
        subtitle={faqPageMeta.subtitle}
        showHeader
        showBreadcrumb
        customBreadcrumbItems={[
          { label: 'Home', path: '/' },
          { label: 'FAQ', path: '/faq/', isCurrent: true },
        ]}
      >
        <FaqPageContent introNote={faqIntroNote} sections={faqSections} />
      </PageContainer>
    </>
  );
};

export default FaqPage;
