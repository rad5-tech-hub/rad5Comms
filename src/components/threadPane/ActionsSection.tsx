/* eslint-disable @typescript-eslint/no-explicit-any */
// components/thread-pane/ActionsSection.tsx
import { Trash2, Ban } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


interface ActionsSectionProps {
  isGroup: boolean;
  chatId: string;
  onActionSuccess: () => void;
}

const ActionsSection = ({ isGroup, chatId, onActionSuccess }: ActionsSectionProps) => {
  const navigate = useNavigate();
  const handleClearChat = async () => {
    if (!window.confirm('Are you sure you want to clear all messages in this chat? This cannot be undone.')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/dms/${chatId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Chat cleared');
      onActionSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to clear chat');
    }
  };

  const handleLeaveGroup = async () => {
     if (!window.confirm('Are you sure you want to leave this group?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/channels/${chatId}/leave`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('You have left the group');
      onActionSuccess();
      navigate('/home');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to leave group');
    }
  };

  const handleDeleteGroup = async () => {
     if (!window.confirm('Are you sure you want to delete this group? This will remove all members and delete all messages permanently.')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/channels/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Group deleted');
      onActionSuccess();
      navigate('/home');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete group');
    }
  };
  return (
    <div className="space-y-2 border-t border-border pt-6">
       {!isGroup ? (
         <button onClick={handleClearChat} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-white/70 rounded-lg transition">
            <Trash2 className="w-5 h-5" />
            Clear Chat
          </button>
      ) : (
        <>
          <button onClick={handleLeaveGroup} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-white/70 rounded-lg transition">
            <Ban className="w-5 h-5" />
            Leave Group
          </button>
          <button onClick={handleDeleteGroup} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-white/70 rounded-lg transition">
            <Trash2 className="w-5 h-5" />
            Delete Group
          </button>
        </>
      )}
    </div>
  );
};

export default ActionsSection;
