import React, { useEffect, useState } from 'react';
import Spinner from '../components/Spinner';
import { PageTagDto, TagDto } from '../types/api';
import {
  getAllTags,
  createTag,
  updateTag,
  deleteTag,
} from '../api/tag.service';

const TagManagementPage: React.FC = () => {
  /* ---------------------------- state --------------------------------- */
  const [tags, setTags] = useState<TagDto[]>([]);
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
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
      const data: PageTagDto = await getAllTags({ page, size: 20 });
      setTags(data.content);
      setTotalPages(data.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch tags.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

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
        await updateTag(editingTag.id, {
          name: tagName.trim(),
          description: tagDesc.trim(),
        });
      } else {
        await createTag({ name: tagName.trim(), description: tagDesc.trim() });
      }
      setShowForm(false);
      await fetchTags();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to save tag.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (tagId: string) => {
    if (!window.confirm('Are you sure you want to delete this tag?')) return;
    try {
      await deleteTag(tagId);
      await fetchTags();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete tag.');
    }
  };

  /* ------------------------------ JSX -------------------------------- */
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Manage Tags</h2>
        <button
          onClick={openCreateForm}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          + New Tag
        </button>
      </div>

      {/* main table or states */}
      {loading ? (
        <Spinner />
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : tags.length === 0 ? (
        <p>No tags found.</p>
      ) : (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Description</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tags.map((tag) => (
              <tr key={tag.id}>
                <td className="border px-2 py-1">{tag.name}</td>
                <td className="border px-2 py-1">{tag.description}</td>
                <td className="border px-2 py-1 text-center space-x-2">
                  <button
                    onClick={() => openEditForm(tag)}
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(tag.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* pagination */}
      <div className="flex justify-center items-center mt-4 space-x-4">
        <button
          onClick={() => setPage((p) => Math.max(p - 1, 0))}
          disabled={page === 0}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Prev
        </button>
        <span>
          Page {page + 1} of {totalPages}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
          disabled={page + 1 === totalPages}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* modal form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center p-4">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">
              {editingTag ? 'Edit Tag' : 'New Tag'}
            </h3>
            {formError && <div className="text-red-500 mb-2">{formError}</div>}
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label htmlFor="tagName" className="block mb-1">
                  Name <span className="text-red-600">*</span>
                </label>
                <input
                  id="tagName"
                  type="text"
                  required
                  minLength={3}
                  maxLength={50}
                  className="w-full border px-3 py-2 rounded"
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="tagDesc" className="block mb-1">
                  Description
                </label>
                <textarea
                  id="tagDesc"
                  className="w-full border px-3 py-2 rounded"
                  rows={2}
                  maxLength={1000}
                  value={tagDesc}
                  onChange={(e) => setTagDesc(e.target.value)}
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded"
                  disabled={formSubmitting}
                >
                  {formSubmitting ? 'Saving...' : editingTag ? 'Save' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TagManagementPage;