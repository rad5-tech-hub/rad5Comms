// components/aside/ChatItem.tsx
import { useState, useEffect, useRef } from 'react';
import { MoreVertical, Hash, Archive, Star, Moon } from 'lucide-react';
import { toast } from 'sonner';

interface ChatItemProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  item: any; // Channel | User
  type: 'channel' | 'dm';
  onSelectChat?: (chatId: string, type: 'channel' | 'dm', name?: string) => void;
}

const ChatItem = ({ item, type, onSelectChat }: ChatItemProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
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
    e.stopPropagation(); // Prevent chat selection
    setIsMenuOpen(!isMenuOpen);
  };

  const handleAction = (action: 'archive' | 'star' | 'mute') => {
    // Placeholder – replace with real API call later
    toast.success(`${action.charAt(0).toUpperCase() + action.slice(1)}d ${type} "${item.name}"`);
    setIsMenuOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => onSelectChat?.(item.id, type, item.name)}
        className="w-full text-left px-3 py-1.5 rounded-md hover:bg-white/10 transition flex items-center gap-2.5 cursor-pointer group"
      >
        {type === 'channel' ? (
          <Hash className="w-4 h-4 opacity-80" />
        ) : item.avatar ? (
          <img
            src={item.avatar}
            alt={item.name}
            className="w-6 h-6 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-blue-500/30 flex items-center justify-center text-white text-xs font-bold">
            {item.name.charAt(0).toUpperCase()}
          </div>
        )}

        <span className="flex-1 truncate">{item.name}</span>

        {item.unread && item.unread > 0 && (
          <span className="ml-2 text-xs bg-red-300/80 text-white px-2 py-0.5 rounded-full font-medium">
            {item.unread}
          </span>
        )}

        <button
          onClick={toggleMenu}
          className="p-1 rounded-full cursor-pointer"
        >
          <MoreVertical className="w-4 h-4 opacity-70" />
        </button>
      </button>

      {/* Dropdown Menu */}
      {isMenuOpen && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-xl border border-gray-200 py-1.5 z-50">
          <button
            onClick={() => handleAction('archive')}
            className="cursor-pointer w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2.5 text-sm text-gray-700"
          >
            <Archive className="w-4 h-4" />
            Archive
          </button>
          <button
            onClick={() => handleAction('star')}
            className="cursor-pointer w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2.5 text-sm text-gray-700"
          >
            <Star className="w-4 h-4" />
            Star
          </button>
          <button
            onClick={() => handleAction('mute')}
            className="cursor-pointer w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2.5 text-sm text-gray-700"
          >
            <Moon className="w-4 h-4" />
            Mute
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatItem;