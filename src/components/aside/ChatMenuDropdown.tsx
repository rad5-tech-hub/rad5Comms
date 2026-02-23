// components/aside/ChatMenuDropdown.tsx
import { Archive, Star, BellOff, Trash2 } from 'lucide-react';

type ActionType = 'archive' | 'star' | 'mute' | 'delete';

interface ChatMenuDropdownProps {
  onAction: (action: ActionType) => void;
}

const ChatMenuDropdown = ({ onAction }: ChatMenuDropdownProps) => {
  const handleAction = (e: React.MouseEvent, action: ActionType) => {
    e.stopPropagation();
    onAction(action);
  };

  return (
    <div className="absolute right-2 top-8 z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-35">
      <button
        onClick={(e) => handleAction(e, 'archive')}
        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm"
      >
        <Archive className="w-4 h-4" />
        Archive
      </button>
      <button
        onClick={(e) => handleAction(e, 'star')}
        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm"
      >
        <Star className="w-4 h-4" />
        Star
      </button>
      <button
        onClick={(e) => handleAction(e, 'mute')}
        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm"
      >
        <BellOff className="w-4 h-4" />
        Mute
      </button>
      <button
        onClick={(e) => handleAction(e, 'delete')}
        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm"
      >
        <Trash2 className="w-4 h-4" />
        Delete
      </button>
    </div>
  );
};

export default ChatMenuDropdown;