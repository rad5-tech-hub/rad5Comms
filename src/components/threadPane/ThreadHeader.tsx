/* eslint-disable @typescript-eslint/no-explicit-any */
// components/thread-pane/ThreadHeader.tsx
import { UserPlus } from 'lucide-react';

interface ThreadHeaderProps {
  chat: any;
  isGroup: boolean;
}

const ThreadHeader = ({ chat, isGroup }: ThreadHeaderProps) => {
  return (
    <div className="text-center space-y-4 text-white">
      {/* Avatar */}
      <div className="mx-auto w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-md">
        {chat.avatar ? (
          <img src={chat.avatar} alt={chat.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-4xl font-bold text-gray-500">
            {chat.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Name */}
      <h3 className="text-xl font-bold">{chat.name}</h3>

      {/* Bio / Description */}
      <p className="text-sm text-text-secondary">{chat.description || 'No description available'}</p>

      {/* Member count + Add button (groups only) */}
      {isGroup && (
        <div className="flex items-center justify-center gap-6 text-sm">
          <div>
            <span className="font-semibold ">{chat.memberCount || 0}</span>
            <span className="text-text-secondary"> members</span>
          </div>
          <button className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition">
            <UserPlus className="w-4 h-4" />
            Add
          </button>
        </div>
      )}
    </div>
  );
};

export default ThreadHeader;