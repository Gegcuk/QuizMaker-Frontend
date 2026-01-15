// src/pages/SettingsPage.tsx
// ---------------------------------------------------------------------------
// Settings page that wraps UserSettings component with standardized layout
// ---------------------------------------------------------------------------

import React from 'react';
import { PageContainer, UserSettings } from '@/components';
import { Seo } from '@/features/seo';

const SettingsPage: React.FC = () => {
  return (
    <>
      <Seo title="Account Settings | Quizzence" noindex />
      <PageContainer
      title="Account Settings"
      subtitle="Manage your preferences, privacy, and security settings"
      showBreadcrumb={true}
      containerClassName="max-w-4xl"
    >
      <UserSettings />
    </PageContainer>
    </>
  );
};

export default SettingsPage; 