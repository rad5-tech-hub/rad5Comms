/* eslint-disable @typescript-eslint/no-explicit-any */
// components/aside/ChatSection.tsx
import { Plus } from 'lucide-react';
import ChatItem from './ChatItem';

interface ChatSectionProps {
  title: string;
  icon: React.ReactNode;
  items: any[];
  type: 'channel' | 'dm';
  onSelectChat?: (chatId: string, type: 'channel' | 'dm', name?: string) => void;
  onPlusClick?: () => void;
  emptyMessage: string;
  activeTab: 'all' | 'archived' | 'starred';
  onActionSuccess?: (updatedItem: any) => void;
  selectedChatId?: string;
}

const ChatSection = ({
  title,
  icon,
  items,
  type,
  onSelectChat,
  onPlusClick,
  emptyMessage,
  activeTab,
  onActionSuccess,
  selectedChatId
}: ChatSectionProps) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-2 px-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide opacity-80 flex items-center gap-1.5">
          {icon}
          {title}
        </h2>
        {onPlusClick && (
          <button onClick={onPlusClick} className="text-white/60 hover:text-white cursor-pointer">
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="space-y-0.5">
        {items.length === 0 ? (
          <div className="text-center text-sm opacity-70 py-6 px-4 bg-white/5 rounded-lg">
            {emptyMessage}
          </div>
        ) : (
          items.map((item) => (
            <ChatItem
              key={item.id}
              item={item}
              type={type}
              onSelectChat={onSelectChat}
              activeTab={activeTab}
              onActionSuccess={onActionSuccess}
              selectedChatId={selectedChatId}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ChatSection;