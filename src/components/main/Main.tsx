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
import { useWebSocket } from '../../context/ws';
import ForwardModal from './ForwardModal';

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
  type?: 'system' | 'user';
  replyTo?: string;
  replyToText?: string;
  replyToSender?: string;
  reactions?: Array<{ emoji: string; count: number }>;
  status?: 'sent' | 'delivered' | 'read';
}

const Main = ({ isThreadOpen, toggleThreadPane, onBack, selectedChat }: MainProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [replyTarget, setReplyTarget] = useState<Message | null>(null);
  const [forwardSource, setForwardSource] = useState<Message | null>(null);
  const { socket, onlineUsers } = useWebSocket();
  const [isPeerTyping, setIsPeerTyping] = useState(false);

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
              `${API_BASE_URL}/dms/${selectedChat.id}`,
              {}, // empty body or { name: selectedChat.name } if needed
              { headers: { Authorization: `Bearer ${token}` } }
            );

            // If backend returns the chat object with ID (or just 201)
            chatId = createRes.data?.id || selectedChat.id;
            endpointBase = `/dms/${chatId}`;
          } catch (createErr: any) {
            if (createErr.response?.status !== 409 && createErr.response?.status !== 400) {
              // 409 = already exists (common), ignore
              throw createErr;
            }
            // Already exists → proceed with original ID
            endpointBase = `/dms/${selectedChat.id}`;
          }
        }

        // Step 2: Fetch messages
        const response = await axios.get(`${API_BASE_URL}${endpointBase}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = response.data?.messages || response.data || [];
        const raw = Array.isArray(data) ? data : [];
        const idMap = new Map<string, any>(raw.map((m: any) => [String(m.id), m]));
        const normalized = raw.map((m: any) => {
          const rt =
            m.replyTo ??
            m.reply_to ??
            m.reply_id ??
            m.parentMessageId ??
            m.parent_id;
          if (rt) {
            const ref = idMap.get(String(rt));
            return {
              ...m,
              replyTo: String(rt),
              replyToText: m.replyToText ?? ref?.text ?? m.reply_to_text ?? null,
              replyToSender:
                m.replyToSender ?? ref?.sender?.name ?? m.reply_to_sender ?? null,
            };
          }
          return m;
        });
        setMessages(normalized);

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

  useEffect(() => {
    const onStartReply = (e: Event) => {
      const ce = e as CustomEvent<{ message: Message }>;
      setReplyTarget(ce.detail.message);
    };
    const onStartForward = (e: Event) => {
      const ce = e as CustomEvent<{ message: Message }>;
      setForwardSource(ce.detail.message);
      // open modal here (to be implemented)
    };
    window.addEventListener('start-reply', onStartReply as EventListener);
    window.addEventListener('start-forward', onStartForward as EventListener);
    return () => {
      window.removeEventListener('start-reply', onStartReply as EventListener);
      window.removeEventListener('start-forward', onStartForward as EventListener);
    };
  }, []);
  useEffect(() => {
    const onMemberAdded = (e: Event) => {
      const ce = e as CustomEvent<{
        channelId: string;
        addedUser: { id: string; name: string };
        addedBy: { name: string };
      }>;
      if (!selectedChat || selectedChat.type !== 'channel') return;
      if (selectedChat.id !== ce.detail.channelId) return;
      const sysMessage: Message = {
        id: `sys-${Date.now()}`,
        sender: { id: 'system', name: 'System' },
        text: `${ce.detail.addedBy.name} added ${ce.detail.addedUser.name}`,
        time: new Date().toISOString(),
        isOwn: false,
        type: 'system',
      };
      setMessages((prev) => [...prev, sysMessage]);
    };
    window.addEventListener('member-added', onMemberAdded as EventListener);
    return () => window.removeEventListener('member-added', onMemberAdded as EventListener);
  }, [selectedChat?.id, selectedChat?.type, selectedChat]);

  const handleMessageSent = (newMessage: Message) => {
    setMessages((prev) => [...prev, newMessage]);
    setReplyTarget(null);
  };

  useEffect(() => {
    if (!socket || !selectedChat || selectedChat.type !== 'channel') return;
    const channelId = selectedChat.id;
    socket.emit('join_channel', { channelId });

    const onNewMessage = (data: any) => {
      if (data?.channelId !== channelId) return;
      const incoming = data.message;
      if (!incoming) return;
      setMessages((prev) => [...prev, incoming]);
    };
    const onTyping = (data: any) => {
      if (data?.channelId !== channelId) return;
      setIsPeerTyping(Boolean(data.isTyping));
    };
    const onMessageEdited = (data: any) => {
      if (data?.channelId !== channelId) return;
      setMessages((prev) =>
        prev.map((m) => (m.id === data.messageId ? { ...m, text: data.text } as Message : m))
      );
    };
    const onMessageDeleted = (data: any) => {
      if (data?.channelId !== channelId) return;
      setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
    };
    const onMessageDelivered = (data: any) => {
      if (data?.channelId !== channelId) return;
      const { messageId } = data;
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, status: 'delivered' } : m))
      );
    };
    const onMessageRead = (data: any) => {
      if (data?.channelId !== channelId) return;
      const { messageId } = data;
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, status: 'read' } : m))
      );
    };

    const onReactionUpdate = (data: any) => {
      if (data?.channelId !== channelId) return;
      const { messageId, emoji, action } = data;
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          const existing = m.reactions || [];
          const idx = existing.findIndex((r) => r.emoji === emoji);
          if (action === 'added') {
            if (idx >= 0) {
              const next = [...existing];
              next[idx] = { emoji, count: next[idx].count + 1 };
              return { ...m, reactions: next };
            }
            return { ...m, reactions: [...existing, { emoji, count: 1 }] };
          } else {
            if (idx >= 0) {
              const next = [...existing];
              const newCount = next[idx].count - 1;
              if (newCount <= 0) {
                next.splice(idx, 1);
              } else {
                next[idx] = { emoji, count: newCount };
              }
              return { ...m, reactions: next };
            }
            return m;
          }
        })
      );
    };

    socket.on('new_message', onNewMessage);
    socket.on('typing', onTyping);
    socket.on('message_edited', onMessageEdited);
    socket.on('message_deleted', onMessageDeleted);
    socket.on('reaction_update', onReactionUpdate);
    socket.on('message_delivered', onMessageDelivered);
    socket.on('message_read', onMessageRead);

    return () => {
      socket.emit('leave_channel', { channelId });
      socket.off('new_message', onNewMessage);
      socket.off('typing', onTyping);
      socket.off('message_edited', onMessageEdited);
      socket.off('message_deleted', onMessageDeleted);
        socket.off('reaction_update', onReactionUpdate);
      socket.off('message_delivered', onMessageDelivered);
      socket.off('message_read', onMessageRead);
    };
  }, [socket, selectedChat]);

  useEffect(() => {
    const onLocalReaction = (e: Event) => {
      const ce = e as CustomEvent<{ messageId: string; emoji: string; action: 'added' | 'removed' }>;
      const { messageId, emoji, action } = ce.detail;
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          const existing = m.reactions || [];
          const idx = existing.findIndex((r) => r.emoji === emoji);
          if (action === 'added') {
            if (idx >= 0) {
              const next = [...existing];
              next[idx] = { emoji, count: next[idx].count + 1 };
              return { ...m, reactions: next };
            }
            return { ...m, reactions: [...existing, { emoji, count: 1 }] };
          } else {
            if (idx >= 0) {
              const next = [...existing];
              const newCount = next[idx].count - 1;
              if (newCount <= 0) {
                next.splice(idx, 1);
              } else {
                next[idx] = { emoji, count: newCount };
              }
              return { ...m, reactions: next };
            }
            return m;
          }
        })
      );
    };
    window.addEventListener('reaction-update', onLocalReaction as EventListener);
    return () => window.removeEventListener('reaction-update', onLocalReaction as EventListener);
  }, []);

  return (
    <div className="h-screen flex-1 flex flex-col bg-offwhite font-poppins">
      <ChatHeader
        selectedChat={selectedChat}
        isThreadOpen={isThreadOpen}
        toggleThreadPane={toggleThreadPane}
        onBack={onBack}
        onSettingsOpen={() => setIsSettingsOpen(true)}
        isOnline={selectedChat?.type === 'dm' ? onlineUsers.includes(String(selectedChat.id)) : undefined}
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
              isTyping={isPeerTyping}
            />
            <MessageInput
              selectedChat={selectedChat}
              onMessageSent={handleMessageSent}
              replyTarget={replyTarget}
              onCancelReply={() => setReplyTarget(null)}
            />
            {/* <MessageInput selectedChat={selectedChat} onMessageSent={handleMessageSent} /> */}
          </>
        )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      <ForwardModal
        isOpen={Boolean(forwardSource)}
        onClose={() => setForwardSource(null)}
        sourceMessage={forwardSource ? { id: forwardSource.id, text: forwardSource.text } : null}
      />
    </div>
    </div>
  );
};

export default Main;
