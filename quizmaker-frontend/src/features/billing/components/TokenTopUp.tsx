import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { AxiosError } from 'axios';
import { billingService } from '@/services';
import type { BillingConfigResponse, TokenPackDto } from '@/types';

interface TokenTopUpProps {
  className?: string;
}

const TokenTopUp: React.FC<TokenTopUpProps> = ({ className = '' }) => {
  const [config, setConfig] = useState<BillingConfigResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);

  const loadConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const configResponse = await billingService.getConfig();
      setConfig(configResponse);

      if (configResponse.prices.length > 0) {
        setSelectedPackId(prevSelected => {
          if (prevSelected && configResponse.prices.some(pack => pack.id === prevSelected)) {
            return prevSelected;
          }
          return configResponse.prices[0].id;
        });
      } else {
        setSelectedPackId(null);
      }
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const status = axiosError.response?.status;

      setConfig(null);
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
    void loadConfig();
  }, [loadConfig]);

  const formatPrice = useCallback((pack: TokenPackDto) => {
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

  const selectedPack = useMemo(() => {
    if (!config || !selectedPackId) return null;
    return config.prices.find(pack => pack.id === selectedPackId) ?? null;
  }, [config, selectedPackId]);

  const handleCheckout = useCallback(async () => {
    if (!selectedPack) return;

    setIsProcessingCheckout(true);
    setError(null);

    try {
      const response = await billingService.createCheckoutSession({
        packId: selectedPack.id,
        priceId: selectedPack.stripePriceId,
      });
      window.location.assign(response.url);
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const status = axiosError.response?.status;

      if (status === 403) {
        setError('You do not have permission to purchase tokens.');
      } else if (status === 404) {
        setError('The selected token pack is no longer available. Please try again.');
        void loadConfig();
      } else if (status === 429) {
        setError('You are making requests too quickly. Please wait a moment and try again.');
      } else {
        const message = axiosError.response?.data?.message || 'Failed to start checkout session. Please try again later.';
        setError(message);
      }
    } finally {
      setIsProcessingCheckout(false);
    }
  }, [loadConfig, selectedPack]);

  const handleRetry = useCallback(() => {
    void loadConfig();
  }, [loadConfig]);

  return (
    <div className={`bg-theme-bg-primary border border-theme-border-primary rounded-lg p-4 ${className}`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-theme-text-primary">Top up tokens</h3>
          <p className="text-xs text-theme-interactive-primary mt-1">
            Purchase additional billing tokens securely via Stripe checkout.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRetry}
          className="text-xs font-medium text-theme-interactive-primary hover:text-theme-interactive-primary disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? 'Refreshing…' : 'Reload packs'}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-theme-border-danger bg-theme-bg-danger px-3 py-2 text-sm text-theme-interactive-danger">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="animate-pulse rounded-md border border-theme-border-primary bg-theme-bg-primary/60 p-4"
            >
              <div className="mb-2 h-4 w-24 rounded bg-theme-bg-primary" />
              <div className="mb-1 h-6 w-32 rounded bg-theme-bg-primary" />
              <div className="h-3 w-20 rounded bg-theme-bg-primary" />
            </div>
          ))}
        </div>
      ) : null}

      {!isLoading && config && config.prices.length > 0 ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            {config.prices.map(pack => {
              const isSelected = pack.id === selectedPackId;
              return (
                <button
                  type="button"
                  key={pack.id}
                  onClick={() => setSelectedPackId(pack.id)}
                  className={`w-full rounded-md border p-4 text-left transition-all ${
                    isSelected
                      ? 'border-theme-border-primary bg-theme-bg-primary shadow-sm'
                      : 'border-theme-border-primary bg-theme-bg-primary hover:border-theme-interactive-primary hover:shadow-sm'
                  }`}
                  aria-pressed={isSelected}
                >
                  <p className="text-sm font-semibold text-theme-text-primary">{pack.name}</p>
                  <p className="mt-1 text-2xl font-semibold text-theme-interactive-primary">{formatPrice(pack)}</p>
                  <p className="mt-2 text-xs uppercase tracking-wide text-theme-interactive-primary">
                    {pack.tokens.toLocaleString()} tokens
                  </p>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-theme-text-tertiary">
              You will be redirected to Stripe Checkout to complete your purchase. Tokens become available immediately after
              payment confirmation.
            </p>
            <button
              type="button"
              onClick={handleCheckout}
              disabled={!selectedPack || isProcessingCheckout}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-theme-interactive-primary px-4 py-2 text-sm font-semibold text-theme-text-primary shadow-sm hover:bg-theme-bg-primary0 disabled:cursor-not-allowed disabled:bg-theme-bg-tertiary"
            >
              {isProcessingCheckout ? 'Redirecting…' : 'Top up tokens'}
            </button>
          </div>
        </>
      ) : null}

      {!isLoading && config && config.prices.length === 0 && !error ? (
        <div className="rounded-md border border-theme-border-primary bg-theme-bg-primary px-3 py-2 text-sm text-theme-interactive-primary">
          Token packs are not configured yet. Please check back later.
        </div>
      ) : null}
    </div>
  );
};

export default TokenTopUp;