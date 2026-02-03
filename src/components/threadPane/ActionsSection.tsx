// components/thread-pane/ActionsSection.tsx
import { Trash2, Ban, LogOut } from 'lucide-react';

interface ActionsSectionProps {
  isGroup: boolean;
}

const ActionsSection = ({ isGroup }: ActionsSectionProps) => {
  return (
    <div className="space-y-2 border-t border-border pt-6">
      <button className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50/50 rounded-lg transition">
        <Trash2 className="w-5 h-5" />
        Clear Chat
      </button>

      {isGroup ? (
        <>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50/50 rounded-lg transition">
            <Ban className="w-5 h-5" />
            Leave Group
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50/50 rounded-lg transition">
            <Trash2 className="w-5 h-5" />
            Delete Group
          </button>
        </>
      ) : (
        <button className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50/50 rounded-lg transition">
          <Ban className="w-5 h-5" />
          Block Contact
        </button>
      )}
    </div>
  );
};

export default ActionsSection;