import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Card, CardBody, Button, Alert, Spinner } from '@/components';
import { useAuth } from '@/features/auth';
import { Seo } from '@/features/seo';
import { MAX_CHECKOUT_CHECKS, useCheckoutReconciliation, type CheckoutPhase } from '../hooks/useCheckoutReconciliation';

const messages: Record<CheckoutPhase, { title: string; detail: string }> = {
  checking: { title: 'Checking checkout', detail: 'Requesting the latest payment and token credit status.' },
  waiting: { title: 'Waiting for confirmation', detail: 'Another automatic check is scheduled. Confirmation can take a few minutes.' },
  offline: { title: 'You’re offline', detail: 'Checks are paused. When you reconnect, we’ll check once for an update.' },
  exhausted: { title: 'Automatic checks stopped', detail: 'Confirmation is taking longer than expected. Choose Check again to start another bounded check.' },
  failed: { title: 'Payment failed', detail: 'This payment failed. Review your billing history before starting another purchase.' },
  refunded: { title: 'Payment refunded', detail: 'This payment was fully refunded. Review your billing history for the current balance and transaction details.' },
  'partially-refunded': { title: 'Payment partially refunded', detail: 'This payment was partially refunded. Review your billing history for the current balance and transaction details.' },
  unknown: { title: 'Checkout status unavailable', detail: 'We could not confirm the latest checkout status. Automatic checks have stopped. You can check again.' },
  credited: { title: 'Payment confirmed — tokens credited', detail: 'Your tokens have been credited.' },
  unavailable: { title: 'Checkout recovery unavailable', detail: 'This checkout cannot be recovered for the current account. Review your billing history or contact support to confirm the purchase.' },
  expired: { title: 'Checkout recovery expired', detail: 'The five-minute recovery window has ended. Review your billing history or contact support to confirm the purchase.' },
};

const CheckoutConfirmation = ({ accountId }: { accountId: string }) => {
  const navigate = useNavigate();
  const checkout = useCheckoutReconciliation(accountId);
  const message = messages[checkout.phase];
  const retryable = ['checking', 'waiting', 'offline', 'exhausted', 'unknown'].includes(checkout.phase);
  return (
    <Card variant="default" padding="lg">
      <CardBody className="space-y-4">
        <div role="status" aria-live="polite" aria-atomic="true" className="space-y-3">
          <h2 className="text-lg font-semibold text-theme-text-primary">{message.title}</h2>
          <p className="text-sm text-theme-text-secondary">{message.detail}</p>
          {checkout.paymentConfirmed && checkout.phase !== 'credited' && (
            <p className="text-sm text-theme-text-primary">Payment succeeded. Tokens are still awaiting credit.</p>
          )}
          {checkout.phase === 'credited' && checkout.creditedTokens !== null && (
            <p className="text-sm text-theme-text-secondary">Credited: {checkout.creditedTokens.toLocaleString()} tokens</p>
          )}
          {retryable && <p className="text-xs text-theme-text-tertiary">Automatic checks: {checkout.checks} of {MAX_CHECKOUT_CHECKS}</p>}
        </div>
        {checkout.balanceState === 'loading' && <p className="text-sm text-theme-text-secondary">Refreshing your balance…</p>}
        {checkout.balanceState === 'error' && (
          <Alert type="warning">Tokens are credited, but the latest balance could not be loaded. Refresh the balance or review billing.</Alert>
        )}
        {checkout.balance && (
          <div className="rounded-md border border-theme-border-primary bg-theme-bg-primary p-4">
            <p className="text-sm font-semibold text-theme-text-primary">Updated balance</p>
            <p className="text-2xl font-bold text-theme-interactive-primary">{checkout.balance.availableTokens.toLocaleString()} tokens</p>
            <p className="text-xs text-theme-text-tertiary">Reserved: {checkout.balance.reservedTokens.toLocaleString()}</p>
          </div>
        )}
        <div className="flex flex-wrap gap-3">
          {retryable && (
            <Button variant="secondary" onClick={checkout.retry} disabled={checkout.phase === 'checking' || checkout.phase === 'offline'}>
              {checkout.phase === 'checking' ? 'Checking…' : 'Check again'}
            </Button>
          )}
          {checkout.balanceState === 'error' && <Button variant="secondary" onClick={checkout.refreshBalance}>Refresh balance</Button>}
          <Button onClick={() => navigate('/billing')}>Go to billing</Button>
        </div>
        {checkout.phase !== 'credited' && (
          <p className="text-sm text-theme-text-secondary">
            If confirmation remains unresolved, contact support@quizzence.com with your purchase date and receipt.
            Checking again does not make another purchase. Avoid purchasing again while confirmation is unresolved.
          </p>
        )}
      </CardBody>
    </Card>
  );
};

const BillingSuccessPage: React.FC = () => {
  const { user, isLoading } = useAuth();
  return (
    <>
      <Seo title="Checkout Confirmation | Quizzence" description="Confirm your checkout status and token crediting." canonicalPath="/billing/success" ogType="website" noindex />
      <PageHeader title="Checkout confirmation" subtitle="Check the latest payment, token credit, and balance information." showBreadcrumb />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? <Spinner /> : user ? <CheckoutConfirmation key={user.id} accountId={user.id} /> : (
          <Alert type="warning">Sign in to the account used for this purchase to view billing.</Alert>
        )}
      </div>
    </>
  );
};

export default BillingSuccessPage;
