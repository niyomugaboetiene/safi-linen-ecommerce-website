'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  FolderOpen,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { categoryAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [deletingCategory, setDeletingCategory] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    active: true,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await categoryAPI.getCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (category?: any) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        active: category.active,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        active: true,
      });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    setSaving(true);
    try {
      if (editingCategory) {
        await categoryAPI.updateCategory(editingCategory._id, formData);
        toast.success('Category updated successfully');
      } else {
        await categoryAPI.createCategory(formData);
        toast.success('Category created successfully');
      }
      setShowModal(false);
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;

    setSaving(true);
    try {
      await categoryAPI.deleteCategory(deletingCategory._id);
      toast.success('Category deleted successfully');
      setDeletingCategory(null);
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete category');
    } finally {
      setSaving(false);
    }
  };

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900">
            Categories
          </h1>
          <p className="text-neutral-600 mt-1">
            Manage your product categories
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search categories..."
          className="w-full pl-9 pr-3 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
        />
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((category) => (
            <div
              key={category._id}
              className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <FolderOpen className="h-6 w-6 text-primary-600" />
                </div>
                <Badge variant={category.active ? 'success' : 'danger'}>
                  {category.active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <h3 className="font-semibold text-neutral-900 mb-1">
                {category.name}
              </h3>
              <p className="text-sm text-neutral-500 line-clamp-2 mb-4">
                {category.description || 'No description'}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400">
                  {formatDate(category.createdAt)}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenModal(category)}
                    className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                    aria-label="Edit category"
                  >
                    <Edit className="h-4 w-4 text-neutral-400" />
                  </button>
                  <button
                    onClick={() => setDeletingCategory(category)}
                    className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                    aria-label="Delete category"
                  >
                    <Trash2 className="h-4 w-4 text-neutral-400 hover:text-red-600 transition-colors" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredCategories.length === 0 && (
        <div className="py-12 text-center">
          <FolderOpen className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-500">No categories found</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingCategory ? 'Edit Category' : 'Add Category'}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Category Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Electronics"
            required
          />
          <div>
            <label className="text-sm font-medium text-neutral-700 mb-1.5 block">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 transition-colors duration-200 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              placeholder="Optional description"
            />
          </div>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-neutral-700">Active</span>
          </label>
          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              loading={saving}
              fullWidth
            >
              {editingCategory ? 'Update Category' : 'Create Category'}
            </Button>
            <Button
              onClick={() => setShowModal(false)}
              variant="outline"
              fullWidth
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        title="Delete Category"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-neutral-900">
              {deletingCategory?.name}
            </span>
            ? Products in this category will not be deleted.
          </p>
          <div className="flex gap-3">
            <Button
              onClick={handleDelete}
              loading={saving}
              variant="danger"
              fullWidth
            >
              Delete Category
            </Button>
            <Button
              onClick={() => setDeletingCategory(null)}
              variant="outline"
              fullWidth
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}