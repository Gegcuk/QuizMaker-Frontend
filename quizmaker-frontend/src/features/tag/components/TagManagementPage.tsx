import { useTagPage } from '@/features/quiz/hooks/useQuizMetadataQueries';
import { useTagMutations } from '@/features/quiz/hooks/useTaxonomyMutations';
import { getErrorMessage } from '@/utils/errorUtils';
import React, { useState } from 'react';
import { Spinner, PageContainer, ConfirmationModal, Button, Input, Alert, Textarea } from '@/components';
import { Seo } from '@/features/seo';
import { TagDto } from '@/types';

const TagManagementPage: React.FC = () => {

  
  /* ---------------------------- state --------------------------------- */
  const taxonomyQuery = useTagPage({ page: 0, size: 100 });
  const tags = taxonomyQuery.data?.content ?? [];
  const loading = taxonomyQuery.isLoading;
  const writes = useTagMutations();
  const [displayedCount, setDisplayedCount] = useState<number>(5);
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
  const openCreateForm = () => {
    setEditingTag(null);
    setTagName('');
    setTagDesc('');
    setFormError(null);
    writes.create.reset();
    setShowForm(true);
  };

  const openEditForm = (tag: TagDto) => {
    setEditingTag(tag);
    setTagName(tag.name);
    setTagDesc(tag.description || '');
    setFormError(null);
    writes.create.reset();
    setShowForm(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formSubmitting) return;
    setFormError(null);
    setFormSubmitting(true);

    if (tagName.trim().length < 3 || tagName.trim().length > 50) {
      setFormError('Name must be between 3 and 50 characters.');
      setFormSubmitting(false);
      return;
    }

    try {
      if (editingTag) {
        await writes.update.mutateAsync({ id: editingTag.id, data: {
          name: tagName.trim(),
          description: tagDesc.trim(),
        } });
      } else {
        await writes.create.mutateAsync({ name: tagName.trim(), description: tagDesc.trim() });
      }
      setShowForm(false);
    } catch (err: unknown) {
      setFormError(getErrorMessage(err) || 'Failed to save tag.');
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
      await writes.remove.mutateAsync(tagToDelete);
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Failed to delete tag.');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setTagToDelete(null);
    }
  };

  /* ------------------------------ JSX -------------------------------- */
  const displayedError = error ?? taxonomyQuery.error?.message;

  return (
    <>
      <Seo title="Manage Tags | Quizzence" noindex />
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
      ) : displayedError ? (
        <Alert type="error">
          {displayedError}
        </Alert>
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
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditForm(tag)}
                        title="Edit tag"
                        aria-label="Edit tag"
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(tag.id)}
                        title="Delete tag"
                        aria-label="Delete tag"
                        className="text-theme-interactive-danger hover:text-theme-interactive-danger"
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Show More Button */}
          {tags.length > displayedCount && (
            <div className="flex justify-center pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDisplayedCount(prev => Math.min(prev + 5, tags.length))}
                leftIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                }
              >
                Show 5 More
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-theme-bg-overlay bg-opacity-40 flex justify-center items-center p-4 z-50">
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
                <Input
                  id="tagName"
                  name="tagName"
                  type="text"
                  required
                  fullWidth
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  placeholder="Enter tag name"
                />
              </div>
              <div>
                <Textarea
                  id="tagDesc"
                  label="Description"
                  rows={3}
                  maxLength={1000}
                  value={tagDesc}
                  onChange={(e) => setTagDesc(e.target.value)}
                  fullWidth
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={formSubmitting}
                  loading={formSubmitting}
                >
                  {formSubmitting ? 'Saving...' : editingTag ? 'Save' : 'Create'}
                </Button>
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
    </>
  );
};

export default TagManagementPage;