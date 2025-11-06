'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Document, DocumentCategory } from '@/types/database';
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  FolderIcon,
  CloudArrowUpIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  TrashIcon,
  ShareIcon,
  ClockIcon,
  TagIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

type ViewMode = 'grid' | 'list';
type FilterType = 'all' | 'recent' | 'shared' | 'archived';

export default function DocumentsPage() {
  const supabase = createClientComponentClient();
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    recent: 0,
  });

  useEffect(() => {
    if (profile?.organization_id) {
      fetchCategories();
      fetchDocuments();
      fetchStats();
    }
  }, [profile?.organization_id, selectedCategory, filterType]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('document_categories')
        .select('*')
        .eq('organization_id', profile?.organization_id)
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      showToast('Failed to load categories', 'error');
    }
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('documents')
        .select('*')
        .eq('organization_id', profile?.organization_id)
        .eq('is_active', true);

      // Apply category filter
      if (selectedCategory !== 'all') {
        query = query.eq('category_id', selectedCategory);
      }

      // Apply type filter
      if (filterType === 'recent') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        query = query.gte('created_at', sevenDaysAgo.toISOString());
      } else if (filterType === 'shared') {
        // Documents that have been shared
        const { data: sharedDocs } = await supabase
          .from('document_shares')
          .select('document_id')
          .eq('organization_id', profile?.organization_id)
          .eq('is_active', true);
        
        if (sharedDocs && sharedDocs.length > 0) {
          const sharedDocIds = sharedDocs.map(s => s.document_id);
          query = query.in('id', sharedDocIds);
        }
      } else if (filterType === 'archived') {
        query = query.not('archived_at', 'is', null);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      showToast('Failed to load documents', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('status, created_at')
        .eq('organization_id', profile?.organization_id)
        .eq('is_active', true);

      if (error) throw error;

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      setStats({
        total: data?.length || 0,
        pending: data?.filter(d => d.status === 'pending_approval').length || 0,
        approved: data?.filter(d => d.status === 'approved').length || 0,
        recent: data?.filter(d => new Date(d.created_at) >= sevenDaysAgo).length || 0,
      });
    } catch (error: any) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from(doc.storage_bucket)
        .download(doc.storage_path);

      if (error) throw error;

      // Create download link
      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Update download count
      await supabase
        .from('documents')
        .update({ download_count: doc.download_count + 1 })
        .eq('id', doc.id);

      showToast('Document downloaded successfully', 'success');
    } catch (error: any) {
      console.error('Error downloading document:', error);
      showToast('Failed to download document', 'error');
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const { error } = await supabase
        .from('documents')
        .update({ 
          is_active: false,
          deleted_at: new Date().toISOString()
        })
        .eq('id', docId);

      if (error) throw error;

      showToast('Document deleted successfully', 'success');
      fetchDocuments();
      fetchStats();
    } catch (error: any) {
      console.error('Error deleting document:', error);
      showToast('Failed to delete document', 'error');
    }
  };

  const filteredDocuments = documents.filter(doc => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      doc.title.toLowerCase().includes(query) ||
      doc.document_number.toLowerCase().includes(query) ||
      doc.file_name.toLowerCase().includes(query) ||
      doc.tags.some(tag => tag.toLowerCase().includes(query))
    );
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending_approval':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    return '📁';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="backdrop-blur-xl bg-white/70 rounded-2xl border border-teal-100 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Document Management
              </h1>
              <p className="text-gray-600 mt-1">Secure document storage with UAE PDPL compliance</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/documents/upload"
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg hover:shadow-lg transition-all"
              >
                <CloudArrowUpIcon className="h-5 w-5" />
                Upload Document
              </Link>
              <Link
                href="/dashboard/documents/categories"
                className="flex items-center gap-2 px-4 py-2 border border-teal-200 text-teal-700 rounded-lg hover:bg-teal-50 transition-all"
              >
                <FolderIcon className="h-5 w-5" />
                Categories
              </Link>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Documents</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
                </div>
                <DocumentTextIcon className="h-10 w-10 text-blue-600/30" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 font-medium">Pending Approval</p>
                  <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
                </div>
                <ClockIcon className="h-10 w-10 text-yellow-600/30" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Approved</p>
                  <p className="text-2xl font-bold text-green-900">{stats.approved}</p>
                </div>
                <CheckCircleIcon className="h-10 w-10 text-green-600/30" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Recent (7 days)</p>
                  <p className="text-2xl font-bold text-purple-900">{stats.recent}</p>
                </div>
                <ClockIcon className="h-10 w-10 text-purple-600/30" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="backdrop-blur-xl bg-white/70 rounded-2xl border border-teal-100 p-6 shadow-lg">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title, document number, filename, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-all ${
                  showFilters ? 'bg-teal-50 border-teal-300' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <FunnelIcon className="h-5 w-5" />
                Filters
              </button>
              <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-teal-50 text-teal-700' : 'hover:bg-gray-50'}`}
                >
                  <Squares2X2Icon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-teal-50 text-teal-700' : 'hover:bg-gray-50'}`}
                >
                  <ListBulletIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.category_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter</label>
                <div className="flex gap-2">
                  {(['all', 'recent', 'shared', 'archived'] as FilterType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={`px-4 py-2 rounded-lg capitalize transition-all ${
                        filterType === type
                          ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white'
                          : 'border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Documents Grid/List */}
        {filteredDocuments.length === 0 ? (
          <div className="backdrop-blur-xl bg-white/70 rounded-2xl border border-teal-100 p-12 shadow-lg text-center">
            <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No documents found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? 'Try adjusting your search or filters'
                : 'Start by uploading your first document'}
            </p>
            <Link
              href="/dashboard/documents/upload"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg hover:shadow-lg transition-all"
            >
              <PlusIcon className="h-5 w-5" />
              Upload Document
            </Link>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="backdrop-blur-xl bg-white/70 rounded-xl border border-teal-100 p-4 shadow-lg hover:shadow-xl transition-all"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="text-4xl">{getFileIcon(doc.file_type)}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate" title={doc.title}>
                      {doc.title}
                    </h3>
                    <p className="text-sm text-gray-600">{doc.document_number}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(doc.status)}`}>
                    {doc.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Type:</span>
                    <span className="capitalize">{doc.document_type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Size:</span>
                    <span>{formatFileSize(doc.file_size)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Uploaded:</span>
                    <span>{formatDate(doc.created_at)}</span>
                  </div>
                  {doc.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {doc.tags.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="px-2 py-1 bg-teal-50 text-teal-700 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                      {doc.tags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-50 text-gray-600 rounded text-xs">
                          +{doc.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => handleDownload(doc)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-teal-200 text-teal-700 rounded-lg hover:bg-teal-50 transition-all"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                    Download
                  </button>
                  <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <ShareIcon className="h-4 w-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-2 border border-red-200 rounded-lg hover:bg-red-50"
                  >
                    <TrashIcon className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="backdrop-blur-xl bg-white/70 rounded-2xl border border-teal-100 shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-teal-50/50 border-b border-teal-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-teal-700 uppercase tracking-wider">
                    Document
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-teal-700 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-teal-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-teal-700 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-teal-700 uppercase tracking-wider">
                    Uploaded
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-teal-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-teal-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getFileIcon(doc.file_type)}</span>
                        <div>
                          <div className="font-medium text-gray-900">{doc.title}</div>
                          <div className="text-sm text-gray-600">{doc.document_number}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                      {doc.document_type.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(doc.status)}`}>
                        {doc.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatFileSize(doc.file_size)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(doc.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDownload(doc)}
                          className="p-2 border border-teal-200 rounded-lg hover:bg-teal-50 transition-all"
                          title="Download"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4 text-teal-700" />
                        </button>
                        <button
                          className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
                          title="Share"
                        >
                          <ShareIcon className="h-4 w-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-2 border border-red-200 rounded-lg hover:bg-red-50 transition-all"
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
