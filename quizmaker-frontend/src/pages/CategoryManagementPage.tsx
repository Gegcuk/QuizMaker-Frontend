import React, { useEffect, useState } from 'react';
import Spinner from '../components/Spinner';
import { CategoryDto } from '../types/api';
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../api/category.service';

const CategoryManagementPage: React.FC = () => {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

const [showForm, setShowForm] = useState<boolean>(false);
  const [editing, setEditing] = useState<CategoryDto | null>(null);
  const [name, setName] = useState<string>('');
  const [desc, setDesc] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getAllCategories({ page, size: 20 });
      setCategories(data.content);
      setTotalPages(data.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

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
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await deleteCategory(id);
      await fetchCategories();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete category.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Manage Categories</h2>
        <button onClick={openCreate} className="px-4 py-2 bg-green-600 text-white rounded">
          + New Category
        </button>
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : categories.length === 0 ? (
        <p>No categories found.</p>
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
            {categories.map((cat) => (
              <tr key={cat.id}>
                <td className="border px-2 py-1">{cat.name}</td>
                <td className="border px-2 py-1">{cat.description}</td>
                <td className="border px-2 py-1 text-center space-x-2">
                  <button onClick={() => openEdit(cat)} className="text-blue-600 hover:underline">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(cat.id)} className="text-red-600 hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

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

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center p-4">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">{editing ? 'Edit Category' : 'New Category'}</h3>
            {formError && <div className="text-red-500 mb-2">{formError}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="catName" className="block mb-1">
                  Name <span className="text-red-600">*</span>
                </label>
                <input
                  id="catName"
                  type="text"
                  required
                  minLength={3}
                  maxLength={100}
                  className="w-full border px-3 py-2 rounded"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="catDesc" className="block mb-1">
                  Description
                </label>
                <textarea
                  id="catDesc"
                  className="w-full border px-3 py-2 rounded"
                  rows={2}
                  maxLength={1000}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded" disabled={formSubmitting}>
                  {formSubmitting ? 'Saving...' : editing ? 'Save' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagementPage;