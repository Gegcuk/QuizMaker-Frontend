// src/features/auth/components/LinkedAccounts.tsx
// ---------------------------------------------------------------------------
// Component for managing linked OAuth accounts
// Displays connected accounts and allows linking/unlinking
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { authService } from '@/services';
import type { LinkedAccountsResponse, OAuthAccountDto, OAuthProvider } from '@/types';
import { Button, Badge, useToast, ConfirmationModal } from '@/components';
import { LinkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface LinkedAccountsProps {
  className?: string;
}

const LinkedAccounts: React.FC<LinkedAccountsProps> = ({ className = '' }) => {
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccountsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unlinkingProvider, setUnlinkingProvider] = useState<OAuthProvider | null>(null);
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const { addToast } = useToast();

  // Provider configuration with branded icons
  const providerConfig: Record<OAuthProvider, {
    name: string;
    icon: React.ReactNode;
  }> = {
    GOOGLE: {
      name: 'Google',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
      ),
    },
    GITHUB: {
      name: 'GitHub',
      icon: (
        <svg className="w-5 h-5 fill-theme-text-primary" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
        </svg>
      ),
    },
    FACEBOOK: {
      name: 'Facebook',
      icon: <></>,
    },
    MICROSOFT: {
      name: 'Microsoft',
      icon: <></>,
    },
    APPLE: {
      name: 'Apple',
      icon: <></>,
    },
  };

  // Available OAuth providers (GitHub and Google only)
  const availableProviders: OAuthProvider[] = ['GITHUB', 'GOOGLE'];

  // Load linked accounts
  useEffect(() => {
    const loadLinkedAccounts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const accounts = await authService.getLinkedAccounts();
        setLinkedAccounts(accounts);
      } catch (err: any) {
        setError(err.message || 'Failed to load linked accounts');
      } finally {
        setIsLoading(false);
      }
    };

    loadLinkedAccounts();
  }, []);

  // Check if provider is linked
  const isProviderLinked = (provider: OAuthProvider): boolean => {
    return linkedAccounts?.accounts.some(acc => acc.provider === provider) || false;
  };

  // Get linked account for provider
  const getLinkedAccount = (provider: OAuthProvider): OAuthAccountDto | undefined => {
    return linkedAccounts?.accounts.find(acc => acc.provider === provider);
  };

  // Handle link account
  const handleLinkAccount = (provider: OAuthProvider) => {
    const authUrl = authService.getOAuthAuthorizationUrl(provider, 'link');
    window.location.href = authUrl;
  };

  // Handle unlink account
  const handleUnlinkAccount = (provider: OAuthProvider) => {
    setUnlinkingProvider(provider);
    setShowUnlinkModal(true);
  };

  // Confirm unlink
  const confirmUnlink = async () => {
    if (!unlinkingProvider) return;

    setIsUnlinking(true);
    try {
      await authService.unlinkAccount({ provider: unlinkingProvider });
      
      // Update local state
      if (linkedAccounts) {
        setLinkedAccounts({
          accounts: linkedAccounts.accounts.filter(acc => acc.provider !== unlinkingProvider)
        });
      }

      addToast({
        type: 'success',
        title: 'Account Unlinked',
        message: `Your ${unlinkingProvider} account has been unlinked successfully.`,
        duration: 3000
      });

      setShowUnlinkModal(false);
      setUnlinkingProvider(null);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Unlink Failed',
        message: err.message || 'Failed to unlink account. Please try again.',
        duration: 5000
      });
    } finally {
      setIsUnlinking(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className={`space-y-3 ${className}`}>
        {[1, 2].map((i) => (
          <div key={i} className="animate-pulse bg-theme-bg-secondary rounded-lg p-4 border border-theme-border-primary">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-theme-bg-tertiary rounded-lg" />
                <div>
                  <div className="h-4 bg-theme-bg-tertiary rounded w-24 mb-2" />
                  <div className="h-3 bg-theme-bg-tertiary rounded w-32" />
                </div>
              </div>
              <div className="h-8 bg-theme-bg-tertiary rounded w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-theme-bg-danger border border-theme-border-danger rounded-lg p-4 ${className}`}>
        <p className="text-sm text-theme-interactive-danger">{error}</p>
      </div>
    );
  }

  return (
    <>
      <div className={`space-y-3 ${className}`}>
        {availableProviders.map((provider) => {
          const config = providerConfig[provider];
          const isLinked = isProviderLinked(provider);
          const account = getLinkedAccount(provider);

          return (
            <div
              key={provider}
              className="bg-theme-bg-primary border border-theme-border-primary rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              {/* Desktop Layout */}
              <div className="hidden md:flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center bg-theme-bg-tertiary rounded-lg">
                    {config.icon}
                  </div>
                  <div>
                    <p className="font-medium text-theme-text-primary flex items-center gap-2">
                      {config.name}
                      {isLinked && (
                        <CheckCircleIcon className="w-4 h-4 text-theme-interactive-success" />
                      )}
                    </p>
                    {isLinked && account ? (
                      <p className="text-sm text-theme-text-secondary">
                        {account.email} • Linked {formatDate(account.createdAt)}
                      </p>
                    ) : (
                      <p className="text-sm text-theme-text-tertiary">Not connected</p>
                    )}
                  </div>
                </div>
                <div>
                  {isLinked ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnlinkAccount(provider)}
                    >
                      Unlink
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => handleLinkAccount(provider)}
                      leftIcon={<LinkIcon className="w-4 h-4" />}
                    >
                      Connect
                    </Button>
                  )}
                </div>
              </div>

              {/* Mobile Layout */}
              <div className="md:hidden space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center bg-theme-bg-tertiary rounded-lg">
                    {config.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-theme-text-primary flex items-center gap-2">
                      {config.name}
                      {isLinked && (
                        <CheckCircleIcon className="w-4 h-4 text-theme-interactive-success" />
                      )}
                    </p>
                    {isLinked && account ? (
                      <p className="text-sm text-theme-text-secondary truncate">
                        {account.email}
                      </p>
                    ) : (
                      <p className="text-sm text-theme-text-tertiary">Not connected</p>
                    )}
                  </div>
                </div>
                {isLinked && account && (
                  <p className="text-xs text-theme-text-tertiary">
                    Linked {formatDate(account.createdAt)}
                  </p>
                )}
                <div>
                  {isLinked ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnlinkAccount(provider)}
                      fullWidth
                    >
                      Unlink
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => handleLinkAccount(provider)}
                      leftIcon={<LinkIcon className="w-4 h-4" />}
                      fullWidth
                    >
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Unlink Confirmation Modal */}
      <ConfirmationModal
        isOpen={showUnlinkModal}
        onClose={() => {
          setShowUnlinkModal(false);
          setUnlinkingProvider(null);
        }}
        onConfirm={confirmUnlink}
        title="Unlink Account"
        message={`Are you sure you want to unlink your ${unlinkingProvider} account? You can always reconnect it later.`}
        confirmText="Unlink"
        variant="danger"
        isLoading={isUnlinking}
      />
    </>
  );
};

export default LinkedAccounts;

