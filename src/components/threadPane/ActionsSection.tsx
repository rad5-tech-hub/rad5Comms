/* eslint-disable @typescript-eslint/no-explicit-any */
// components/thread-pane/ActionsSection.tsx
import { useState } from 'react';
import { Trash2, Ban } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '../common/ConfirmModal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


interface ActionsSectionProps {
  isGroup: boolean;
  chatId: string;
  onActionSuccess: () => void;
}

const ActionsSection = ({ isGroup, chatId, onActionSuccess }: ActionsSectionProps) => {
  const navigate = useNavigate();
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    action: async () => {},
  });

  const closeModal = () => setModalConfig((prev) => ({ ...prev, isOpen: false }));

  const handleClearChat = async () => {
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

  const openConfirmModal = (type: 'clear' | 'leave' | 'delete') => {
    const config = {
      clear: {
        title: 'Clear Chat History?',
        message: 'Are you sure you want to clear all messages in this chat? This action cannot be undone.',
        confirmText: 'Clear Chat',
        action: handleClearChat,
      },
      leave: {
        title: 'Leave Group?',
        message: 'Are you sure you want to leave this group? You will no longer receive messages from this conversation.',
        confirmText: 'Leave Group',
        action: handleLeaveGroup,
      },
      delete: {
        title: 'Delete Group?',
        message: 'Are you sure you want to delete this group? This will remove all members and delete all message history permanently.',
        confirmText: 'Delete Group',
        action: handleDeleteGroup,
      },
    }[type];

    setModalConfig({
      isOpen: true,
      ...config,
    });
  };

  return (
    <>
      <div className="space-y-2 border-t border-border pt-6">
        {!isGroup ? (
          <button 
            onClick={() => openConfirmModal('clear')} 
            className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:text-red-600 hover:bg-gray-800 cursor-pointer rounded-lg transition"
          >
              <Trash2 className="w-5 h-5" />
              Clear Chat
            </button>
        ) : (
          <>
            <button 
              onClick={() => openConfirmModal('leave')}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:text-red-600 hover:bg-gray-800 cursor-pointer rounded-lg transition"
            >
              <Ban className="w-5 h-5" />
              Leave Group
            </button>
            <button 
              onClick={() => openConfirmModal('delete')}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:text-red-600 hover:bg-gray-800 cursor-pointer rounded-lg transition"
            >
              <Trash2 className="w-5 h-5" />
              Delete Group
            </button>
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        onConfirm={modalConfig.action}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        isDestructive={true}
      />
    </>
  );
};

export default ActionsSection;
