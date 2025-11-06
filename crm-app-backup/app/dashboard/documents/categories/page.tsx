'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { DocumentCategory } from '@/types/database';
import {
  FolderIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  FolderPlusIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

export default function CategoriesPage() {
  const supabase = createClientComponentClient();
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<DocumentCategory | null>(null);
  const [formData, setFormData] = useState({
    category_code: '',
    category_name: '',
    parent_category_id: '',
    description: '',
    icon: 'FolderIcon',
    color: '#3B82F6',
    sort_order: 0,
    retention_period_years: 7,
  });

  const iconOptions = [
    'FolderIcon', 'DocumentTextIcon', 'UserGroupIcon', 'ShoppingBagIcon',
    'UsersIcon', 'CurrencyDollarIcon', 'ScaleIcon', 'SwatchIcon',
    'TruckIcon', 'CheckBadgeIcon', 'AcademicCapIcon',
  ];

  const colorOptions = [
    { value: '#3B82F6', label: 'Blue' },
    { value: '#10B981', label: 'Green' },
    { value: '#8B5CF6', label: 'Purple' },
    { value: '#F59E0B', label: 'Amber' },
    { value: '#EF4444', label: 'Red' },
    { value: '#EC4899', label: 'Pink' },
    { value: '#14B8A6', label: 'Teal' },
    { value: '#6366F1', label: 'Indigo' },
    { value: '#06B6D4', label: 'Cyan' },
    { value: '#6B7280', label: 'Gray' },
  ];

  useEffect(() => {
    if (profile?.organization_id) {
      fetchCategories();
    }
  }, [profile?.organization_id]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('document_categories')
        .select('*')
        .eq('organization_id', profile?.organization_id)
        .order('sort_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      showToast('Failed to load categories', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      category_code: '',
      category_name: '',
      parent_category_id: '',
      description: '',
      icon: 'FolderIcon',
      color: '#3B82F6',
      sort_order: 0,
      retention_period_years: 7,
    });
    setEditingCategory(null);
    setShowForm(false);
  };

  const handleEdit = (category: DocumentCategory) => {
    setEditingCategory(category);
    setFormData({
      category_code: category.category_code,
      category_name: category.category_name,
      parent_category_id: category.parent_category_id || '',
      description: category.description || '',
      icon: category.icon || 'FolderIcon',
      color: category.color || '#3B82F6',
      sort_order: category.sort_order,
      retention_period_years: category.retention_period_years,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.category_code || !formData.category_name) {
      showToast('Please fill in required fields', 'error');
      return;
    }

    try {
      const categoryData = {
        organization_id: profile?.organization_id,
        category_code: formData.category_code.toUpperCase(),
        category_name: formData.category_name,
        parent_category_id: formData.parent_category_id || null,
        description: formData.description || null,
        icon: formData.icon,
        color: formData.color,
        sort_order: formData.sort_order,
        retention_period_years: formData.retention_period_years,
        created_by: editingCategory ? undefined : user?.id,
      };

      if (editingCategory) {
        const { error } = await supabase
          .from('document_categories')
          .update(categoryData)
          .eq('id', editingCategory.id);

        if (error) throw error;
        showToast('Category updated successfully', 'success');
      } else {
        const { error } = await supabase
          .from('document_categories')
          .insert(categoryData);

        if (error) throw error;
        showToast('Category created successfully', 'success');
      }

      resetForm();
      fetchCategories();
    } catch (error: any) {
      console.error('Error saving category:', error);
      showToast(error.message || 'Failed to save category', 'error');
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }

    try {
      // Check if category has documents
      const { data: docs, error: checkError } = await supabase
        .from('documents')
        .select('id')
        .eq('category_id', categoryId)
        .limit(1);

      if (checkError) throw checkError;

      if (docs && docs.length > 0) {
        showToast('Cannot delete category with associated documents', 'error');
        return;
      }

      // Check if category has subcategories
      const { data: subcats, error: subcatError } = await supabase
        .from('document_categories')
        .select('id')
        .eq('parent_category_id', categoryId)
        .limit(1);

      if (subcatError) throw subcatError;

      if (subcats && subcats.length > 0) {
        showToast('Cannot delete category with subcategories', 'error');
        return;
      }

      const { error } = await supabase
        .from('document_categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      showToast('Category deleted successfully', 'success');
      fetchCategories();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      showToast('Failed to delete category', 'error');
    }
  };

  const toggleActive = async (category: DocumentCategory) => {
    try {
      const { error } = await supabase
        .from('document_categories')
        .update({ is_active: !category.is_active })
        .eq('id', category.id);

      if (error) throw error;

      showToast(`Category ${!category.is_active ? 'activated' : 'deactivated'} successfully`, 'success');
      fetchCategories();
    } catch (error: any) {
      console.error('Error toggling category:', error);
      showToast('Failed to update category status', 'error');
    }
  };

  const getParentCategoryName = (parentId: string | null) => {
    if (!parentId) return 'Root';
    const parent = categories.find(c => c.id === parentId);
    return parent?.category_name || 'Unknown';
  };

  const organizeCategories = () => {
    const roots = categories.filter(c => !c.parent_category_id);
    const organized: { category: DocumentCategory; children: DocumentCategory[] }[] = [];

    roots.forEach(root => {
      const children = categories.filter(c => c.parent_category_id === root.id);
      organized.push({ category: root, children });
    });

    return organized;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  const organizedCategories = organizeCategories();

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="backdrop-blur-xl bg-white/70 rounded-2xl border border-teal-100 p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Document Categories
              </h1>
              <p className="text-gray-600 mt-1">Organize documents with hierarchical categories</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg hover:shadow-lg transition-all"
            >
              <PlusIcon className="h-5 w-5" />
              New Category
            </button>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="backdrop-blur-xl bg-white/70 rounded-2xl border border-teal-100 p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingCategory ? 'Edit Category' : 'Create New Category'}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.category_code}
                  onChange={(e) => setFormData({ ...formData, category_code: e.target.value })}
                  placeholder="e.g., CUST_CONTRACTS"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.category_name}
                  onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                  placeholder="e.g., Customer Contracts"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parent Category
                </label>
                <select
                  value={formData.parent_category_id}
                  onChange={(e) => setFormData({ ...formData, parent_category_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">None (Root Category)</option>
                  {categories.filter(c => !c.parent_category_id && c.id !== editingCategory?.id).map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.category_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icon
                </label>
                <select
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {iconOptions.map((icon) => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="flex gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        formData.color === color.value ? 'border-gray-900 scale-110' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Retention Period (Years)
                </label>
                <input
                  type="number"
                  value={formData.retention_period_years}
                  onChange={(e) => setFormData({ ...formData, retention_period_years: parseInt(e.target.value) })}
                  min="1"
                  max="50"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Category description..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="md:col-span-2 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Categories List */}
        <div className="space-y-4">
          {organizedCategories.map(({ category, children }) => (
            <div key={category.id} className="backdrop-blur-xl bg-white/70 rounded-2xl border border-teal-100 shadow-lg overflow-hidden">
              {/* Parent Category */}
              <div className="p-6 border-b border-teal-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <FolderIcon className="h-6 w-6" style={{ color: category.color }} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{category.category_name}</h3>
                      <p className="text-sm text-gray-600">{category.category_code}</p>
                      {category.description && (
                        <p className="text-sm text-gray-500 mt-1">{category.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 mr-2">
                      {category.retention_period_years} years retention
                    </span>
                    <button
                      onClick={() => toggleActive(category)}
                      className={`px-3 py-1 text-sm rounded-lg transition-all ${
                        category.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {category.is_active ? 'Active' : 'Inactive'}
                    </button>
                    {!category.is_system_category && (
                      <>
                        <button
                          onClick={() => handleEdit(category)}
                          className="p-2 border border-teal-200 rounded-lg hover:bg-teal-50 transition-all"
                        >
                          <PencilIcon className="h-4 w-4 text-teal-700" />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="p-2 border border-red-200 rounded-lg hover:bg-red-50 transition-all"
                        >
                          <TrashIcon className="h-4 w-4 text-red-600" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Subcategories */}
              {children.length > 0 && (
                <div className="p-6 bg-gray-50/50 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <ChevronRightIcon className="h-4 w-4" />
                    <span className="font-medium">Subcategories ({children.length})</span>
                  </div>
                  {children.map((child) => (
                    <div
                      key={child.id}
                      className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${child.color}20` }}
                        >
                          <FolderIcon className="h-5 w-5" style={{ color: child.color }} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{child.category_name}</p>
                          <p className="text-xs text-gray-600">{child.category_code}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded ${
                          child.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {child.is_active ? 'Active' : 'Inactive'}
                        </span>
                        {!child.is_system_category && (
                          <>
                            <button
                              onClick={() => handleEdit(child)}
                              className="p-2 border border-teal-200 rounded hover:bg-teal-50 transition-all"
                            >
                              <PencilIcon className="h-4 w-4 text-teal-700" />
                            </button>
                            <button
                              onClick={() => handleDelete(child.id)}
                              className="p-2 border border-red-200 rounded hover:bg-red-50 transition-all"
                            >
                              <TrashIcon className="h-4 w-4 text-red-600" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="backdrop-blur-xl bg-white/70 rounded-2xl border border-teal-100 p-12 shadow-lg text-center">
            <FolderPlusIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No categories found</h3>
            <p className="text-gray-600 mb-6">Create your first document category to get started</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg hover:shadow-lg transition-all"
            >
              <PlusIcon className="h-5 w-5" />
              Create Category
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
