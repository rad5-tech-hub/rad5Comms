// components/aside/AsideTabs.tsx
import { MessageSquare, Archive, Star } from 'lucide-react';
import Skeleton from 'react-loading-skeleton';

interface AsideTabsProps {
  activeTab: 'all' | 'archived' | 'starred';
  setActiveTab: (tab: 'all' | 'archived' | 'starred') => void;
  isLoading: boolean;
}

const AsideTabs = ({ activeTab, setActiveTab, isLoading }: AsideTabsProps) => {
  return (
    <div className="flex border-b border-white/10 mt-2 px-4">
      {isLoading ? (
        Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex-1 py-2">
            <Skeleton height={20} width="60%" className="mx-auto" baseColor="#1e40af" highlightColor="#3b82f6" />
          </div>
        ))
      ) : (
        <>
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 cursor-pointer text-xs font-medium transition-colors ${
              activeTab === 'all' ? 'text-white border-b-2 border-blue' : 'text-sidebar-text/70 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            All
          </button>
          <button
            onClick={() => setActiveTab('archived')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 cursor-pointer text-xs font-medium transition-colors ${
              activeTab === 'archived' ? 'text-white border-b-2 border-blue' : 'text-sidebar-text/70 hover:text-white'
            }`}
          >
            <Archive className="w-4 h-4" />
            Archived
          </button>
          <button
            onClick={() => setActiveTab('starred')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 cursor-pointer text-xs font-medium transition-colors ${
              activeTab === 'starred' ? 'text-white border-b-2 border-blue' : 'text-sidebar-text/70 hover:text-white'
            }`}
          >
            <Star className="w-4 h-4" />
            Starred
          </button>
        </>
      )}
    </div>
  );
};

export default AsideTabs;