// components/thread-pane/MemberItem.tsx
import { MoreVertical } from 'lucide-react';

interface MemberItemProps {
  member: { id: string; name: string; avatar?: string; role?: string };
  isAdmin: boolean;
}

const MemberItem = ({ member, isAdmin }: MemberItemProps) => {
  return (
    <div className="flex items-center justify-between py-2 px-3 hover:bg-white/5 rounded-lg group">
      <div className="flex items-center gap-3">
        {member.avatar ? (
          <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-600 font-medium">
            {member.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <p className="font-medium text-text-primary">{member.name}</p>
          {member.role && <p className="text-xs text-text-secondary">{member.role}</p>}
        </div>
      </div>

      {isAdmin && (
        <button className="opacity-0 group-hover:opacity-100 transition p-2 rounded-full hover:bg-white/10">
          <MoreVertical className="w-4 h-4 text-text-secondary" />
        </button>
      )}
    </div>
  );
};

export default MemberItem;