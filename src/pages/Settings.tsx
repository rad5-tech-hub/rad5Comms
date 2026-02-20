/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/settings/SettingsModal.tsx
import { useState, useEffect, useRef } from 'react';
import '../App.css';
import { X, User, Camera, Mail, Loader2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'privacy'>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    lastSeen: 'everyone',
    profileVisibility: 'everyone',
    readReceipts: true,
    typingIndicators: true,
    messageNotifications: true,
    groupNotifications: true,
    soundVibration: true,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch current user data on modal open
  useEffect(() => {
    if (!isOpen) return;

    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token');

        const res = await axios.get(`${API_BASE_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const user = res.data?.user || res.data;

        // Use avatar directly from /users/me response
        setAvatarPreview(user.avatar || null);

        setFormData({
          name: user.name || '',
          email: user.email || '',
          bio: user.bio || '',
          lastSeen: user.lastSeen || 'everyone',
          profileVisibility: user.profileVisibility || 'everyone',
          readReceipts: user.readReceipts ?? true,
          typingIndicators: user.typingIndicators ?? true,
          messageNotifications: user.notificationSettings?.messages ?? true,
          groupNotifications: user.notificationSettings?.groups ?? true,
          soundVibration: user.notificationSettings?.sounds ?? true,
        });
      } catch (err: any) {
        toast.error(err.response?.data?.error || 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();

    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [isOpen]);

  // const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  //   const { name, value, type, checked } = e.target as any;
  //   setFormData(prev => ({
  //     ...prev,
  //     [name]: type === 'checkbox' ? checked : value,
  //   }));
  // };

  // const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0];
  //   if (!file) return;

  //   setAvatarFile(file);
  //   const url = URL.createObjectURL(file);
  //   setAvatarPreview(url);
  // };

  const handleSave = async () => {
    setIsSaving(true);
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please log in');
      setIsSaving(false);
      return;
    }

    try {
      if (activeTab === 'profile') {
        // Update profile
        await axios.put(
          `${API_BASE_URL}/users/profile`,
          { name: formData.name, email: formData.email, bio: formData.bio },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Upload avatar if changed
        if (avatarFile) {
          const formDataAvatar = new FormData();
          formDataAvatar.append('avatar', avatarFile);
          await axios.put(`${API_BASE_URL}/users/avatar`, formDataAvatar, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          });
          toast.success('Profile picture updated');
        }

        toast.success('Profile updated');
      } else if (activeTab === 'privacy') {
        await axios.put(
          `${API_BASE_URL}/users/privacy`,
          {
            lastSeen: formData.lastSeen,
            profileVisibility: formData.profileVisibility,
            readReceipts: formData.readReceipts,
            typingIndicators: formData.typingIndicators,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Privacy settings updated');
      } else if (activeTab === 'notifications') {
        await axios.put(
          `${API_BASE_URL}/users/notifications`,
          {
            messages: formData.messageNotifications,
            groups: formData.groupNotifications,
            sounds: formData.soundVibration,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Notification settings updated');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="font-poppins fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-sidebar text-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3">
          <h2 className="text-xl font-semibold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 cursor-pointer rounded-full hover:bg-blue-600 transition"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 cursor-pointer text-sm font-medium transition-colors ${
              activeTab === 'profile'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-300 hover:text-gray-500'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 py-3 text-sm cursor-pointer font-medium transition-colors ${
              activeTab === 'notifications'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-300 hover:text-gray-500'
            }`}
          >
            Notifications
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 py-3 text-sm cursor-pointer font-medium transition-colors ${
              activeTab === 'privacy'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-300 hover:text-gray-500'
            }`}
          >
            Privacy
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scroll p-6 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <p className="mt-4 text-gray-400">Loading profile...</p>
            </div>
          ) : (
            <>
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  {/* Avatar */}
                  <div className="flex flex-col items-center">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden border-4 border-white shadow-md">
                        {avatarPreview ? (
                          <img
                            src={avatarPreview}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-blue-300 flex items-center justify-center text-white text-2xl font-bold">
                            {formData.name?.charAt(0) || 'U'}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition"
                      >
                        <Camera size={16} />
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setAvatarFile(file);
                            setAvatarPreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-3 text-sm text-white hover:underline"
                    >
                      Change profile picture
                    </button>
                  </div>

                  {/* Form fields */}
                  <div className="space-y-4 text-sm lg:text-normal">
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-1">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          name="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-1">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          name="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-1">Bio / Status</label>
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-transparent text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-6 text-sm lg:text-normal">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-200">Message notifications</h3>
                      <p className="text-sm text-gray-500">Get notified for new messages</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="messageNotifications"
                        checked={formData.messageNotifications}
                        onChange={(e) => setFormData({ ...formData, messageNotifications: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-200">Group chat notifications</h3>
                      <p className="text-sm text-gray-500">For mentions and replies</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="groupNotifications"
                        checked={formData.groupNotifications}
                        onChange={(e) => setFormData({ ...formData, groupNotifications: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-200">Sound & vibration</h3>
                      <p className="text-sm text-gray-500">Play sound for new messages</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="soundVibration"
                        checked={formData.soundVibration}
                        onChange={(e) => setFormData({ ...formData, soundVibration: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              )}

              {/* Privacy Tab */}
              {activeTab === 'privacy' && (
                <div className="space-y-6 text-sm lg:text-normal">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">Who can see my last seen</label>
                    <select
                      name="lastSeen"
                      value={formData.lastSeen}
                      onChange={(e) => setFormData({ ...formData, lastSeen: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent text-white"
                    >
                      <option value="everyone">Everyone</option>
                      <option value="contacts">My contacts</option>
                      <option value="nobody">Nobody</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">Who can see my profile photo</label>
                    <select
                      name="profileVisibility"
                      value={formData.profileVisibility}
                      onChange={(e) => setFormData({ ...formData, profileVisibility: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent text-white"
                    >
                      <option value="everyone">Everyone</option>
                      <option value="contacts">My contacts</option>
                      <option value="nobody">Nobody</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-200">Read receipts</h3>
                      <p className="text-sm text-gray-500">Show when you've read messages</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="readReceipts"
                        checked={formData.readReceipts}
                        onChange={(e) => setFormData({ ...formData, readReceipts: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-200">Typing indicators</h3>
                      <p className="text-sm text-gray-500">Show when you're typing</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="typingIndicators"
                        checked={formData.typingIndicators}
                        onChange={(e) => setFormData({ ...formData, typingIndicators: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end gap-3 text-sm lg:text-normal">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-gray-300 hover:bg-red-600 cursor-pointer rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition disabled:opacity-70 flex items-center gap-2"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;