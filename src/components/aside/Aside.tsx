/* eslint-disable @typescript-eslint/no-explicit-any */
// components/aside/Aside.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import AsideHeader from './AsideHeader';
import AsideTabs from './AsideTabs';
import ChatSection from './ChatSection';
import CreateChannelModal from './CreateChannelModal';
import NewConversationModal from './NewConversationModal';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { AtSign, Moon, Plus, Users } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface AsideProps {
  onSelectChat?: (chatId: string, type: 'channel' | 'dm', name?: string) => void;
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
}

const Aside = ({ onSelectChat }: AsideProps) => {
  const [activeTab, setActiveTab] = useState<'all' | 'archived' | 'starred'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to view chats');
        navigate('/');
        return;
      }

      setIsLoading(true);
      setError(null);

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
        setError(msg);
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

  return (
    <div className="font-poppins h-screen sm:w-auto lg:w-[280px] min-w-[260px] bg-sidebar text-sidebar-text overflow-y-auto flex flex-col scroll">
      <AsideHeader isLoading={isLoading} />

      <AsideTabs activeTab={activeTab} setActiveTab={setActiveTab} isLoading={isLoading} />

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scroll">
        {isLoading ? (
          // Skeleton (you can keep or move to a separate SkeletonAside.tsx later)
          <div className="space-y-8">
            <div>
              <div className="flex items-center justify-between mb-2 px-2">
                <Skeleton width={80} height={16} />
                <Skeleton circle width={20} height={20} />
              </div>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2 px-3">
                  <Skeleton circle width={24} height={24} />
                  <Skeleton width="70%" height={16} />
                </div>
              ))}
            </div>
            <div>
              <div className="flex items-center justify-between mb-2 px-2">
                <Skeleton width={100} height={16} />
                <Skeleton circle width={20} height={20} />
              </div>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2 px-3">
                  <Skeleton circle width={32} height={32} />
                  <Skeleton width="80%" height={16} />
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="text-center text-red-400 py-8 px-4 text-sm">{error}</div>
        ) : (
          <>
            <ChatSection
              title="TEAM"
              icon={<Users className="w-3.5 h-3.5" />}
              items={channels}
              type="channel"
              onSelectChat={onSelectChat}
              onPlusClick={() => setShowCreateChannelModal(true)}
              emptyMessage="No channels yet. Click + to create one!"
            />

            <ChatSection
              title="PERSONAL"
              icon={<AtSign className="w-3.5 h-3.5" />}
              items={users}
              type="dm"
              onSelectChat={onSelectChat}
              emptyMessage="No direct messages yet"
            />
          </>
        )}
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
        onSelectChat={onSelectChat}
      />
    </div>
  );
};

export default Aside;