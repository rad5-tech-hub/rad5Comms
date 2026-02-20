// components/thread-pane/ThreadPane.tsx
import { ChevronLeft } from 'lucide-react';
import ThreadHeader from './ThreadHeader';
import MediaSection from './MediaSection';
import MembersSection from './MembersSection';
import ActionsSection from './ActionsSection';

interface ThreadPaneProps {
  isOpen: boolean;
  onToggle?: () => void;
  onBack?: () => void;
  selectedChat?: {
    id: string;
    name: string;
    type: 'channel' | 'dm';
    description?: string;
    avatar?: string;           // ← added for avatar
    memberCount?: number;      // ← for groups
    members?: Array<{
      id: string;
      name: string;
      avatar?: string;
      role?: string;
    }>;
    isAdmin?: boolean;         // whether current user is admin in this channel
  } | null;
}

const ThreadPane = ({
  isOpen,
  onBack,
  onToggle,
  selectedChat,
}: ThreadPaneProps) => {
  if (!isOpen) return null;

  // If no chat selected → show placeholder
  if (!selectedChat) {
    return (
      <div className="h-screen lg:w-[320px] min-w-[300px] bg-sidebar border-l border-border flex flex-col items-center justify-center text-center text-gray-400">
        <p className="text-lg font-medium">No chat selected</p>
        <p className="text-sm mt-2">Select a conversation to view details</p>
      </div>
    );
  }

  const isGroup = selectedChat.type === 'channel';

  const handleActionSuccess = () => {
    onToggle?.(); 
    window.dispatchEvent(new CustomEvent('chat-action-success', { detail: { chatId: selectedChat.id } }));
  };

  return (
    <div className="h-screen lg:w-[320px] min-w-[300px] bg-sidebar border-l border-border overflow-y-auto flex flex-col font-poppins">
      {/* Header with back button */}
      <div className="p-1 border-b border-border flex items-center sticky top-0 bg-sidebar z-10 lg:hidden">
        {onBack && (
          <button onClick={onBack} className="p-2 flex text-white">
            <ChevronLeft className="w-6 h-6 text-white"/>
            Back
          </button>
        )}
      </div>

      <div className="flex-1 px-4 py-6 space-y-10">
        {/* Dynamic Header */}
        <ThreadHeader
          chat={{
            ...selectedChat,
            isGroup, // pass explicitly if needed
          }}
        />

        {/* Media */}
        <MediaSection media={selectedChat?.media || []} />

        {/* Members - only for groups/channels */}
        {isGroup && (
          <MembersSection
            members={selectedChat?.members || []}
            isAdmin={selectedChat?.isAdmin || false}
            isGroup={selectedChat?.type === 'channel'} // ← controls visibility
          />
        )}

        {/* Actions */}
        <ActionsSection isGroup={isGroup} chatId={selectedChat.id} onActionSuccess={handleActionSuccess}/>
      </div>
    </div>
  );
};

export default ThreadPane;