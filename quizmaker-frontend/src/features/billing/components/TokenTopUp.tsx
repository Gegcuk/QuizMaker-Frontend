import React, { useCallback, useEffect, useState } from 'react';
import type { AxiosError } from 'axios';
import { billingService } from '@/services';
import type { PackDto } from '@/types';
import { Button, Alert } from '@/components';

interface TokenTopUpProps {
  className?: string;
  refreshKey?: number;
}

const TokenTopUp: React.FC<TokenTopUpProps> = ({ className = '', refreshKey = 0 }) => {
  const [packs, setPacks] = useState<PackDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);

  const loadPacks = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const packResponse = await billingService.getPacks();
      setPacks(packResponse);

      if (packResponse.length > 0) {
        setSelectedPackId(prevSelected => {
          if (prevSelected && packResponse.some(pack => pack.id === prevSelected)) {
            return prevSelected;
          }
          return packResponse[0].id;
        });
      } else {
        setSelectedPackId(null);
      }
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const status = axiosError.response?.status;

      setPacks([]);
      setSelectedPackId(null);

      if (status === 404) {
        setError('Token purchases are not yet available in this environment.');
      } else {
        const message = axiosError.response?.data?.message || 'Failed to load token packs.';
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPacks();
  }, [loadPacks, refreshKey]);

  const formatPrice = useCallback((pack: PackDto) => {
    const normalizedCurrency = pack.currency?.toUpperCase?.() ?? 'USD';
    const amount = pack.priceCents / 100;

    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: normalizedCurrency,
      }).format(amount);
    } catch (formatError) {
      return `${amount.toFixed(2)} ${normalizedCurrency}`;
    }
  }, []);

  const handleCheckout = useCallback(async () => {
    if (!selectedPackId) return;

    setIsProcessingCheckout(true);
    setError(null);

    const requestedPackId = selectedPackId;
    let packsRefreshed = false;

    try {
      const refreshedPacks = await billingService.getPacks();
      setPacks(refreshedPacks);
      packsRefreshed = true;

      const packToCheckout = refreshedPacks.find(pack => pack.id === requestedPackId) ?? null;
      if (!packToCheckout) {
        const fallbackPackId = refreshedPacks[0]?.id ?? null;
        setSelectedPackId(fallbackPackId);

        if (fallbackPackId) {
          setError('The selected token pack is no longer available. Please select another one.');
        } else {
          setError('Token packs are not configured yet. Please check back later.');
        }
        return;
      }

      const response = await billingService.createCheckoutSession({
        packId: packToCheckout.id,
        priceId: packToCheckout.stripePriceId,
      });

      window.location.assign(response.url);
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const status = axiosError.response?.status;

      if (!packsRefreshed) {
        if (status === 404) {
          setError('Token purchases are not yet available in this environment.');
        } else {
          const message = axiosError.response?.data?.message || 'Failed to refresh token packs. Please try again later.';
          setError(message);
        }
        return;
      }

      if (status === 403) {
        setError('You do not have permission to purchase tokens.');
      } else if (status === 404) {
        setError('The selected token pack is no longer available. Please try again.');
        void loadPacks();
      } else if (status === 429) {
        setError('You are making requests too quickly. Please wait a moment and try again.');
      } else {
        const message = axiosError.response?.data?.message || 'Failed to start checkout session. Please try again later.';
        setError(message);
      }
    } finally {
      setIsProcessingCheckout(false);
    }
  }, [loadPacks, selectedPackId]);

  const handleRetry = useCallback(() => {
    void loadPacks();
  }, [loadPacks]);

  return (
    <div className={`bg-theme-bg-primary border border-theme-border-primary rounded-lg p-4 ${className}`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-theme-text-primary">Top up tokens</h3>
          <p className="text-xs text-theme-interactive-primary mt-1">
            Purchase additional billing tokens securely via Stripe checkout.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleRetry}
          disabled={isLoading}
          loading={isLoading}
        >
          {isLoading ? 'Refreshing…' : 'Reload packs'}
        </Button>
      </div>

      {error && (
        <div className="mb-4">
          <Alert type="error" className="text-sm">
            {error}
          </Alert>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="animate-pulse rounded-md border border-theme-border-primary bg-theme-bg-primary/60 p-4 text-theme-text-primary"
            >
              <div className="mb-2 h-4 w-24 rounded bg-theme-bg-primary" />
              <div className="mb-1 h-6 w-32 rounded bg-theme-bg-primary" />
              <div className="h-3 w-20 rounded bg-theme-bg-primary" />
            </div>
          ))}
        </div>
      ) : null}

      {!isLoading && packs.length > 0 ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {packs.map(pack => {
              const isSelected = pack.id === selectedPackId;
              return (
                <button
                  type="button"
                  key={pack.id}
                  onClick={() => setSelectedPackId(pack.id)}
                  className={`w-full rounded-lg border-2 p-4 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-theme-interactive-primary ${
                    isSelected
                      ? 'border-theme-interactive-primary bg-theme-bg-tertiary shadow-md'
                      : 'border-theme-border-primary bg-theme-bg-primary hover:border-theme-interactive-primary hover:shadow-sm'
                  }`}
                  aria-pressed={isSelected}
                  aria-label={`Select ${pack.name} pack with ${pack.tokens} tokens for ${formatPrice(pack)}`}
                >
                  <p className="text-sm font-semibold text-theme-text-primary">{pack.name}</p>
                  <p className="mt-1 text-2xl font-semibold text-theme-interactive-primary">{formatPrice(pack)}</p>
                  <p className="mt-2 text-xs uppercase tracking-wide text-theme-interactive-primary">
                    {pack.tokens.toLocaleString()} tokens
                  </p>
                  {pack.description ? (
                    <p className="mt-2 text-xs text-theme-text-tertiary line-clamp-3">
                      {pack.description}
                    </p>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-theme-text-tertiary">
              You will be redirected to Stripe Checkout to complete your purchase. Tokens become available immediately after
              payment confirmation.
            </p>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleCheckout}
              disabled={!selectedPackId || isProcessingCheckout}
              loading={isProcessingCheckout}
            >
              {isProcessingCheckout ? 'Redirecting…' : 'Top up tokens'}
            </Button>
          </div>
        </>
      ) : null}

      {!isLoading && packs.length === 0 && !error ? (
        <div className="rounded-md border border-theme-border-primary bg-theme-bg-primary px-3 py-2 text-sm text-theme-interactive-primary">
          Token packs are not configured yet. Please check back later.
        </div>
      ) : null}
    </div>
  );
};

export default TokenTopUp;
