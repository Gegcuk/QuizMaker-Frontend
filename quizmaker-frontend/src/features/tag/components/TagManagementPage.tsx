import React, { useEffect, useState } from 'react';
import { Spinner, PageContainer, ConfirmationModal } from '@/components';
import { TagDto } from '@/types';
import { TagService, api } from '@/services';

const TagManagementPage: React.FC = () => {
  const tagService = new TagService(api);
  
  /* ---------------------------- state --------------------------------- */
  const [tags, setTags] = useState<TagDto[]>([]);
  const [displayedCount, setDisplayedCount] = useState<number>(5);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingTag, setEditingTag] = useState<TagDto | null>(null);
  const [tagName, setTagName] = useState<string>('');
  const [tagDesc, setTagDesc] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);

  // Confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  /* -------------------------- data fetch ------------------------------ */
  const fetchTags = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await tagService.getTags({ page: 0, size: 100 });
      setTags(response.content);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tags.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* --------------------------- form logic ----------------------------- */
  const openCreateForm = () => {
    setEditingTag(null);
    setTagName('');
    setTagDesc('');
    setFormError(null);
    setShowForm(true);
  };

  const openEditForm = (tag: TagDto) => {
    setEditingTag(tag);
    setTagName(tag.name);
    setTagDesc(tag.description || '');
    setFormError(null);
    setShowForm(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSubmitting(true);

    if (tagName.trim().length < 3 || tagName.trim().length > 50) {
      setFormError('Name must be between 3 and 50 characters.');
      setFormSubmitting(false);
      return;
    }

    try {
      if (editingTag) {
        await tagService.updateTag(editingTag.id, {
          name: tagName.trim(),
          description: tagDesc.trim(),
        });
      } else {
        await tagService.createTag({ name: tagName.trim(), description: tagDesc.trim() });
      }
      setShowForm(false);
      await fetchTags();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save tag.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (tagId: string) => {
    setTagToDelete(tagId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!tagToDelete) return;
    
    setIsDeleting(true);
    try {
      await tagService.deleteTag(tagToDelete);
      await fetchTags();
    } catch (err: any) {
      setError(err.message || 'Failed to delete tag.');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setTagToDelete(null);
    }
  };

  /* ------------------------------ JSX -------------------------------- */
  return (
    <PageContainer
      title="Manage Tags"
      subtitle="Create, edit, and organize quiz tags"
      showBreadcrumb={true}
      actions={[
        {
          label: 'Create Tag',
          type: 'create',
          variant: 'primary',
          onClick: openCreateForm
        }
      ]}
      containerClassName="max-w-4xl"
    >
      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="bg-theme-bg-danger border border-theme-border-danger rounded-md p-4">
          <p className="text-theme-interactive-danger">{error}</p>
        </div>
      ) : tags.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-theme-text-tertiary">No tags found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Header with count */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-theme-text-primary">Tags</h3>
            <span className="text-sm text-theme-text-tertiary">
              {tags.length > displayedCount 
                ? `Showing ${displayedCount} of ${tags.length} tags`
                : `${tags.length} tag${tags.length !== 1 ? 's' : ''} available`
              }
            </span>
          </div>

          {/* Tags list */}
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
                {tags.slice(0, displayedCount).map((tag) => (
                  <tr key={tag.id} className="hover:bg-theme-bg-secondary">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-theme-text-primary">{tag.name}</td>
                    <td className="px-6 py-4 text-sm text-theme-text-tertiary">{tag.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => openEditForm(tag)}
                        className="text-theme-interactive-primary hover:text-indigo-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(tag.id)}
                        className="text-theme-interactive-danger hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Show More Button */}
          {tags.length > displayedCount && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => setDisplayedCount(prev => Math.min(prev + 5, tags.length))}
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
            <h3 className="text-xl font-semibold mb-4">
              {editingTag ? 'Edit Tag' : 'New Tag'}
            </h3>
            {formError && <div className="text-theme-interactive-danger mb-2">{formError}</div>}
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label htmlFor="tagName" className="block text-sm font-medium text-theme-text-secondary mb-1">
                  Name <span className="text-theme-interactive-danger">*</span>
                </label>
                <input
                  id="tagName"
                  type="text"
                  required
                  minLength={3}
                  maxLength={50}
                  className="w-full border border-theme-border-primary px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:border-theme-interactive-primary"
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="tagDesc" className="block text-sm font-medium text-theme-text-secondary mb-1">
                  Description
                </label>
                <textarea
                  id="tagDesc"
                  className="w-full border border-theme-border-primary px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:border-theme-interactive-primary"
                  rows={3}
                  maxLength={1000}
                  value={tagDesc}
                  onChange={(e) => setTagDesc(e.target.value)}
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
                  {formSubmitting ? 'Saving...' : editingTag ? 'Save' : 'Create'}
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
          setTagToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Tag"
        message="Are you sure you want to delete this tag? This action cannot be undone."
        confirmText="Delete Tag"
        variant="danger"
        isLoading={isDeleting}
      />
    </PageContainer>
  );
};

export default TagManagementPage;