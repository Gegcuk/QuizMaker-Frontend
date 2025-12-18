// src/features/billing/components/BillingCancelPage.tsx
// ---------------------------------------------------------------------------
// Shows a friendly message when a Stripe checkout is canceled.
// ---------------------------------------------------------------------------

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Card, CardBody, Button } from '@/components';
import { Seo } from '@/features/seo';
import { XCircleIcon } from '@heroicons/react/24/outline';

const BillingCancelPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      <Seo
        title="Checkout canceled | Quizzence"
        description="Your Stripe checkout was canceled. Start a new purchase anytime."
        canonicalPath="/billing/cancel"
        ogType="website"
      />

      <PageHeader
        title="Checkout canceled"
        subtitle="You can restart your purchase whenever you're ready."
        showBreadcrumb
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card variant="default" padding="lg">
          <CardBody className="space-y-4">
            <div className="flex items-start gap-3">
              <XCircleIcon className="h-6 w-6 text-theme-interactive-warning" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-theme-text-primary">
                  Checkout was canceled
                </p>
                <p className="text-xs text-theme-text-secondary">
                  No charges were made. Start a new checkout to purchase tokens.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="primary" onClick={() => navigate('/billing')}>
                Back to billing
              </Button>
              <Button type="button" variant="ghost" onClick={() => navigate('/billing')}>
                Try again
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
};

export default BillingCancelPage;
