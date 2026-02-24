/* eslint-disable @typescript-eslint/no-explicit-any */
// components/aside/Aside.tsx
import { useState, useEffect } from 'react';
import '../../App.css'
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import AsideHeader from './AsideHeader';
import AsideTabs from './AsideTabs';
import ChatSection from './ChatSection';
import CreateChannelModal from './CreateChannelModal';
import NewConversationModal from './NewConversationModal';
import 'react-loading-skeleton/dist/skeleton.css';
import { AtSign, Moon, Plus, Users } from 'lucide-react';
import { useWebSocket } from '../../context/webSocketContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface AsideProps {
  onSelectChat?: (
    chatId: string,
    type: 'channel' | 'dm',
    name?: string,
    extra?: { avatar?: string; description?: string; bio?: string; memberCount?: number }
  ) => void;
}

interface Channel {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  isGroup: boolean;
  createdBy: string;
  members: Array<{
    id: string;
    name: string;
    avatar?: string;
    isOnline: boolean;
    ChannelMember?: { role: string };
  }>;
  role: string;
  createdAt: string;
  updatedAt: string;
  unread?: number;
  isArchived?: boolean;
  isStarred?: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  lastSeen: string;
  profileVisibility: string;
  readReceipts: boolean;
  typingIndicators: boolean;
  notificationSettings: {
    messages: boolean;
    groups: boolean;
    sounds: boolean;
  };
  isOnline: boolean;
  lastActive: string;
  createdAt: string;
  updatedAt: string;
  unread?: number;
  isArchived?: boolean;
  isStarred?: boolean;
}

const Aside = ({ onSelectChat }: AsideProps) => {
  const [activeTab, setActiveTab] = useState<'all' | 'archived' | 'starred'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);

  const navigate = useNavigate();
  const { socket } = useWebSocket();

  // Fetch current user ID (to exclude self from DMs)
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const res = await axios.get(`${API_BASE_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCurrentUserId(res.data?.id || res.data?.user?.id);
      } catch (err) {
        console.warn('Failed to fetch current user ID', err);
      }
    };
    fetchCurrentUser();
  }, []);

  // Fetch channels & users
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to view chats');
        navigate('/');
        return;
      }

      setIsLoading(true);

      try {
        const [channelsRes, usersRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/channels`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_BASE_URL}/users`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setChannels(channelsRes.data?.channels || []);
        setUsers(usersRes.data?.users || []);
      } catch (err: any) {
        const msg = err.response?.data?.error || 'Failed to load data';
        toast.error(msg);

        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem('token');
          navigate('/');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  useEffect(() => {
    if (!socket) return;
    channels.forEach((ch) => socket.emit('join_channel', { channelId: ch.id }));
    const onNewMessage = (data: any) => {
      const { channelId, message } = data || {};
      if (!channelId || !message) return;
      setChannels((prev) =>
        prev.map((ch) =>
          ch.id === channelId ? { ...ch, unread: (ch.unread || 0) + 1 } : ch
        )
      );
      const ch = channels.find((c) => c.id === channelId);
      const preview =
        typeof message.text === 'string'
          ? message.text.slice(0, 60)
          : '[message]';
      toast.info(`${ch?.name || 'New message'}: ${preview}`);
    };
    socket.on('new_message', onNewMessage);
    return () => {
      socket.off('new_message', onNewMessage);
    };
  }, [socket, channels]);

  // DM real-time: listen for incoming DM messages to show notification toasts and update unread
  useEffect(() => {
    if (!socket) return;

    const onNewDmMessage = (data: any) => {
      const { dmId, message } = data || {};
      if (!dmId || !message) return;

      // Increment unread for the DM sender
      setUsers((prev) =>
        prev.map((u) =>
          u.id === dmId ? { ...u, unread: (u.unread || 0) + 1 } : u
        )
      );

      // Show a toast notification
      const user = users.find((u) => u.id === dmId);
      const preview =
        typeof message.text === 'string'
          ? message.text.slice(0, 60)
          : '[message]';
      toast.info(`${user?.name || 'New DM'}: ${preview}`);
    };

    socket.on('new_dm_message', onNewDmMessage);
    return () => {
      socket.off('new_dm_message', onNewDmMessage);
    };
  }, [socket, users]);

  // Global unread badge update from server
  useEffect(() => {
    const onUnreadUpdate = (e: Event) => {
      const ce = e as CustomEvent<{ type: string; dmId?: string; senderId?: string }>;
      const { dmId } = ce.detail;
      if (dmId) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === dmId ? { ...u, unread: (u.unread || 0) + 1 } : u
          )
        );
      }
    };
    window.addEventListener('unread-update', onUnreadUpdate as EventListener);
    return () => window.removeEventListener('unread-update', onUnreadUpdate as EventListener);
  }, []);

  useEffect(() => {
    const onChatRead = (e: Event) => {
      const ce = e as CustomEvent<{ chatId: string; type: 'channel' | 'dm' }>;
      const { chatId } = ce.detail;
      setChannels((prev) => prev.map((ch) => (ch.id === chatId ? { ...ch, unread: 0 } : ch)));
      setUsers((prev) => prev.map((u) => (u.id === chatId ? { ...u, unread: 0 } : u)));
    };
    window.addEventListener('chat-read', onChatRead as EventListener);
    return () => window.removeEventListener('chat-read', onChatRead as EventListener);
  }, []);

  // Filter logic
  const filteredChannels = channels.filter((ch) => {
    if (activeTab === 'archived') {
      return ch.isArchived;
    }
    if (activeTab === 'starred') {
      return ch.isStarred && !ch.isArchived;
    }
    return !ch.isArchived; // 'all' tab shows non-archived
  });

  const filteredUsers = users
    .filter((u) => u.id !== currentUserId) // No self-DM
    .filter((u) => {
      if (activeTab === 'archived') {
        return u.isArchived;
      }
      if (activeTab === 'starred') {
        return u.isStarred && !u.isArchived;
      }
      return !u.isArchived; // 'all' tab shows non-archived
    });

  // Callback for optimistic updates after action
  const handleActionSuccess = (updatedItem: any, isChannel: boolean) => {
    if (isChannel) {
      setChannels((prev) =>
        prev.map((ch) => (ch.id === updatedItem.id ? { ...ch, ...updatedItem } : ch))
      );
    } else {
      setUsers((prev) =>
        prev.map((u) => (u.id === updatedItem.id ? { ...u, ...updatedItem } : u))
      );
    }
  };

  const handleSelectChat = (chatId: string, type: 'channel' | 'dm', name?: string) => {
    setSelectedChatId(chatId);

    // Find full data from current lists for immediate use
    let extraData: { avatar?: string; description?: string; bio?: string; memberCount?: number } | undefined;

    if (type === 'channel') {
      const channel = channels.find((ch) => ch.id === chatId);
      if (channel) {
        extraData = {
          avatar: channel.avatar,
          description: channel.description,
          memberCount: channel.members?.length,
        };
      }
    } else {
      const user = users.find((u) => u.id === chatId);
      if (user) {
        extraData = {
          avatar: user.avatar,
          bio: user.bio,
        };
      }
    }

    onSelectChat?.(chatId, type, name, extraData);
  };

  return (
    <div className="font-poppins h-screen sm:w-auto lg:w-70 min-w-65 bg-sidebar text-sidebar-text flex flex-col">
      <AsideHeader
        isLoading={isLoading}
        channels={channels}
        users={users}
        onSelectChat={handleSelectChat}
      />

      <AsideTabs activeTab={activeTab} setActiveTab={setActiveTab} isLoading={isLoading} />

      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Channels ~60% */}
        <div className="flex-5 overflow-y-auto px-3 py-4 scroll">
          <ChatSection
            title="TEAM"
            icon={<Users className="w-3.5 h-3.5" />}
            items={filteredChannels}
            type="channel"
            onSelectChat={handleSelectChat}
            onPlusClick={() => setShowCreateChannelModal(true)}
            emptyMessage="No channels yet. Click + to create one!"
            activeTab={activeTab}
            onActionSuccess={(updated: any) => handleActionSuccess(updated, true)}
            selectedChatId={selectedChatId ?? undefined}
          />
        </div>

        {/* Personal ~40% */}
        <div className="flex-6 overflow-y-auto px-3 py-4 border-t border-white/10 scroll">
          <ChatSection
            title="PERSONAL"
            icon={<AtSign className="w-3.5 h-3.5" />}
            items={filteredUsers}
            type="dm"
            onSelectChat={handleSelectChat}
            emptyMessage="No direct messages yet"
            activeTab={activeTab}
            onActionSuccess={(updated) => handleActionSuccess(updated, false)}
            selectedChatId={selectedChatId ?? undefined}
          />
        </div>
      </div>

      <div className="p-4 border-t border-white/10 flex gap-3">
        <button
          onClick={() => setShowNewConversationModal(true)}
          className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-md text-sm font-medium transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New Conversation
        </button>
        <button className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition flex items-center justify-center">
          <Moon className="w-4 h-4" />
        </button>
      </div>

      <CreateChannelModal
        isOpen={showCreateChannelModal}
        onClose={() => setShowCreateChannelModal(false)}
      />

      <NewConversationModal
        isOpen={showNewConversationModal}
        onClose={() => setShowNewConversationModal(false)}
        onSelectChat={handleSelectChat}
      />
    </div>
  );
};

export default Aside;