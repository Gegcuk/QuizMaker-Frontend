// src/pages/SettingsPage.tsx
// ---------------------------------------------------------------------------
// Settings page that wraps UserSettings component with standardized layout
// ---------------------------------------------------------------------------

import React from 'react';
import { PageContainer } from '../components/layout';
import { UserSettings } from '../components/user';

const SettingsPage: React.FC = () => {
  return (
    <PageContainer
      title="Account Settings"
      subtitle="Manage your preferences, privacy, and security settings"
      showBreadcrumb={true}
      containerClassName="max-w-4xl"
    >
      <UserSettings />
    </PageContainer>
  );
};

export default SettingsPage; 