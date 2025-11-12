import React, { useState, useEffect } from 'react';
import { CategoryDto } from '@/types';
import { categoryService } from '@/services';
import { Spinner, Button, Input, Dropdown, Alert } from '@/components';

interface CategoryListProps {
  onEditCategory: (category: CategoryDto) => void;
  onDeleteCategory: (categoryId: string) => void;
  onCategorySelect?: (category: CategoryDto) => void;
  showActions?: boolean;
  className?: string;
}

export const CategoryList: React.FC<CategoryListProps> = ({
  onEditCategory,
  onDeleteCategory,
  onCategorySelect,
  showActions = true,
  className = ''
}) => {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');


  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const sortParam = `${sortBy},${sortOrder}`;
      const response = await categoryService.getCategories({
        page: currentPage,
        size: pageSize,
        sort: sortParam
      });

      setCategories(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, [currentPage, pageSize, sortBy, sortOrder]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(0);
  };

  const handleDelete = async (categoryId: string) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await categoryService.deleteCategory(categoryId);
        onDeleteCategory(categoryId);
        loadCategories(); // Reload the list
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete category');
      }
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading && categories.length === 0) {
    return (
      <div className={`flex justify-center items-center p-8 ${className}`}>
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <Alert type="error" dismissible onDismiss={() => setError(null)}>
          {error}
          <div className="mt-2">
            <Button variant="ghost" size="sm" onClick={loadCategories}>
              Try again
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className={`bg-theme-bg-primary rounded-lg shadow-theme ${className}`}>
      {/* Search and Controls */}
      <div className="p-4 border-b border-theme-border-primary bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex-1 max-w-md">
            <Input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
            />
          </div>
          <div className="flex items-center gap-2">
            <Dropdown
              value={String(pageSize)}
              onChange={(value) => handlePageSizeChange(Number(value))}
              options={[
                { label: '5 per page', value: '5' },
                { label: '10 per page', value: '10' },
                { label: '20 per page', value: '20' },
                { label: '50 per page', value: '50' }
              ]}
            />
          </div>
        </div>
      </div>

      {/* Categories Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-theme-border-primary">
          <thead className="bg-theme-bg-secondary">
            <tr>
              <th
                onClick={() => handleSort('name')}
                className="px-6 py-3 text-left text-xs font-medium text-theme-text-tertiary uppercase tracking-wider cursor-pointer hover:bg-theme-bg-secondary"
              >
                <div className="flex items-center">
                  Name
                  {sortBy === 'name' && (
                    <svg className={`ml-1 w-4 h-4 ${sortOrder === 'asc' ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-theme-text-tertiary uppercase tracking-wider">
                Description
              </th>
              {showActions && (
                <th className="px-6 py-3 text-right text-xs font-medium text-theme-text-tertiary uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-theme-bg-primary divide-y divide-theme-border-primary">
            {filteredCategories.map((category) => (
              <tr
                key={category.id}
                className={`hover:bg-theme-bg-secondary ${onCategorySelect ? 'cursor-pointer' : ''}`}
                onClick={() => onCategorySelect && onCategorySelect(category)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-theme-text-primary">{category.name}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-theme-text-tertiary max-w-xs truncate">
                    {category.description || 'No description'}
                  </div>
                </td>
                {showActions && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditCategory(category);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(category.id);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {filteredCategories.length === 0 && !loading && (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-theme-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-theme-text-primary">No categories found</h3>
          <p className="mt-1 text-sm text-theme-text-tertiary">
            {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating a new category.'}
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-theme-bg-primary px-4 py-3 flex items-center justify-between border-t border-theme-border-primary sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages - 1}
            >
              Next
            </Button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-theme-text-secondary">
                Showing{' '}
                <span className="font-medium">{currentPage * pageSize + 1}</span>
                {' '}to{' '}
                <span className="font-medium">
                  {Math.min((currentPage + 1) * pageSize, totalElements)}
                </span>
                {' '}of{' '}
                <span className="font-medium">{totalElements}</span>
                {' '}results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                  className="rounded-l-md rounded-r-none"
                  leftIcon={
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  }
                >
                  <span className="sr-only">Previous</span>
                </Button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = Math.max(0, Math.min(totalPages - 5, currentPage - 2)) + i;
                  return (
                    <Button
                      key={page}
                      variant={page === currentPage ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className="rounded-none"
                    >
                      {page + 1}
                    </Button>
                  );
                })}
                
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages - 1}
                  className="rounded-r-md rounded-l-none"
                  rightIcon={
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  }
                >
                  <span className="sr-only">Next</span>
                </Button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 