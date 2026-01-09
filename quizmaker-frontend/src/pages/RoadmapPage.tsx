// src/pages/RoadmapPage.tsx
// ---------------------------------------------------------------------------
// Roadmap page with detailed timeline view
// ---------------------------------------------------------------------------

import React from 'react';
import { PageContainer } from '@/components';
import { Seo } from '@/features/seo';
import { TimelineView } from '@/features/roadmap/components';

const RoadmapPage: React.FC = () => {
  return (
    <>
      <Seo
        title="Product Roadmap | Quizzence"
        description="Explore our product roadmap and upcoming features. See what we're building to enhance your quiz creation and learning experience."
        canonicalPath="/roadmap"
        ogType="website"
      />
      <PageContainer
        title="Product Roadmap"
        subtitle="Our development plan for 2026 and beyond. Dates are estimates and may shift as we learn."
        showHeader
        showBreadcrumb
      >
        <div className="max-w-7xl mx-auto space-y-6">
          <TimelineView />
        </div>
      </PageContainer>
    </>
  );
};

export default RoadmapPage;
