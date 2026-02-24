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
import SettingsModal from '../../pages/Settings';
import 'react-loading-skeleton/dist/skeleton.css';
import { AtSign, Plus, Users } from 'lucide-react';
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
  const [showSettingsModal, setShowSettingsModal] = useState(false);

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
    
    const onNewMessage = (data: any) => {
      // Correct structure from WEBSOCKET_INTEGRATION.md is { message: ... }
      const message = data.message || data;
      const channelId = message.channelId;

      if (!channelId) return;

      setChannels((prev) => {
        const index = prev.findIndex((ch) => ch.id === channelId);
        // If channel exists, move to top
        if (index !== -1) {
          const updatedChannel = { ...prev[index] };
          
          // Update unread count if we are NOT currently in that channel
          if (channelId !== selectedChatId) {
            updatedChannel.unread = (updatedChannel.unread || 0) + 1;
          }

          const newChannels = [...prev];
          newChannels.splice(index, 1);
          newChannels.unshift(updatedChannel);
          return newChannels;
        }
        return prev;
      });
        
      // Toast notification for incoming messages not in current chat
      if (channelId !== selectedChatId) {
        const ch = channels.find((c) => c.id === channelId);
        // Only show toast if it's an actual incoming message (roughly check via unread increment logic or just show it)
        // Ideally we check sender != me, but message.senderId might vary. 
        // Assuming we want toasts for incoming.
        const preview = typeof message.text === 'string' 
          ? message.text.slice(0, 60) 
          : '[Media]';
        toast.info(`New message in #${ch?.name || 'channel'}: ${preview}`);
      }
    };

    socket.on('new_message', onNewMessage);
    return () => {
      socket.off('new_message', onNewMessage);
    };
  }, [socket, channels, selectedChatId]);

  // DM real-time: listen for incoming DM messages
  useEffect(() => {
    if (!socket) return;

    const onNewDmMessage = (data: any) => {
      const message = data.message || data;
      const senderId = message.sender?.id || message.senderId;
      const recipientId = message.recipientId; // Depending on payload
      
      // Determine the partner ID (the user in our list)
      // If I sent it, partner is recipient. If I received it, partner is sender.
      let partnerId = senderId;
      if (senderId === currentUserId) {
         // If I am sender, try to find who I sent it to
         // data.dmId might be helpful if it matches user ID, or recipientId
         partnerId = recipientId || data.dmId;
      }
      
      if (!partnerId) return;

      setUsers((prev) => {
        const index = prev.findIndex((u) => u.id === partnerId || u.id === senderId); // loose check
        
        if (index !== -1) {
          const updatedUser = { ...prev[index] };
          
          // Increment unread only if incoming (sender != me) and not selected
          if (senderId !== currentUserId && updatedUser.id !== selectedChatId) {
            updatedUser.unread = (updatedUser.unread || 0) + 1;
          }

          const newUsers = [...prev];
          newUsers.splice(index, 1);
          newUsers.unshift(updatedUser);
          return newUsers;
        }
        return prev;
      });

      // Toast only for incoming
      if (senderId !== currentUserId && partnerId !== selectedChatId && senderId !== selectedChatId) {
        const user = users.find((u) => u.id === senderId);
        const preview = typeof message.text === 'string' 
          ? message.text.slice(0, 60) 
          : '[Media]';
        toast.info(`New DM from ${user?.name || 'User'}: ${preview}`);
      }
    };

    socket.on('new_dm_message', onNewDmMessage);
    return () => {
      socket.off('new_dm_message', onNewDmMessage);
    };
  }, [socket, users, selectedChatId, currentUserId]);

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

  const currentUser = users.find((u) => u.id === currentUserId);

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
        <button 
          onClick={() => setShowSettingsModal(true)}
          className="w-10 h-10 rounded-full overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all cursor-pointer bg-gray-700 flex items-center justify-center"
        >
          {currentUser?.avatar ? (
            <img 
              src={currentUser.avatar} 
              alt="Profile" 
              className="w-full h-full object-cover" 
            />
          ) : (
            <span className="text-sm font-bold text-white">
              {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          )}
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

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </div>
  );
};

export default Aside;