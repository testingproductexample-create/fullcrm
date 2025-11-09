import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  Users, 
  Globe, 
  Lock,
  Settings,
  Link,
  Mail,
  MessageSquare,
  Facebook,
  Twitter
} from 'lucide-react';
import { Dashboard } from '../../types';
import { cn } from '../../utils/helpers';

interface ShareModalProps {
  dashboard: Dashboard;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  dashboard,
  onClose
}) => {
  const [isPublic, setIsPublic] = useState(dashboard.isPublic);
  const [shareLink, setShareLink] = useState(`${window.location.origin}/dashboard/${dashboard.id}`);
  const [copied, setCopied] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [shareMethod, setShareMethod] = useState<'link' | 'email' | 'social'>('link');

  // Mock users for demonstration
  const availableUsers = [
    { id: 'user1', name: 'John Doe', email: 'john@company.com', avatar: 'JD' },
    { id: 'user2', name: 'Jane Smith', email: 'jane@company.com', avatar: 'JS' },
    { id: 'user3', name: 'Bob Wilson', email: 'bob@company.com', avatar: 'BW' },
    { id: 'user4', name: 'Alice Brown', email: 'alice@company.com', avatar: 'AB' },
  ];

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleShareViaEmail = () => {
    const subject = `Dashboard: ${dashboard.name}`;
    const body = `Check out this dashboard: ${dashboard.name}\n\n${dashboard.description || ''}\n\nView it here: ${shareLink}`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const handleSocialShare = (platform: string) => {
    const text = `Check out this dashboard: ${dashboard.name}`;
    const url = encodeURIComponent(shareLink);
    
    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`);
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${url}`);
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`);
        break;
    }
  };

  const handleTogglePublic = () => {
    setIsPublic(!isPublic);
    // In a real app, this would update the dashboard via API
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl w-full max-w-2xl"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Share2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Share Dashboard</h2>
                <p className="text-gray-600">Control who can access this dashboard</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Public/Private Toggle */}
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                {isPublic ? (
                  <Globe className="w-5 h-5 text-green-500" />
                ) : (
                  <Lock className="w-5 h-5 text-gray-500" />
                )}
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {isPublic ? 'Public Dashboard' : 'Private Dashboard'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {isPublic 
                      ? 'Anyone with the link can view this dashboard'
                      : 'Only you and selected users can access this dashboard'
                    }
                  </p>
                </div>
              </div>
              <button
                onClick={handleTogglePublic}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  isPublic ? "bg-blue-600" : "bg-gray-300"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    isPublic ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </div>
          </div>

          {/* Share Methods */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Share Method
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setShareMethod('link')}
                className={cn(
                  "p-4 border-2 rounded-xl transition-all text-left",
                  shareMethod === 'link'
                    ? "border-blue-500 bg-blue-50/20"
                    : "border-gray-200 hover:border-gray-300 bg-white/5"
                )}
              >
                <Link className="w-6 h-6 text-blue-500 mb-2" />
                <div className="font-medium text-gray-800">Link</div>
                <div className="text-sm text-gray-600">Share via URL</div>
              </button>
              
              <button
                onClick={() => setShareMethod('email')}
                className={cn(
                  "p-4 border-2 rounded-xl transition-all text-left",
                  shareMethod === 'email'
                    ? "border-blue-500 bg-blue-50/20"
                    : "border-gray-200 hover:border-gray-300 bg-white/5"
                )}
              >
                <Mail className="w-6 h-6 text-green-500 mb-2" />
                <div className="font-medium text-gray-800">Email</div>
                <div className="text-sm text-gray-600">Send via email</div>
              </button>
              
              <button
                onClick={() => setShareMethod('social')}
                className={cn(
                  "p-4 border-2 rounded-xl transition-all text-left",
                  shareMethod === 'social'
                    ? "border-blue-500 bg-blue-50/20"
                    : "border-gray-200 hover:border-gray-300 bg-white/5"
                )}
              >
                <MessageSquare className="w-6 h-6 text-purple-500 mb-2" />
                <div className="font-medium text-gray-800">Social</div>
                <div className="text-sm text-gray-600">Share on social</div>
              </button>
            </div>
          </div>

          {/* Link Sharing */}
          {shareMethod === 'link' && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Share Link
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white/50 text-sm"
                />
                <button
                  onClick={handleCopyLink}
                  className={cn(
                    "px-4 py-2 rounded-lg transition-colors flex items-center space-x-2",
                    copied
                      ? "bg-green-100 text-green-700"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  )}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Anyone with this link can {isPublic ? 'view' : 'request access to'} this dashboard
              </p>
            </div>
          )}

          {/* Email Sharing */}
          {shareMethod === 'email' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Users
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {availableUsers.map(user => (
                    <label key={user.id} className="flex items-center space-x-3 p-2 hover:bg-white/5 rounded">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers(prev => [...prev, user.id]);
                          } else {
                            setSelectedUsers(prev => prev.filter(id => id !== user.id));
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
                        {user.avatar}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-800">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              
              <button
                onClick={handleShareViaEmail}
                disabled={selectedUsers.length === 0}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Mail className="w-4 h-4" />
                <span>Share via Email</span>
              </button>
            </div>
          )}

          {/* Social Sharing */}
          {shareMethod === 'social' && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Share on Social Media
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleSocialShare('facebook')}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors flex flex-col items-center space-y-2"
                >
                  <Facebook className="w-6 h-6 text-blue-600" />
                  <span className="text-sm text-gray-700">Facebook</span>
                </button>
                
                <button
                  onClick={() => handleSocialShare('twitter')}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors flex flex-col items-center space-y-2"
                >
                  <Twitter className="w-6 h-6 text-blue-400" />
                  <span className="text-sm text-gray-700">Twitter</span>
                </button>
                
                <button
                  onClick={() => handleSocialShare('linkedin')}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors flex flex-col items-center space-y-2"
                >
                  <Users className="w-6 h-6 text-blue-700" />
                  <span className="text-sm text-gray-700">LinkedIn</span>
                </button>
              </div>
            </div>
          )}

          {/* Permissions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Settings className="w-4 h-4 inline mr-1" />
              Permissions
            </label>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-gray-800">View Only</div>
                  <div className="text-xs text-gray-500">Users can view the dashboard</div>
                </div>
                <div className="w-4 h-4 bg-green-500 rounded-full" />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg opacity-50">
                <div>
                  <div className="text-sm font-medium text-gray-600">Edit Access</div>
                  <div className="text-xs text-gray-400">Users can modify the dashboard</div>
                </div>
                <div className="w-4 h-4 bg-gray-300 rounded-full" />
              </div>
            </div>
          </div>

          {/* Dashboard Info */}
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Dashboard Info</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Name:</span>
                <span className="text-gray-700 font-medium">{dashboard.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Widgets:</span>
                <span className="text-gray-700 font-medium">{dashboard.widgets.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Visibility:</span>
                <span className={cn(
                  "font-medium",
                  isPublic ? "text-green-600" : "text-gray-600"
                )}>
                  {isPublic ? 'Public' : 'Private'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/20 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Dashboard sharing is managed by your organization
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-white/10 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleCopyLink}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Copy className="w-4 h-4" />
              <span>Copy Link</span>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};