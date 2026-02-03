/* eslint-disable @typescript-eslint/no-explicit-any */
// components/main/Main.tsx
import { useState, useEffect } from 'react';
import '../../App.css';
import axios from 'axios';
import { toast } from 'sonner';
import ChatHeader from './ChatHeader';
import ChatPlaceholder from './ChatPlaceholder';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import SettingsModal from '../../pages/Settings';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface MainProps {
  isThreadOpen: boolean;
  toggleThreadPane: () => void;
  onBack?: () => void;
  selectedChat: { id: string; type: 'channel' | 'dm'; name?: string } | null;
}

interface Message {
  id: string;
  sender: { id: string; name: string; avatar?: string };
  text: string;
  time: string;
  isOwn: boolean;
  hasImage?: boolean;
  hasAudio?: boolean;
  duration?: string;
}

const Main = ({ isThreadOpen, toggleThreadPane, onBack, selectedChat }: MainProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Fetch messages
  useEffect(() => {
  if (!selectedChat) {
    setMessages([]);
    setIsLoadingMessages(false);
    return;
  }

  const initAndFetchMessages = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please log in');
      return;
    }

    setIsLoadingMessages(true);

    try {
      let chatId = selectedChat.id;
      let endpointBase = '';

      if (selectedChat.type === 'channel') {
        endpointBase = `/channels/${chatId}`;
      } else {
        // DM: ensure personal chat exists
        try {
          // Step 1: Try to create/init personal chat (idempotent or returns existing)
          const createRes = await axios.post(
            `${API_BASE_URL}/channels/personal/${selectedChat.id}`,
            {}, // empty body or { name: selectedChat.name } if needed
            { headers: { Authorization: `Bearer ${token}` } }
          );

          // If backend returns the chat object with ID (or just 201)
          chatId = createRes.data?.id || selectedChat.id;
          endpointBase = `/channels/personal/${chatId}`;
        } catch (createErr: any) {
          if (createErr.response?.status !== 409 && createErr.response?.status !== 400) {
            // 409 = already exists (common), ignore
            throw createErr;
          }
          // Already exists → proceed with original ID
          endpointBase = `/channels/personal/${selectedChat.id}`;
        }
      }

      // Step 2: Fetch messages
      const response = await axios.get(`${API_BASE_URL}${endpointBase}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = response.data?.messages || response.data || [];
      setMessages(Array.isArray(data) ? data : []);

    } catch (err: any) {
      console.error('DM init/fetch error:', err);
      const msg = err.response?.data?.error || 'Failed to load or initialize chat';
      toast.error(msg);

      if (err.response?.status === 404) {
        // If backend still says not found after create attempt
        setMessages([]);
      }
    } finally {
      setIsLoadingMessages(false);
    }
  };

  initAndFetchMessages();
}, [selectedChat]);

  const handleMessageSent = (newMessage: Message) => {
    setMessages((prev) => [...prev, newMessage]);
  };

  return (
    <div className="h-screen flex-1 flex flex-col bg-offwhite font-poppins">
      <ChatHeader
        selectedChat={selectedChat}
        isThreadOpen={isThreadOpen}
        toggleThreadPane={toggleThreadPane}
        onBack={onBack}
        onSettingsOpen={() => setIsSettingsOpen(true)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {!selectedChat ? (
          <ChatPlaceholder />
        ) : (
          <>
            <MessageList
              messages={messages}
              isLoading={isLoadingMessages}
              selectedChat={selectedChat}
            />

            <MessageInput selectedChat={selectedChat} onMessageSent={handleMessageSent} />
          </>
        )}
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default Main;