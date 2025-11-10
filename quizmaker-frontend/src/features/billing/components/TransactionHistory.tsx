// src/features/billing/components/TransactionHistory.tsx
// ---------------------------------------------------------------------------
// Transaction history component with filtering and pagination
// Displays user's token transaction history
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { billingService } from '@/services';
import type { TransactionDto, TokenTransactionType, TokenTransactionSource } from '@/types';
import { Button, Badge, Spinner } from '@/components';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

interface TransactionHistoryProps {
  className?: string;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ className = '' }) => {
  const [transactions, setTransactions] = useState<TransactionDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [typeFilter, setTypeFilter] = useState<TokenTransactionType | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<TokenTransactionSource | 'all'>('all');

  const pageSize = 10;

  // Load transactions
  useEffect(() => {
    const loadTransactions = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params: any = {
          page: currentPage,
          size: pageSize
        };

        if (typeFilter !== 'all') {
          params.type = typeFilter;
        }

        if (sourceFilter !== 'all') {
          params.source = sourceFilter;
        }

        const response = await billingService.getTransactions(params);
        setTransactions(response.content);
        setTotalPages(response.totalPages);
        setTotalElements(response.totalElements);
      } catch (err: any) {
        setError(err.message || 'Failed to load transactions');
      } finally {
        setIsLoading(false);
      }
    };

    loadTransactions();
  }, [currentPage, typeFilter, sourceFilter]);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get transaction type badge variant
  const getTypeVariant = (type: TokenTransactionType): 'success' | 'danger' | 'warning' | 'neutral' => {
    switch (type) {
      case 'PURCHASE':
      case 'REFUND':
      case 'RELEASE':
        return 'success';
      case 'RESERVE':
      case 'COMMIT':
        return 'danger';
      case 'ADJUSTMENT':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  // Format type text
  const formatType = (type: string) => {
    return type.replace(/_/g, ' ');
  };

  // Format source text
  const formatSource = (source: string) => {
    return source.replace(/_/g, ' ');
  };

  if (isLoading && transactions.length === 0) {
    return (
      <div className={`flex justify-center py-12 ${className}`}>
        <Spinner size="lg" />
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
    <div className={className}>
      {/* Filters - Desktop */}
      <div className="hidden md:flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-theme-text-secondary">Type:</label>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as TokenTransactionType | 'all');
              setCurrentPage(0);
            }}
            className="px-3 py-1.5 text-sm border border-theme-border-primary rounded-lg bg-theme-bg-primary text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary"
          >
            <option value="all">All Types</option>
            <option value="PURCHASE">Purchase</option>
            <option value="RESERVE">Reserve</option>
            <option value="COMMIT">Commit</option>
            <option value="RELEASE">Release</option>
            <option value="REFUND">Refund</option>
            <option value="ADJUSTMENT">Adjustment</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-theme-text-secondary">Source:</label>
          <select
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value as TokenTransactionSource | 'all');
              setCurrentPage(0);
            }}
            className="px-3 py-1.5 text-sm border border-theme-border-primary rounded-lg bg-theme-bg-primary text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary"
          >
            <option value="all">All Sources</option>
            <option value="QUIZ_GENERATION">Quiz Generation</option>
            <option value="AI_CHECK">AI Check</option>
            <option value="ADMIN">Admin</option>
            <option value="STRIPE">Stripe</option>
          </select>
        </div>

        {(typeFilter !== 'all' || sourceFilter !== 'all') && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setTypeFilter('all');
              setSourceFilter('all');
              setCurrentPage(0);
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Filters - Mobile */}
      <div className="md:hidden space-y-3 mb-4">
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value as TokenTransactionType | 'all');
            setCurrentPage(0);
          }}
          className="w-full px-3 py-2 text-sm border border-theme-border-primary rounded-lg bg-theme-bg-primary text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary"
        >
          <option value="all">All Types</option>
          <option value="PURCHASE">Purchase</option>
          <option value="RESERVE">Reserve</option>
          <option value="COMMIT">Commit</option>
          <option value="RELEASE">Release</option>
          <option value="REFUND">Refund</option>
          <option value="ADJUSTMENT">Adjustment</option>
        </select>

        <select
          value={sourceFilter}
          onChange={(e) => {
            setSourceFilter(e.target.value as TokenTransactionSource | 'all');
            setCurrentPage(0);
          }}
          className="w-full px-3 py-2 text-sm border border-theme-border-primary rounded-lg bg-theme-bg-primary text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary"
        >
          <option value="all">All Sources</option>
          <option value="QUIZ_GENERATION">Quiz Generation</option>
          <option value="AI_CHECK">AI Check</option>
          <option value="ADMIN">Admin</option>
          <option value="STRIPE">Stripe</option>
        </select>

        {(typeFilter !== 'all' || sourceFilter !== 'all') && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setTypeFilter('all');
              setSourceFilter('all');
              setCurrentPage(0);
            }}
            fullWidth
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Transactions List */}
      {transactions.length === 0 ? (
        <div className="text-center py-12 bg-theme-bg-secondary rounded-lg border border-theme-border-primary">
          <p className="text-theme-text-secondary">No transactions found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Desktop Table */}
          <div className="hidden md:block bg-theme-bg-primary border border-theme-border-primary rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-theme-border-secondary">
              <thead className="bg-theme-bg-secondary">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-theme-text-secondary uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-theme-text-secondary uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-theme-text-secondary uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-theme-text-secondary uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-theme-text-secondary uppercase tracking-wider">
                    Balance After
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border-secondary">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-theme-bg-secondary transition-colors">
                    <td className="px-4 py-3 text-sm text-theme-text-secondary whitespace-nowrap">
                      {formatDate(transaction.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant={getTypeVariant(transaction.type)} size="sm">
                        {formatType(transaction.type)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-theme-text-secondary">
                      {formatSource(transaction.source)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className={`font-medium flex items-center justify-end gap-1 ${
                        transaction.amountTokens > 0 ? 'text-theme-interactive-success' : 'text-theme-interactive-danger'
                      }`}>
                        {transaction.amountTokens > 0 ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />}
                        {transaction.amountTokens > 0 ? '+' : ''}{transaction.amountTokens.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-theme-text-primary text-right font-medium">
                      {transaction.balanceAfterAvailable !== null ? transaction.balanceAfterAvailable.toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="bg-theme-bg-primary border border-theme-border-primary rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <Badge variant={getTypeVariant(transaction.type)} size="sm">
                      {formatType(transaction.type)}
                    </Badge>
                  </div>
                  <span className={`font-semibold text-lg ${
                    transaction.amountTokens > 0 ? 'text-theme-interactive-success' : 'text-theme-interactive-danger'
                  }`}>
                    {transaction.amountTokens > 0 ? '+' : ''}{transaction.amountTokens.toLocaleString()}
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-theme-text-secondary">Source:</span>
                    <span className="text-theme-text-primary">{formatSource(transaction.source)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-theme-text-secondary">Date:</span>
                    <span className="text-theme-text-primary">{formatDate(transaction.createdAt)}</span>
                  </div>
                  {transaction.balanceAfterAvailable !== null && (
                    <div className="flex justify-between pt-1 border-t border-theme-border-secondary">
                      <span className="text-theme-text-secondary">Balance After:</span>
                      <span className="font-medium text-theme-text-primary">{transaction.balanceAfterAvailable.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-theme-text-secondary">
            Showing {transactions.length > 0 ? currentPage * pageSize + 1 : 0} to{' '}
            {Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements} transactions
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 0}
            >
              Previous
            </Button>
            <span className="text-sm text-theme-text-secondary">
              Page {currentPage + 1} of {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;

