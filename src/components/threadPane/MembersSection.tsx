// components/thread-pane/MembersSection.tsx
import { MoreVertical, Users } from 'lucide-react';
import MemberItem from './MemberItem';

interface MembersSectionProps {
  members: Array<{ id: string; name: string; avatar?: string; role?: string }>;
  isAdmin: boolean;
}

const MembersSection = ({ members, isAdmin }: MembersSectionProps) => {
  const displayedMembers = members.slice(0, 10);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-text-secondary flex items-center gap-2">
          <Users className="w-4 h-4" />
          Members ({members.length})
        </h4>
        <button className="text-blue hover:underline text-xs">See all</button>
      </div>

      <div className="space-y-3">
        {displayedMembers.map((member) => (
          <MemberItem key={member.id} member={member} isAdmin={isAdmin} />
        ))}
      </div>
    </div>
  );
};

export default MembersSection;