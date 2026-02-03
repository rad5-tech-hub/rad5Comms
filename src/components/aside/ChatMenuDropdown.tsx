// components/aside/ChatMenuDropdown.tsx
import { Archive, Star, Moon } from 'lucide-react';

interface ChatMenuDropdownProps {
  chatId: string;
  type: 'channel' | 'dm';
  onAction: (action: 'archive' | 'star' | 'mute') => void;
}

const ChatMenuDropdown = ({ chatId, type, onAction }: ChatMenuDropdownProps) => {
  return (
    <div className="absolute right-2 top-8 z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[140px]">
      <button
        onClick={() => onAction('archive')}
        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm"
      >
        <Archive className="w-4 h-4" />
        Archive
      </button>
      <button
        onClick={() => onAction('star')}
        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm"
      >
        <Star className="w-4 h-4" />
        Star
      </button>
      <button
        onClick={() => onAction('mute')}
        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm"
      >
        <Moon className="w-4 h-4" />
        Mute
      </button>
    </div>
  );
};

export default ChatMenuDropdown;