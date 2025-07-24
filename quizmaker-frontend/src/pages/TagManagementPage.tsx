import React, { useEffect, useState } from 'react';
import { Spinner } from '../components/ui';
import { PageContainer } from '../components/layout';
import { TagDto } from '../types/tag.types';
import { TagService } from '../api/tag.service';
import api from '../api/axiosInstance';

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
    if (!window.confirm('Are you sure you want to delete this tag?')) return;
    try {
      await tagService.deleteTag(tagId);
      await fetchTags();
    } catch (err: any) {
      setError(err.message || 'Failed to delete tag.');
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
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      ) : tags.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No tags found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Header with count */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Tags</h3>
            <span className="text-sm text-gray-500">
              {tags.length > displayedCount 
                ? `Showing ${displayedCount} of ${tags.length} tags`
                : `${tags.length} tag${tags.length !== 1 ? 's' : ''} available`
              }
            </span>
          </div>

          {/* Tags list */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tags.slice(0, displayedCount).map((tag) => (
                  <tr key={tag.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tag.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{tag.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => openEditForm(tag)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(tag.id)}
                        className="text-red-600 hover:text-red-900"
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
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-600 bg-white border border-indigo-300 rounded-md hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
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
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">
              {editingTag ? 'Edit Tag' : 'New Tag'}
            </h3>
            {formError && <div className="text-red-500 mb-2">{formError}</div>}
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label htmlFor="tagName" className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-600">*</span>
                </label>
                <input
                  id="tagName"
                  type="text"
                  required
                  minLength={3}
                  maxLength={50}
                  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="tagDesc" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="tagDesc"
                  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  disabled={formSubmitting}
                >
                  {formSubmitting ? 'Saving...' : editingTag ? 'Save' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default TagManagementPage;