// src/features/billing/components/BillingSuccessPage.tsx
// ---------------------------------------------------------------------------
// Handles the Stripe success redirect. Confirms checkout status via API,
// polls while pending, and refreshes balance once credited.
// ---------------------------------------------------------------------------

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  PageHeader,
  Card,
  CardBody,
  Button,
  Alert,
  Spinner,
} from '@/components';
import { billingService } from '@/services';
import type { CheckoutSessionStatus, BalanceDto } from '@/types';
import { Seo } from '@/features/seo';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

const POLL_DELAY_MS = 2000;
const MAX_POLL_ATTEMPTS = 5;

const BillingSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const sessionId = searchParams.get('session_id')?.trim() || null;

  const [checkoutStatus, setCheckoutStatus] = useState<CheckoutSessionStatus | null>(null);
  const [balance, setBalance] = useState<BalanceDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);

  const normalizedStatus = (checkoutStatus?.status ?? '').toUpperCase();
  const isSuccess = normalizedStatus === 'SUCCEEDED' || checkoutStatus?.credited;
  const isPending = normalizedStatus === 'PENDING' && !checkoutStatus?.credited;
  const isFailure =
    normalizedStatus === 'FAILED' ||
    normalizedStatus === 'REFUNDED' ||
    normalizedStatus === 'PARTIALLY_REFUNDED';

  const loadBalance = useCallback(async () => {
    try {
      const latestBalance = await billingService.getBalance();
      if (!cancelledRef.current) {
        setBalance(latestBalance);
      }
    } catch {
      // Balance fetch failures are non-blocking here
    }
  }, []);

  const pollStatus = useCallback(
    async (attempt = 0) => {
      if (!sessionId || cancelledRef.current) return;

      setIsPolling(true);
      setError(null);

      try {
        const statusResponse = await billingService.getCheckoutSessionStatus(sessionId);
        if (cancelledRef.current) return;

        setCheckoutStatus(statusResponse);
        setAttempts(attempt + 1);

        const statusUpper = (statusResponse.status ?? '').toUpperCase();
        const succeeded = statusUpper === 'SUCCEEDED' || statusResponse.credited;
        const stillPending = statusUpper === 'PENDING' && !statusResponse.credited;

        if (succeeded) {
          await loadBalance();
          return;
        }

        if (stillPending && attempt < MAX_POLL_ATTEMPTS - 1) {
          timeoutRef.current = setTimeout(() => {
            void pollStatus(attempt + 1);
          }, POLL_DELAY_MS);
        }
      } catch (err) {
        if (cancelledRef.current) return;
        const message =
          (err as any)?.response?.data?.message ||
          (err as Error)?.message ||
          'Failed to confirm checkout status.';
        setError(message);
      } finally {
        if (!cancelledRef.current) {
          setIsPolling(false);
        }
      }
    },
    [loadBalance, sessionId],
  );

  useEffect(() => {
    cancelledRef.current = false;

    if (sessionId) {
      void pollStatus(0);
    } else {
      setError('Missing Stripe session id. Please return to billing to retry.');
    }

    return () => {
      cancelledRef.current = true;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [pollStatus, sessionId]);

  const handleRetry = () => {
    if (!sessionId) {
      navigate('/billing');
      return;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setAttempts(0);
    void pollStatus(0);
  };

  return (
    <>
      <Seo
        title="Checkout Confirmation | Quizzence"
        description="Confirm your Stripe checkout status and token crediting."
        canonicalPath="/billing/success"
        ogType="website"
      />

      <PageHeader
        title="Checkout confirmation"
        subtitle="We’re confirming your purchase and updating your token balance."
        showBreadcrumb
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card variant="default" padding="lg">
          <CardBody className="space-y-4">
            {error && (
              <Alert type="error">
                {error}
              </Alert>
            )}

            {!sessionId ? (
              <div className="space-y-4">
                <p className="text-sm text-theme-text-secondary">
                  We couldn’t find your Stripe session. Return to billing to start a new checkout.
                </p>
                <Button type="button" variant="primary" onClick={() => navigate('/billing')}>
                  Back to billing
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-theme-text-primary">
                      Session ID
                    </p>
                    <p className="text-xs text-theme-text-secondary break-all">
                      {sessionId}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRetry}
                    disabled={isPolling}
                    leftIcon={<ArrowPathIcon className="w-4 h-4" />}
                  >
                    {isPolling ? 'Checking…' : 'Check again'}
                  </Button>
                </div>

                <div className="rounded-md border border-theme-border-primary bg-theme-bg-primary p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    {isSuccess ? (
                      <CheckCircleIcon className="h-6 w-6 text-theme-interactive-success" />
                    ) : isFailure ? (
                      <XCircleIcon className="h-6 w-6 text-theme-interactive-danger" />
                    ) : (
                      <ClockIcon className="h-6 w-6 text-theme-interactive-warning" />
                    )}
                    <div>
                      <p className="text-sm font-semibold text-theme-text-primary">
                        {isSuccess
                          ? 'Payment confirmed'
                          : isFailure
                          ? 'Payment failed or refunded'
                          : 'Payment processing'}
                      </p>
                      <p className="text-xs text-theme-text-secondary">
                        {isSuccess
                          ? checkoutStatus?.credited
                            ? 'Tokens have been added to your balance.'
                            : 'Payment succeeded. Waiting for tokens to credit...'
                          : isFailure
                          ? 'Please try again or contact support if this persists.'
                          : 'This can take a few seconds. We’ll keep checking automatically.'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-theme-text-secondary">
                    <div className="rounded border border-theme-border-primary bg-theme-bg-secondary p-3">
                      <p className="font-semibold text-theme-text-primary mb-1">Status</p>
                      <p className="uppercase tracking-wide text-theme-interactive-primary">
                        {normalizedStatus || 'UNKNOWN'}
                      </p>
                    </div>
                    <div className="rounded border border-theme-border-primary bg-theme-bg-secondary p-3">
                      <p className="font-semibold text-theme-text-primary mb-1">Credited</p>
                      <p>
                        {checkoutStatus?.credited
                          ? `Yes${checkoutStatus?.creditedTokens ? ` (${checkoutStatus.creditedTokens.toLocaleString()} tokens)` : ''}`
                          : 'Not yet'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-theme-text-tertiary">
                    <span>Attempt {attempts} of {MAX_POLL_ATTEMPTS}</span>
                    {isPolling && (
                      <span className="flex items-center gap-2">
                        <Spinner size="sm" />
                        Checking…
                      </span>
                    )}
                  </div>
                </div>

                {balance ? (
                  <div className="rounded-md border border-theme-border-primary bg-theme-bg-primary p-4">
                    <p className="text-sm font-semibold text-theme-text-primary">Updated balance</p>
                    <p className="text-2xl font-bold text-theme-interactive-primary">
                      {balance.availableTokens.toLocaleString()} tokens
                    </p>
                    <p className="text-xs text-theme-text-tertiary">
                      Reserved: {balance.reservedTokens.toLocaleString()}
                    </p>
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  <Button type="button" variant="primary" onClick={() => navigate('/billing')}>
                    Go to billing
                  </Button>
                  {isFailure && (
                    <Button type="button" variant="secondary" onClick={() => navigate('/billing')}>
                      Try again
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
};

export default BillingSuccessPage;
