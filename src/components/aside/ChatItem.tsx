// components/aside/ChatItem.tsx
import { useState, useEffect, useRef } from 'react';
import { MoreVertical, Hash, Archive, Star, Bell, BellOff, CheckCircle } from 'lucide-react';
import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface ChatItemProps {
  item: {
    id: string;
    name: string;
    avatar?: string;
    unread?: number;
    isArchived?: boolean;
    isStarred?: boolean;
    isMuted?: boolean; // Add isMuted state
    // ... other fields
  };
  type: 'channel' | 'dm';
  onSelectChat?: (chatId: string, type: 'channel' | 'dm', name?: string) => void;
  activeTab: 'all' | 'archived' | 'starred';
  selectedChatId?: string;
  onActionSuccess?: (updatedItem: any) => void;
}

const ChatItem = ({ item, type, onSelectChat, activeTab, selectedChatId, onActionSuccess }: ChatItemProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isSelected = selectedChatId === item.id;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  const handleAction = async (action: 'markRead' | 'archive' | 'star' | 'mute') => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token');

      let url = '';
      const actionPath = action === 'markRead' ? 'read' : action;

      if (type === 'channel') {
        url = `${API_BASE_URL}/channels/${item.id}/${actionPath}`;
      } else {
        // For DMs, item.id is the recipientId
        url = `${API_BASE_URL}/dms/${item.id}/${actionPath}`;
      }

      const res = await axios.post(url, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const responseData = res.data;
      const updatedItem = {
        ...item,
        ...(responseData.isStarred !== undefined && { isStarred: responseData.isStarred }),
        ...(responseData.isArchived !== undefined && { isArchived: responseData.isArchived }),
        ...(responseData.isMuted !== undefined && { isMuted: responseData.isMuted }),
      };
      
      onActionSuccess?.(updatedItem);

      const actionTextMap = {
        markRead: 'marked as read',
        archive: updatedItem.isArchived ? 'archived' : 'unarchived',
        star: updatedItem.isStarred ? 'starred' : 'unstarred',
        mute: updatedItem.isMuted ? 'muted' : 'unmuted',
      };

      toast.success(`${item.name} ${actionTextMap[action]}`);

    } catch (err: unknown) {
      const error = err as AxiosError<{ error: string }>;
      toast.error(error.response?.data?.error || `Failed to ${action} ${item.name}`);
    }

    setIsMenuOpen(false);
  };

  // This is now handled in Aside.tsx, but we'll keep it to prevent any flicker
  // while state updates, though the logic in Aside should be the source of truth.
  if (
    (activeTab === 'archived' && !item.isArchived) ||
    (activeTab === 'all' && item.isArchived)
  ) {
    return null;
  }

  return (
    <div className="relative" ref={menuRef}>
      <div
        onClick={() => onSelectChat?.(item.id, type, item.name)}
        className={`w-full text-left px-3 py-1.5 rounded-md transition flex items-center gap-2.5 cursor-pointer group ${
          isSelected 
            ? 'bg-blue/50 text-white' 
            : 'hover:bg-white/10'
        }`}
      >
        {type === 'channel' ? (
          <Hash className="w-4 h-4 opacity-80" />
        ) : item.avatar ? (
          <img src={item.avatar} alt={item.name} className="w-6 h-6 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-6 h-6 rounded-full bg-blue-500/30 flex items-center justify-center text-white text-xs font-bold">
            {item.name.charAt(0).toUpperCase()}
          </div>
        )}

        <span className="flex-1 truncate">{item.name}</span>

        {item.isStarred && <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />}

        {/* Only show badge if unread > 0 */}
        {typeof item.unread === 'number' && item.unread > 0 && (
          <span className="ml-2 text-xs bg-red-300/80 text-white px-2 py-0.5 rounded-full font-medium">
            {item.unread}
          </span>
        )}

        <button
          onClick={toggleMenu}
          className="p-1 rounded-full lg:opacity-0 lg:group-hover:opacity-100 transition cursor-pointer"
        >
          <MoreVertical className="w-4 h-4 opacity-70" />
        </button>
      </div>

      {isMenuOpen && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-1.5 z-50">
          {item.unread && item.unread > 0 && (
            <button
              onClick={() => handleAction('markRead')}
              className="w-full text-left px-4 py-2.5 hover:bg-gray-100 flex items-center gap-3 text-sm text-gray-700"
            >
              <CheckCircle className="w-4 h-4" />
              Mark as read
            </button>
          )}

          <button
            onClick={() => handleAction('archive')}
            className="w-full text-left px-4 py-2.5 hover:bg-gray-100 flex items-center gap-3 text-sm text-gray-700"
          >
            <Archive className="w-4 h-4" />
            {item.isArchived ? 'Unarchive' : 'Archive'}
          </button>

          <button
            onClick={() => handleAction('star')}
            className="w-full text-left px-4 py-2.5 hover:bg-gray-100 flex items-center gap-3 text-sm text-gray-700"
          >
            <Star className="w-4 h-4" />
            {item.isStarred ? 'Unstar' : 'Star'}
          </button>

          <button
            onClick={() => handleAction('mute')}
            className="w-full text-left px-4 py-2.5 hover:bg-gray-100 flex items-center gap-3 text-sm text-gray-700"
          >
            {item.isMuted ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            {item.isMuted ? 'Unmute' : 'Mute'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatItem;