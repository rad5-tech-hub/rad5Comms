/* eslint-disable @typescript-eslint/no-unused-vars */
// components/aside/NewConversationModal.tsx
import { useState, useEffect } from 'react';
import { X, UserPlus } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import CreateChannelModal from './CreateChannelModal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChat?: (chatId: string, type: 'channel' | 'dm', name?: string) => void;
}

interface UserSearchResult {
  id: string;
  name: string;
  avatar?: string;
}

const NewConversationModal = ({ isOpen, onClose, onSelectChat }: NewConversationModalProps) => {
  const [activeTab, setActiveTab] = useState<'dm' | 'channel'>('dm');
  const [showCreateChannel, setShowCreateChannel] = useState(false);

  // DM search
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search for users
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(
          `${API_BASE_URL}/users?search=${encodeURIComponent(searchTerm)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const users: UserSearchResult[] = res.data?.users || res.data || [];

        // Client-side case-insensitive filter (extra safety)
        const lowerTerm = searchTerm.toLowerCase();
        const filtered = users.filter((u) =>
          u.name.toLowerCase().includes(lowerTerm)
        );

        setSearchResults(filtered.slice(0, 10));
      } catch (err) {
        toast.error('Failed to search users');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleStartDM = (user: UserSearchResult) => {
    // Open DM chat with this user
    onSelectChat?.(user.id, 'dm', user.name);

    // Close modal
    onClose();
    setSearchTerm('');
    setSearchResults([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-gray-900">New Conversation</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-6">
          <button
            className={`flex-1 py-3 font-medium text-center ${
              activeTab === 'dm'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('dm')}
          >
            New Message
          </button>
          <button
            className={`flex-1 py-3 font-medium text-center ${
              activeTab === 'channel'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('channel')}
          >
            New Group
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'dm' ? (
            <div className="space-y-4">
              {/* Search Input */}
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search people..."
                  className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  autoFocus
                />
                <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>

              {/* Search Results */}
              {searchTerm && (
                <div className="max-h-72 overflow-y-auto border border-gray-200 rounded-xl bg-white shadow-sm">
                  {isSearching ? (
                    <div className="p-6 text-center text-gray-500 animate-pulse">
                      Searching...
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      No users found
                    </div>
                  ) : (
                    searchResults.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleStartDM(user)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition border-b last:border-none focus:outline-none"
                      >
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium text-gray-900">{user.name}</span>
                      </button>
                    ))
                  )}
                </div>
              )}

              {!searchTerm && (
                <p className="text-center text-sm text-gray-500 py-8">
                  Start typing a name to find someone and start chatting
                </p>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowCreateChannel(true)}
              className="w-full py-3.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition shadow-md cursor-pointer"
            >
              Create New Group
            </button>
          )}
        </div>
      </div>

      <CreateChannelModal
        isOpen={showCreateChannel}
        onClose={() => setShowCreateChannel(false)}
      />
    </div>
  );
};

export default NewConversationModal;