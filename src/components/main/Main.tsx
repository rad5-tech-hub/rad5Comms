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
import { useWebSocket } from '../../context/webSocketContext';
import { useChannel } from '../../hooks/useChannel';
import { useDm } from '../../hooks/useDm';
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
  mediaUrl?: string; // Added mediaUrl
  duration?: string;
  type?: 'system' | 'user';
  replyTo?: string;
  replyToText?: string;
  replyToSender?: string;
  reactions?: Array<{ emoji: string; count: number }>;
  status?: 'sent' | 'delivered' | 'read';
}

// Helper to apply a reaction update to message list
const applyReaction = (messages: Message[], messageId: string, emoji: string, action: string): Message[] =>
  messages.map((m) => {
    if (m.id !== messageId) return m;
    const existing = m.reactions || [];
    const idx = existing.findIndex((r) => r.emoji === emoji);
    if (action === 'added' || action === 'add') {
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
  });

const Main = ({ isThreadOpen, toggleThreadPane, onBack, selectedChat }: MainProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [replyTarget, setReplyTarget] = useState<Message | null>(null);
  const [forwardSource, setForwardSource] = useState<Message | null>(null);
  const { onlineUsers } = useWebSocket();
  const [isPeerTyping, setIsPeerTyping] = useState(false);

  // For DMs: the actual conversation ID resolved from the backend (≠ recipient user ID)
  const [resolvedDmId, setResolvedDmId] = useState<string | undefined>(undefined);

  // Determine which ID to pass into each hook
  const channelId = selectedChat?.type === 'channel' ? selectedChat.id : undefined;
  const dmId = selectedChat?.type === 'dm' ? resolvedDmId : undefined;

  // Shared event callbacks — server broadcasts these automatically on REST calls
  const sharedCallbacks = {
    onMessage: (msg: any) => setMessages((prev) => [...prev, msg]),
    onEdited: (messageId: string, text: string) =>
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, text } : m))),
    onDeleted: (messageId: string) =>
      setMessages((prev) => prev.filter((m) => m.id !== messageId)),
    onTyping: (_userId: string, isTyping: boolean) => setIsPeerTyping(isTyping),
    onStatusUpdate: (data: any) => {
      const { messageId, status } = data;
      if (messageId && status) {
        setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, status } : m)));
      }
    },
    onReaction: (data: any) => {
      const { messageId, emoji, action } = data;
      setMessages((prev) => applyReaction(prev, messageId, emoji, action));
    },
  };

  // Hooks: server broadcasts events; hooks only expose sendTyping + markRead
  const { sendTyping: channelSendTyping, markRead: channelMarkRead } =
    useChannel(channelId, sharedCallbacks);

  const { sendTyping: dmSendTyping, markRead: dmMarkRead } =
    useDm(dmId, sharedCallbacks);

  // Unified functions based on chat type
  const sendTyping = selectedChat?.type === 'channel' ? channelSendTyping : dmSendTyping;

  // Reset state when chat changes
  useEffect(() => {
    setIsPeerTyping(false);
    setResolvedDmId(undefined);
  }, [selectedChat?.id]);

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
          // DM: resolve the actual conversation ID (≠ recipient user ID)
          let conversationId: string | null = null;

          try {
            const createRes = await axios.post(
              `${API_BASE_URL}/dms/${selectedChat.id}`,
              {},
              { headers: { Authorization: `Bearer ${token}` } }
            );
            conversationId =
              createRes.data?.dm?.id ||
              createRes.data?.id ||
              createRes.data?.dmId ||
              null;
          } catch (createErr: any) {
            if (createErr.response?.status === 409 || createErr.response?.status === 400) {
              const errData = createErr.response?.data;
              conversationId =
                errData?.dm?.id || errData?.id || errData?.dmId || errData?.existingDmId || null;
            } else {
              throw createErr;
            }
          }

          // Fallback: try GET /dms/:recipientId
          if (!conversationId) {
            try {
              const getRes = await axios.get(
                `${API_BASE_URL}/dms/${selectedChat.id}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              conversationId =
                getRes.data?.dm?.id || getRes.data?.id || getRes.data?.dmId || null;
            } catch {
              // ignore
            }
          }

          chatId = conversationId || selectedChat.id;
          endpointBase = `/dms/${chatId}`;

          // console.log('[Main] resolved DM conversation ID:', chatId, '(recipient:', selectedChat.id, ')');
          setResolvedDmId(chatId);
        }

        // Fetch messages
        const response = await axios.get(`${API_BASE_URL}${endpointBase}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = response.data?.messages || response.data || [];
        const raw = Array.isArray(data) ? data : [];
        const idMap = new Map<string, any>(raw.map((m: any) => [String(m.id), m]));
        const normalized = raw.map((m: any) => {
          const rt = m.replyTo ?? m.reply_to ?? m.reply_id ?? m.parentMessageId ?? m.parent_id;
          if (rt) {
            const ref = idMap.get(String(rt));
            return {
              ...m,
              replyTo: String(rt),
              replyToText: m.replyToText ?? ref?.text ?? m.reply_to_text ?? null,
              replyToSender: m.replyToSender ?? ref?.sender?.name ?? m.reply_to_sender ?? null,
            };
          }
          return m;
        });
        // Merge any media metadata (from selectedChat.media) into messages
        const mediaList: any[] = (selectedChat as any)?.media || [];
        const mediaByMessage = new Map<string, any[]>();
        if (Array.isArray(mediaList)) {
          mediaList.forEach((m: any) => {
            const mid = m.messageId || m.message_id || m.id || m.msgId || m.message || null;
            if (mid) {
              const key = String(mid);
              if (!mediaByMessage.has(key)) mediaByMessage.set(key, []);
              mediaByMessage.get(key)!.push(m);
            }
          });
        }

        const merged = normalized.map((m: any) => {
          const list = mediaByMessage.get(String(m.id));
          if (list && list.length > 0) {
            const item = list[0];
            return {
              ...m,
              mediaUrl: item.url || item.uri || item.path || item.file || m.mediaUrl,
              hasImage: (item.type || '').startsWith('image') || m.hasImage,
              hasAudio: (item.type || '').startsWith('audio') || m.hasAudio,
              duration: item.duration || item.length || m.duration,
            };
          }

          // Fallback: if message text contains a direct URL, infer type
          if (!m.mediaUrl && typeof m.text === 'string') {
            const urlMatch = m.text.match(/(https?:\/\/\S+)/);
            if (urlMatch) {
              const url = urlMatch[0];
              const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i.test(url);
              const isAudio = /\.(mp3|wav|ogg|m4a)(\?|$)/i.test(url);
              return { ...m, mediaUrl: url, hasImage: isImage, hasAudio: isAudio };
            }
          }

          return m;
        });

        setMessages(merged);

        // Mark all fetched messages as read
        const messageIds = merged.map((m: any) => m.id);
        if (messageIds.length > 0) {
          if (selectedChat.type === 'channel') {
            channelMarkRead(messageIds);
          } else {
            dmMarkRead(messageIds);
          }
        }
      } catch (err: any) {
        console.error('Chat init/fetch error:', err);
        const msg = err.response?.data?.error || 'Failed to load or initialize chat';
        toast.error(msg);

        if (err.response?.status === 404) {
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

  // Local reaction handler (from MessageBubble custom events)
  useEffect(() => {
    const onLocalReaction = (e: Event) => {
      const ce = e as CustomEvent<{ messageId: string; emoji: string; action: 'added' | 'removed' }>;
      const { messageId, emoji, action } = ce.detail;
      setMessages((prev) => applyReaction(prev, messageId, emoji, action));
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
              sendTyping={sendTyping}
            />
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
