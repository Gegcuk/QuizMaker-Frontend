// src/pages/ProfilePage.tsx
// ---------------------------------------------------------------------------
// Profile page that wraps UserProfile component with standardized layout
// ---------------------------------------------------------------------------

import React from 'react';
import { PageContainer, UserProfile } from '@/components';
import { Seo } from '@/features/seo';
import { TokenTopUp } from '@/features/billing';

const ProfilePage: React.FC = () => {
  return (
    <>
      <Seo title="My Profile | Quizzence" noindex />
      <PageContainer
      title="My Profile"
      subtitle="View and edit your account information"
      showBreadcrumb={true}
      containerClassName="max-w-4xl"
    >
      <div className="space-y-6">
        <UserProfile />

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-theme-text-primary">Purchase Tokens</h2>
          <TokenTopUp />
        </section>
      </div>
    </PageContainer>
    </>
  );
};

export default ProfilePage; 
