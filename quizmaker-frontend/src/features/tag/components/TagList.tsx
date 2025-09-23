import React, { useState, useEffect } from 'react';
import { TagDto } from '@/types';
import { TagService, api } from '@/services';
import { Spinner, Card, Table } from '@/components';
import { TableColumn } from '@/components/ui/Table';

interface TagListProps {
  onEditTag: (tag: TagDto) => void;
  onDeleteTag: (tagId: string) => void;
  onTagSelect?: (tag: TagDto) => void;
  showActions?: boolean;
  className?: string;
}

export const TagList: React.FC<TagListProps> = ({
  onEditTag,
  onDeleteTag,
  onTagSelect,
  showActions = true,
  className = ''
}) => {
  const [tags, setTags] = useState<TagDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');

  const tagService = new TagService(api);

  const loadTags = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const sortParam = `${sortBy},${sortOrder}`;
      const response = await tagService.getTags({
        page: currentPage,
        size: pageSize,
        sort: sortParam
      });

      setTags(response.content);
      setTotalPages(response.pageable.totalPages);
      setTotalElements(response.pageable.totalElements);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tags');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTags();
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

  const handleDelete = async (tagId: string) => {
    if (window.confirm('Are you sure you want to delete this tag?')) {
      try {
        await tagService.deleteTag(tagId);
        onDeleteTag(tagId);
        loadTags(); // Reload the list
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete tag');
      }
    }
  };

  // Define table columns
  const columns: TableColumn<TagDto>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (value: string, tag: TagDto) => (
        <div className="flex items-center">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-theme-bg-tertiary text-theme-interactive-primary mr-3">
            {tag.name}
          </span>
          <div className="text-sm font-medium text-theme-text-primary">{tag.name}</div>
        </div>
      )
    },
    {
      key: 'description',
      header: 'Description',
      render: (value) => (
        <div className="text-sm text-theme-text-secondary max-w-xs truncate">
          {value || 'No description'}
        </div>
      )
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (value: string) => (
        <div className="text-sm text-theme-text-secondary">
          {new Date(value).toLocaleDateString()}
        </div>
      )
    },
    ...(showActions ? [{
      key: 'actions',
      header: 'Actions',
      align: 'right' as const,
      render: (value: string, tag: TagDto) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditTag(tag);
            }}
            className="text-theme-text-tertiary hover:text-theme-text-primary"
            title="Edit tag"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(tag.id);
            }}
            className="text-theme-text-tertiary hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            title="Delete tag"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )
    }] : [])
  ];

  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tag.description && tag.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading && tags.length === 0) {
    return (
      <div className={`flex justify-center items-center p-8 ${className}`}>
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="text-red-800">{error}</span>
        </div>
        <button
          onClick={loadTags}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <Card 
      className={className}
      header={
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-theme-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-theme-focus-ring focus:border-transparent bg-theme-bg-primary text-theme-text-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="px-3 py-2 border border-theme-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-theme-focus-ring bg-theme-bg-primary text-theme-text-primary"
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
        </div>
      }
    >

      {/* Tags Table */}
      <Table
        data={filteredTags}
        columns={columns}
        sortable={true}
        onRowClick={onTagSelect ? (tag) => onTagSelect(tag) : undefined}
        pagination={{
          currentPage,
          pageSize,
          total: totalElements,
          onPageChange: handlePageChange,
          onPageSizeChange: handlePageSizeChange
        }}
      />
    </Card>
  );
};