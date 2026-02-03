// components/main/ChatHeader.tsx
import { ChevronDown, ChevronLeft, Phone, Video, Settings } from 'lucide-react';

interface ChatHeaderProps {
  selectedChat: { name?: string } | null;
  isThreadOpen: boolean;
  toggleThreadPane: () => void;
  onBack?: () => void;
  onSettingsOpen: () => void;
}

const ChatHeader = ({
  selectedChat,
  isThreadOpen,
  toggleThreadPane,
  onBack,
  onSettingsOpen,
}: ChatHeaderProps) => {
  return (
    <div className="flex items-center justify-center mb-2 px-4">
      <header className="h-14 bg-white flex items-center justify-between px-4 shadow-lg w-full max-w-4xl mt-2 rounded-3xl">
        {onBack && (
          <button onClick={onBack} className="p-2 -ml-2">
            <ChevronLeft className="w-6 h-6 text-text-primary" />
          </button>
        )}

        <div
          className="flex items-center gap-2 lg:gap-3 cursor-pointer"
          onClick={toggleThreadPane}
        >
          <h2 className="font-semibold text-text-primary">
            {selectedChat?.name || 'Rad5 Comms'}
          </h2>
          <ChevronDown
            className={`w-4 h-4 text-text-secondary transition-transform duration-200 ${
              isThreadOpen ? 'rotate-180' : 'rotate-0'
            }`}
          />
        </div>

        <div className="flex items-center gap-1 lg:gap-2">
          <button className="p-2 rounded hover:bg-offwhite transition cursor-pointer">
            <Phone className="w-4 lg:w-5 h-4 lg:h-5 text-text-secondary" />
          </button>
          <button className="p-2 rounded hover:bg-offwhite transition cursor-pointer">
            <Video className="w-4 lg:w-5 h-4 lg:h-5 text-text-secondary" />
          </button>
          <button
            className="p-2 rounded hover:bg-offwhite transition cursor-pointer"
            onClick={onSettingsOpen}
          >
            <Settings className="w-4 lg:w-5 h-4 lg:h-5 text-text-secondary" />
          </button>
        </div>
      </header>
    </div>
  );
};

export default ChatHeader;