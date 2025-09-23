import React, { useEffect, useState } from 'react';
import { Spinner, PageContainer, ConfirmationModal } from '@/components';
import { CategoryDto } from '../features/category';
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../features/category';

const CategoryManagementPage: React.FC = () => {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [displayedCount, setDisplayedCount] = useState<number>(5);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState<boolean>(false);
  const [editing, setEditing] = useState<CategoryDto | null>(null);
  const [name, setName] = useState<string>('');
  const [desc, setDesc] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);

  // Confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAllCategories({ page: 0, size: 100 });
      setCategories(response.content);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setDesc('');
    setFormError(null);
    setShowForm(true);
  };

  const openEdit = (cat: CategoryDto) => {
    setEditing(cat);
    setName(cat.name);
    setDesc(cat.description || '');
    setFormError(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSubmitting(true);

    if (name.trim().length < 3 || name.trim().length > 100) {
      setFormError('Name must be between 3 and 100 characters.');
      setFormSubmitting(false);
      return;
    }

    try {
      if (editing) {
        await updateCategory(editing.id, { name: name.trim(), description: desc.trim() });
      } else {
        await createCategory({ name: name.trim(), description: desc.trim() });
      }
      setShowForm(false);
      await fetchCategories();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to save category.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setCategoryToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteCategory(categoryToDelete);
      await fetchCategories();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete category.');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setCategoryToDelete(null);
    }
  };

  return (
    <PageContainer
      title="Manage Categories"
      subtitle="Create, edit, and organize quiz categories"
      showBreadcrumb={true}
      actions={[
        {
          label: 'Create Category',
          type: 'create',
          variant: 'primary',
          onClick: openCreate
        }
      ]}
      containerClassName="max-w-4xl"
    >
      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="bg-theme-bg-danger border border-red-200 rounded-md p-4">
          <p className="text-theme-interactive-danger">{error}</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-theme-text-tertiary">No categories found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Header with count */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-theme-text-primary">Categories</h3>
            <span className="text-sm text-theme-text-tertiary">
              {categories.length > displayedCount 
                ? `Showing ${displayedCount} of ${categories.length} categories`
                : `${categories.length} categor${categories.length !== 1 ? 'ies' : 'y'} available`
              }
            </span>
          </div>

          {/* Categories list */}
          <div className="bg-theme-bg-primary shadow rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-theme-bg-secondary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-text-tertiary uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-theme-text-tertiary uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-theme-text-tertiary uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-theme-bg-primary divide-y divide-theme-border-primary">
                {categories.slice(0, displayedCount).map((cat) => (
                  <tr key={cat.id} className="hover:bg-theme-bg-secondary">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-theme-text-primary">{cat.name}</td>
                    <td className="px-6 py-4 text-sm text-theme-text-tertiary">{cat.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button onClick={() => openEdit(cat)} className="text-theme-interactive-primary hover:text-indigo-900">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(cat.id)} className="text-theme-interactive-danger hover:text-red-900">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Show More Button */}
          {categories.length > displayedCount && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => setDisplayedCount(prev => Math.min(prev + 5, categories.length))}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-theme-interactive-primary bg-theme-bg-primary border border-theme-interactive-primary rounded-md hover:bg-theme-bg-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-interactive-primary transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                Show 5 More
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center p-4 z-50">
          <div className="bg-theme-bg-primary p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">{editing ? 'Edit Category' : 'New Category'}</h3>
            {formError && <div className="text-red-500 mb-2">{formError}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="catName" className="block text-sm font-medium text-theme-text-secondary mb-1">
                  Name <span className="text-theme-interactive-danger">*</span>
                </label>
                <input
                  id="catName"
                  type="text"
                  required
                  minLength={3}
                  maxLength={100}
                  className="w-full border border-theme-border-primary px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:border-theme-interactive-primary"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="catDesc" className="block text-sm font-medium text-theme-text-secondary mb-1">
                  Description
                </label>
                <textarea
                  id="catDesc"
                  className="w-full border border-theme-border-primary px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:border-theme-interactive-primary"
                  rows={3}
                  maxLength={1000}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowForm(false)} 
                  className="px-4 py-2 text-sm font-medium text-theme-text-secondary bg-theme-bg-primary border border-theme-border-primary rounded-md hover:bg-theme-bg-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 text-sm font-medium text-white bg-theme-interactive-primary border border-transparent rounded-md hover:bg-theme-interactive-primary disabled:opacity-50" 
                  disabled={formSubmitting}
                >
                  {formSubmitting ? 'Saving...' : editing ? 'Save' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setCategoryToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Category"
        message="Are you sure you want to delete this category? This action cannot be undone."
        confirmText="Delete Category"
        variant="danger"
        isLoading={isDeleting}
      />
    </PageContainer>
  );
};

export default CategoryManagementPage;