// src/pages/SettingsPage.tsx
// ---------------------------------------------------------------------------
// Settings page that wraps UserSettings component with standardized layout
// ---------------------------------------------------------------------------

import React from 'react';
import { PageContainer } from '@/components';
import { Seo } from '@/features/seo';
import UserSettings from './UserSettings';

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
