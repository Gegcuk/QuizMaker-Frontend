// src/features/billing/components/BillingPage.tsx
// ---------------------------------------------------------------------------
// Billing page for managing tokens, viewing balance, and transaction history
// ---------------------------------------------------------------------------

import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader, Card, CardBody, Button, Spinner, Alert } from '@/components';
import { adminService, billingService } from '@/services';
import type { BalanceDto } from '@/types';
import type { AxiosError } from 'axios';
import TokenTopUp from './TokenTopUp';
import TransactionHistory from './TransactionHistory';
import { 
  CurrencyDollarIcon, 
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { Seo } from '@/features/seo';
import { useAuth } from '@/features/auth';

const BillingPage: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.roles?.includes('ROLE_SUPER_ADMIN');
  const [balance, setBalance] = useState<BalanceDto | null>(null);
  const [isBalanceLoading, setIsBalanceLoading] = useState(true);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [billingDisabled, setBillingDisabled] = useState(false);
  const [isSyncingPacks, setIsSyncingPacks] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [packsRefreshKey, setPacksRefreshKey] = useState(0);

  const fetchBalance = useCallback(async () => {
    setIsBalanceLoading(true);
    setBalanceError(null);
    setBillingDisabled(false);

    try {
      const balanceResponse = await billingService.getBalance();
      setBalance(balanceResponse);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const status = axiosError.response?.status;

      setBalance(null);

      if (status === 404) {
        setBillingDisabled(true);
      } else if (status === 403) {
        setBalanceError('You do not have permission to view billing information.');
      } else {
        const errorMessage = axiosError.response?.data?.message || 'Failed to load billing information';
        setBalanceError(errorMessage);
      }
    } finally {
      setIsBalanceLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBalance();
  }, [fetchBalance]);

  const handleRefreshBalance = () => {
    void fetchBalance();
  };

  const handleSyncPacks = useCallback(async () => {
    setIsSyncingPacks(true);
    setSyncError(null);
    setSyncMessage(null);

    try {
      const packs = await adminService.syncBillingPacks();
      setPacksRefreshKey(previous => previous + 1);
      setSyncMessage(`Synced ${packs.length} token ${packs.length === 1 ? 'pack' : 'packs'} from Stripe.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sync token packs.';
      setSyncError(message);
    } finally {
      setIsSyncingPacks(false);
    }
  }, []);

  // Calculate total tokens
  const totalTokens = balance ? balance.availableTokens + balance.reservedTokens : 0;

  return (
    <>
      <Seo
        title="Billing & Tokens | Quizzence"
        description="Check your token balance, purchase additional tokens and review your Quizzence billing history."
        canonicalPath="/billing"
        ogType="website"
      />
      <PageHeader
        title="Billing & Tokens"
        subtitle="Manage your token balance and view transaction history"
        showBreadcrumb={true}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Balance Overview Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-theme-text-primary">Token Balance</h2>
              {!billingDisabled && !balanceError && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRefreshBalance}
                  disabled={isBalanceLoading}
                  loading={isBalanceLoading}
                  leftIcon={<ArrowPathIcon className="w-4 h-4" />}
                >
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
              )}
            </div>

            {isBalanceLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} variant="default" padding="md">
                    <CardBody>
                      <div className="animate-pulse">
                        <div className="h-4 bg-theme-bg-tertiary rounded w-24 mb-2" />
                        <div className="h-8 bg-theme-bg-tertiary rounded w-20" />
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            ) : billingDisabled ? (
              <Card variant="default" padding="md">
                <CardBody>
                  <div className="text-center py-8">
                    <CurrencyDollarIcon className="mx-auto h-12 w-12 text-theme-text-tertiary mb-3" />
                    <p className="text-sm text-theme-text-secondary">
                      Billing features are not enabled for this environment yet.
                    </p>
                    <p className="text-xs text-theme-text-tertiary mt-2">
                      Token balance and purchasing options will appear here once available.
                    </p>
                  </div>
                </CardBody>
              </Card>
            ) : balanceError ? (
              <Card variant="default" padding="md">
                <CardBody>
                  <div className="bg-theme-bg-danger border border-theme-border-danger rounded-lg p-4">
                    <p className="text-sm text-theme-interactive-danger">{balanceError}</p>
                  </div>
                </CardBody>
              </Card>
            ) : balance ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Available Tokens */}
                <Card variant="elevated" padding="md" hoverable>
                  <CardBody>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-theme-text-secondary mb-1">
                          Available Tokens
                        </p>
                        <p className="text-3xl font-bold text-theme-interactive-primary">
                          {balance.availableTokens.toLocaleString()}
                        </p>
                        <p className="text-xs text-theme-text-tertiary mt-1">
                          Ready to use
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-theme-bg-success rounded-lg flex items-center justify-center">
                        <CurrencyDollarIcon className="w-6 h-6 text-theme-interactive-success" />
                      </div>
                    </div>
                  </CardBody>
                </Card>

                {/* Reserved Tokens */}
                <Card variant="elevated" padding="md" hoverable>
                  <CardBody>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-theme-text-secondary mb-1">
                          Reserved Tokens
                        </p>
                        <p className="text-3xl font-bold text-theme-text-primary">
                          {balance.reservedTokens.toLocaleString()}
                        </p>
                        <p className="text-xs text-theme-text-tertiary mt-1">
                          Pending operations
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-theme-bg-warning rounded-lg flex items-center justify-center">
                        <ClockIcon className="w-6 h-6 text-theme-interactive-warning" />
                      </div>
                    </div>
                  </CardBody>
                </Card>

                {/* Total Tokens */}
                <Card variant="elevated" padding="md" hoverable>
                  <CardBody>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-theme-text-secondary mb-1">
                          Total Balance
                        </p>
                        <p className="text-3xl font-bold text-theme-text-primary">
                          {totalTokens.toLocaleString()}
                        </p>
                        <p className="text-xs text-theme-text-tertiary mt-1">
                          {balance.updatedAt ? `Updated ${new Date(balance.updatedAt).toLocaleDateString()}` : 'No updates yet'}
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-theme-bg-info rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-theme-interactive-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>
            ) : null}
          </div>

          {/* Token Purchase Section */}
          {!billingDisabled && !balanceError && (
            <div>
              <h2 className="text-lg font-semibold text-theme-text-primary mb-4">Purchase Tokens</h2>
              {isSuperAdmin && (
                <div className="mb-3 flex flex-col gap-2 rounded-lg border border-theme-border-primary bg-theme-bg-primary/50 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-xs text-theme-text-tertiary">
                    Superadmin: sync token packs from Stripe when prices or products change.
                  </div>
                  <div className="flex items-center gap-2">
                    {isSyncingPacks && <Spinner size="sm" />}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleSyncPacks()}
                      disabled={isSyncingPacks}
                    >
                      {isSyncingPacks ? 'Syncing…' : 'Sync Stripe packs'}
                    </Button>
                  </div>
                </div>
              )}

              {syncError && (
                <div className="mb-3">
                  <Alert type="error" className="text-sm">
                    {syncError}
                  </Alert>
                </div>
              )}

              {syncMessage && (
                <div className="mb-3">
                  <Alert type="success" className="text-sm">
                    {syncMessage}
                  </Alert>
                </div>
              )}

              <TokenTopUp refreshKey={packsRefreshKey} />
            </div>
          )}

          {/* Transaction History Section */}
          {!billingDisabled && !balanceError && (
            <div>
              <h2 className="text-lg font-semibold text-theme-text-primary mb-4">Transaction History</h2>
              <TransactionHistory />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BillingPage;
