// src/features/billing/components/TransactionHistory.tsx
// ---------------------------------------------------------------------------
// Transaction history component with filtering, sorting, and pagination
// Displays user's token transaction history
// ---------------------------------------------------------------------------

import React, { useState, useEffect, useMemo } from 'react';
import { billingService } from '@/services';
import type { TransactionDto } from '@/types';
import { Badge, Spinner } from '@/components';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import TransactionSortDropdown, { TransactionSortOption } from './TransactionSortDropdown';
import TransactionFilterDropdown, { TransactionFilterOptions } from './TransactionFilterDropdown';
import TransactionPagination from './TransactionPagination';

interface TransactionHistoryProps {
  className?: string;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ className = '' }) => {
  const [transactions, setTransactions] = useState<TransactionDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TransactionFilterOptions>({});
  const [sortBy, setSortBy] = useState<TransactionSortOption>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Load all transactions
  useEffect(() => {
    const loadTransactions = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Load all transactions (or a large page size)
        const response = await billingService.getTransactions({ page: 0, size: 1000 });
        // Filter out RESERVE transactions (always 0, shown in balance at top)
        const filteredTransactions = response.content.filter(t => t.type !== 'RESERVE');
        setTransactions(filteredTransactions);
      } catch (err: any) {
        setError(err.message || 'Failed to load transactions');
      } finally {
        setIsLoading(false);
      }
    };

    loadTransactions();
  }, []);

  // Client-side filtering
  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    // Apply type filter (multiple types)
    if (filters.types && filters.types.length > 0) {
      result = result.filter(t => filters.types!.includes(t.type));
    }

    // Apply source filter (multiple sources)
    if (filters.sources && filters.sources.length > 0) {
      result = result.filter(t => filters.sources!.includes(t.source));
    }

    return result;
  }, [transactions, filters]);

  // Client-side sorting
  const sortedTransactions = useMemo(() => {
    const result = [...filteredTransactions];

    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'amount_desc':
        result.sort((a, b) => Math.abs(b.amountTokens) - Math.abs(a.amountTokens));
        break;
      case 'amount_asc':
        result.sort((a, b) => Math.abs(a.amountTokens) - Math.abs(b.amountTokens));
        break;
    }

    return result;
  }, [filteredTransactions, sortBy]);

  // Client-side pagination
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedTransactions.slice(startIndex, endIndex);
  }, [sortedTransactions, currentPage, pageSize]);

  const pagination = useMemo(() => ({
    pageNumber: currentPage,
    pageSize,
    totalElements: sortedTransactions.length,
    totalPages: Math.ceil(sortedTransactions.length / pageSize)
  }), [sortedTransactions.length, currentPage, pageSize]);

  // Reset to first page when filters/sorting change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortBy, pageSize]);

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
  const getTypeVariant = (type: string): 'success' | 'danger' | 'warning' | 'neutral' => {
    switch (type) {
      case 'PURCHASE':
      case 'REFUND':
      case 'RELEASE':
        return 'success';
      case 'COMMIT':
        return 'danger';
      case 'ADJUSTMENT':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  // Format amount display
  const formatAmount = (transaction: TransactionDto): string => {
    // COMMIT means tokens consumed, so negate the amount for display
    const displayAmount = transaction.type === 'COMMIT' ? -Math.abs(transaction.amountTokens) : transaction.amountTokens;
    
    if (displayAmount > 0) {
      return `+${displayAmount.toLocaleString()}`;
    }
    
    return displayAmount.toLocaleString();
  };

  // Get display amount (handle COMMIT special case)
  const getDisplayAmount = (transaction: TransactionDto): number => {
    // COMMIT means tokens consumed, so negate the amount for display
    return transaction.type === 'COMMIT' ? -Math.abs(transaction.amountTokens) : transaction.amountTokens;
  };

  // Format type text
  const formatType = (type: string) => {
    return type.replace(/_/g, ' ');
  };

  // Format source text
  const formatSource = (source: string) => {
    return source.replace(/_/g, ' ');
  };

  const handleFiltersChange = (newFilters: TransactionFilterOptions) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const handleSortChange = (newSort: TransactionSortOption) => {
    setSortBy(newSort);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
  };

  if (isLoading) {
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
      {/* Empty State */}
      {transactions.length === 0 ? (
        <div className="text-center py-12 bg-theme-bg-secondary rounded-lg border border-theme-border-primary">
          <p className="text-theme-text-secondary">No transactions found</p>
        </div>
      ) : (
        <>
          {/* Controls Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-theme-text-secondary">
                {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''} found
              </span>
            </div>

            <div className="flex items-center space-x-3">
              {/* Filter Dropdown */}
              <TransactionFilterDropdown
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onClearFilters={handleClearFilters}
              />

              {/* Sort Dropdown */}
              <TransactionSortDropdown
                sortBy={sortBy}
                onSortChange={handleSortChange}
              />
            </div>
          </div>

          {/* Transactions List */}
          {paginatedTransactions.length === 0 ? (
            <div className="text-center py-12 bg-theme-bg-secondary rounded-lg border border-theme-border-primary">
              <p className="text-theme-text-secondary">No transactions match your filters</p>
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
                    {paginatedTransactions.map((transaction) => (
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
                          {transaction.amountTokens !== 0 && (
                            <span className={`font-medium flex items-center justify-end gap-1 ${
                              getDisplayAmount(transaction) > 0 ? 'text-theme-interactive-success' : 'text-theme-interactive-danger'
                            }`}>
                              {getDisplayAmount(transaction) > 0 ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />}
                              {formatAmount(transaction)}
                            </span>
                          )}
                          {transaction.amountTokens === 0 && (
                            <span className="text-theme-text-tertiary">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-theme-text-primary text-right font-medium">
                          {(transaction.balanceAfterAvailable !== null && transaction.balanceAfterAvailable > 0) 
                            ? transaction.balanceAfterAvailable.toLocaleString() 
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {paginatedTransactions.map((transaction) => (
                  <div key={transaction.id} className="bg-theme-bg-primary border border-theme-border-primary rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <Badge variant={getTypeVariant(transaction.type)} size="sm">
                          {formatType(transaction.type)}
                        </Badge>
                      </div>
                      {transaction.amountTokens !== 0 && (
                        <span className={`font-semibold text-lg ${
                          getDisplayAmount(transaction) > 0 ? 'text-theme-interactive-success' : 'text-theme-interactive-danger'
                        }`}>
                          {formatAmount(transaction)}
                        </span>
                      )}
                      {transaction.amountTokens === 0 && (
                        <span className="font-semibold text-lg text-theme-text-tertiary">—</span>
                      )}
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
                      {transaction.balanceAfterAvailable !== null && transaction.balanceAfterAvailable > 0 && (
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
          <TransactionPagination
            pagination={pagination}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            className="mt-6"
          />
        </>
      )}
    </div>
  );
};

export default TransactionHistory;
