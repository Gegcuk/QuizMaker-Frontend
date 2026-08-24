import React from 'react';
import { Seo } from '@/features/seo';

const NotFoundPage: React.FC = () => (
  <>
    <Seo
      title="Page Not Found | Quizzence"
      description="The page you’re looking for doesn’t exist or may have moved."
      ogType="website"
      noindex
    />
    <div className="p-4 text-center">
      <h1 className="text-2xl font-semibold">Page Not Found</h1>
    </div>
  </>
);

export default NotFoundPage;
