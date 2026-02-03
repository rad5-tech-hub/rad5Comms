// components/thread-pane/ThreadPane.tsx
import { ChevronLeft } from 'lucide-react';
import ThreadHeader from './ThreadHeader';
import MediaSection from './MediaSection';
import MembersSection from './MembersSection';
import ActionsSection from './ActionsSection';

interface ThreadPaneProps {
  isGroup?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
  onBack?: () => void;
  selectedChat?: {
    id: string;
    name: string;
    type: 'channel' | 'dm';
    description?: string;
    memberCount?: number;
    members?: Array<{ id: string; name: string; avatar?: string; role?: string }>;
    isAdmin?: boolean; // whether current user is admin
  } | null;
}

const ThreadPane = ({
  isGroup = true,
  isOpen = true,
  onBack,
  selectedChat,
}: ThreadPaneProps) => {
  if (!isOpen) return null;

  // Dummy data fallback if no selectedChat
  const chat = selectedChat || {
    id: 'general',
    name: 'General',
    type: 'channel',
    description: 'Main organization-wide channel for announcements and discussions.',
    memberCount: 128,
    members: [
      { id: '1', name: 'Wisdom Ezeh', avatar: 'https://i.pravatar.cc/150?img=1', role: 'admin' },
      { id: '2', name: 'Nasir Uddin', avatar: 'https://i.pravatar.cc/150?img=2' },
      // ... more dummy
    ],
    isAdmin: true,
  };

  return (
    <div className="h-screen lg:w-[320px] min-w-[300px] bg-sidebar border-l border-border overflow-y-auto flex flex-col font-poppins">
      {/* Header with back button */}
      <div className="p-4 border-b border-border flex items-center gap-3 sticky top-0 bg-sidebar z-10">
        {onBack && (
          <button onClick={onBack} className="p-2 -ml-2">
            <ChevronLeft className="w-6 h-6 text-text-secondary" />
          </button>
        )}
        <h2 className="font-semibold text-text-primary truncate">{chat.name}</h2>
      </div>

      <div className="flex-1 px-4 py-6 space-y-10">
        <ThreadHeader chat={chat} isGroup={isGroup} />
        <MediaSection />
        {isGroup && <MembersSection members={chat.members || []} isAdmin={chat.isAdmin} />}
        <ActionsSection isGroup={isGroup} />
      </div>
    </div>
  );
};

export default ThreadPane;