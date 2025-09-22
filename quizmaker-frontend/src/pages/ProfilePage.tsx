// src/pages/ProfilePage.tsx
// ---------------------------------------------------------------------------
// Profile page that wraps UserProfile component with standardized layout
// ---------------------------------------------------------------------------

import React from 'react';
import { PageContainer, UserProfile } from '@/components';

const ProfilePage: React.FC = () => {
  return (
    <PageContainer
      title="My Profile"
      subtitle="View and edit your account information"
      showBreadcrumb={true}
      containerClassName="max-w-4xl"
    >
      <UserProfile />
    </PageContainer>
  );
};

export default ProfilePage; 