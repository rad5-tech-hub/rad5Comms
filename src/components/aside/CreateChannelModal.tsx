/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// components/aside/CreateChannelModal.tsx
import { useState, useEffect } from 'react';
import { X, UserPlus } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface CreateChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserSearchResult {
  id: string;
  name: string;
  avatar?: string;
}

const CreateChannelModal = ({ isOpen, onClose }: CreateChannelModalProps) => {
  // ── Existing states ──
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editPermission, setEditPermission] = useState<'admin' | 'all'>('admin');
  const [addMemberPermission, setAddMemberPermission] = useState<'admin' | 'all'>('admin');

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // ── NEW: Current user state ──
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Fetch current user ID when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token');

        const res = await axios.get(`${API_BASE_URL}/users/me`, {  // or /auth/me
          headers: { Authorization: `Bearer ${token}` },
        });

        const userId = res.data?.id || res.data?.user?.id;
        if (!userId) throw new Error('No user ID returned');

        setCurrentUserId(userId);
      } catch (err) {
        console.error('Failed to fetch current user:', err);
        toast.error('Could not verify your identity. Please log in again.');
        onClose(); // close modal on auth failure
      }
    };

    fetchCurrentUser();

    // Cleanup: reset when modal closes
    return () => {
      setCurrentUserId(null);
    };
  }, [isOpen, onClose]);

  // ── Debounced search (updated to exclude current user) ──
  useEffect(() => {
    if (!searchTerm.trim() || !currentUserId) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setSelectedMembers([{ id: currentUserId, name: 'You (Creator)' }]);

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(
          `${API_BASE_URL}/users?search=${encodeURIComponent(searchTerm)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const users: UserSearchResult[] = res.data?.users || res.data || [];

        const lowerTerm = searchTerm.toLowerCase();
        const filtered = users.filter(
          (u) =>
            u.name.toLowerCase().includes(lowerTerm) &&
            u.id !== currentUserId &&                          // ← Prevent self
            !selectedMembers.some((m) => m.id === u.id)       // ← Prevent duplicates
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
  }, [searchTerm, currentUserId, selectedMembers]);

  const handleAddMember = (user: UserSearchResult) => {
    if (user.id === currentUserId) {
      toast.info("You are already a member as the creator");
      return;
    }

    if (selectedMembers.some((m) => m.id === user.id)) {
      toast.info("This user is already added");
      return;
    }

    setSelectedMembers([...selectedMembers, user]);
    setSearchTerm('');
    setSearchResults([]);
  };

  const handleRemoveMember = (userId: string) => {
    setSelectedMembers(selectedMembers.filter((m) => m.id !== userId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Channel name is required');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/channels`,
        {
          name,
          description,
          editPermission,
          addMemberPermission,
          members: selectedMembers.map((m) => m.id),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Channel created!');
      onClose();
      setName('');
      setDescription('');
      setSelectedMembers([]);
      setSearchTerm('');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create channel');
    }
  };

  // Early return AFTER all hooks
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-gray-900">New Group</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Channel Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Project X Team"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this group about?"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 resize-none"
              rows={3}
            />
          </div>

          {/* Permissions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Who can edit group info?
              </label>
              <select
                value={editPermission}
                onChange={(e) => setEditPermission(e.target.value as 'admin' | 'all')}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              >
                <option value="admin">Only admins</option>
                <option value="all">All members</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Who can add members?
              </label>
              <select
                value={addMemberPermission}
                onChange={(e) => setAddMemberPermission(e.target.value as 'admin' | 'all')}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              >
                <option value="admin">Only admins</option>
                <option value="all">All members</option>
              </select>
            </div>
          </div>

          {/* Member Search & Selection – WhatsApp style */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Members
            </label>

            {/* Search Input */}
            <div className="relative mb-3">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Type a name to add..."
                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
              <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>

            {/* Selected Members Chips */}
            {selectedMembers.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4 overflow-x-auto pb-2">
                {selectedMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-2 bg-blue-50 text-blue-800 px-3 py-1.5 rounded-full text-sm whitespace-nowrap"
                  >
                    {member.avatar ? (
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-blue-500/30 flex items-center justify-center text-white text-xs font-bold">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="font-medium">{member.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(member.id)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Search Results */}
            {searchTerm && (
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-xl bg-white shadow-sm">
                {isSearching ? (
                  <div className="p-4 text-center text-gray-500">Searching...</div>
                ) : searchResults.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No users found</div>
                ) : (
                  searchResults.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleAddMember(user)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition border-b last:border-none"
                    >
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover"
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
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3.5 mt-6 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition shadow-md cursor-pointer"
          >
            Create Group
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateChannelModal;