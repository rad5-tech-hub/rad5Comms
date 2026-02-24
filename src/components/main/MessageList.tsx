/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// components/main/MessageList.tsx
import { useEffect, useRef } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import MessageBubble from './MessageBubble';
import { format } from 'date-fns';

interface MessageListProps {
  messages: any[] | null;
  isLoading: boolean;
  selectedChat: any;
  isTyping?: boolean;
}

const MessageList = ({ messages, isLoading, selectedChat, isTyping }: MessageListProps) => {
  // messages is now guaranteed to be [] even if parent passes undefined/null

  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, selectedChat, isLoading]);

  useEffect(() => {
    if (!containerRef.current || !bottomRef.current || !selectedChat) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          const ev = new CustomEvent('chat-read', {
            detail: { chatId: selectedChat.id, type: selectedChat.type },
          });
          window.dispatchEvent(ev);
        }
      },
      { root: containerRef.current, threshold: 1.0 }
    );
    observer.observe(bottomRef.current);
    return () => observer.disconnect();
  }, [selectedChat, messages, isLoading]);

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-scroll px-6 py-4 space-y-6 scroll">
        {Array.from({ length: 12 }).map((_, i) => {
          const isOwn = i % 5 === 4;
          return (
            <div
              key={i}
              className={`flex items-start gap-3 ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              {!isOwn && (
                <Skeleton circle width={40} height={40} className="mt-1 shrink-0" baseColor="#1f2937" highlightColor="#4b5563" />
              )}
              <div className={`max-w-[85%] ${isOwn ? 'items-end' : 'items-start'}`}>
                {!isOwn && <Skeleton width={140} height={14} className="mb-1" baseColor="#1f2937" highlightColor="#4b5563" />}
                <Skeleton
                  height={i % 6 === 0 ? 100 : i % 6 === 1 ? 80 : 60}
                  borderRadius={16}
                  className={`rounded-2xl w-full ${isOwn ? 'rounded-br-none' : 'rounded-bl-none border border-slate-200 shadow-sm'}`}
                  baseColor="#1f2937"
                  highlightColor="#4b5563"
                />
                <Skeleton width={70} height={14} className="mt-1 opacity-70" baseColor="#1f2937" highlightColor="#4b5563" />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Safe: messages is always array now
  if (!messages || messages.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
        <div className="text-5xl font-bold opacity-20 mb-4">No messages yet</div>
        <p className="text-lg opacity-70">Start the conversation!</p>
        <p className="text-sm mt-2 opacity-50">
          Send a message to begin chatting in this {selectedChat?.type === 'channel' ? 'channel' : 'chat'}
        </p>
      </div>
    );
  }

  // Sort and group messages by calendar day
  const groupedMessages: { date: string; messages: any[] }[] = [];
  let currentKey: string | null = null;

  const sortedMessages = [...(messages || [])].sort((a, b) => {
    const aTime = new Date(a.time).getTime();
    const bTime = new Date(b.time).getTime();
    if (aTime !== bTime) return aTime - bTime;
    const aId = String(a.id);
    const bId = String(b.id);
    return aId.localeCompare(bId);
  });

  sortedMessages.forEach((msg) => {
    let msgDate: Date;

    try {
      msgDate = new Date(msg.time);
      if (isNaN(msgDate.getTime())) {
        console.warn(`Invalid date in message #${msg.id}:`, msg.time);
        msgDate = new Date(); // fallback
      }
    } catch {
      msgDate = new Date();
    }

    const localMidnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const msgDay = localMidnight(msgDate);
    const todayDay = localMidnight(new Date());
    const diffDays = Math.round((todayDay.getTime() - msgDay.getTime()) / 86400000);

    const key = `${msgDay.getFullYear()}-${msgDay.getMonth() + 1}-${msgDay.getDate()}`;

    let dateLabel = '';
    if (diffDays === 0) {
      dateLabel = 'Today';
    } else if (diffDays === 1) {
      dateLabel = 'Yesterday';
    } else {
      dateLabel = format(msgDay, 'EEE, MMM d');
    }

    if (key !== currentKey) {
      groupedMessages.push({ date: dateLabel, messages: [] });
      currentKey = key;
    }

    groupedMessages[groupedMessages.length - 1].messages.push(msg);
  });

  return (
    <div ref={containerRef} className="flex-1 overflow-y-scroll px-6 py-4 space-y-8 scroll">
      {groupedMessages.map((group, groupIndex) => (
        <div key={groupIndex}>
          <div className="flex justify-center my-6">
            <span className="bg-gray-200 text-gray-600 text-xs font-medium px-4 py-1.5 rounded-full shadow-sm">
              {group.date}
            </span>
          </div>

          {group.messages.map((msg) =>
            msg.type === 'system' ? (
              <div key={msg.id} className="flex justify-center my-2">
                <span className="bg-gray-200 text-gray-600 text-xs font-medium px-4 py-1 rounded-full shadow-sm">
                  {msg.text}
                </span>
              </div>
            ) : (
              <div id={`msg-${msg.id}`} key={msg.id}>
                <MessageBubble
                  message={msg}
                  showSenderName={selectedChat?.type === 'channel'}
                  onDelete={(_msgId) => {}}
                  onEdit={(_msgId, _newText) => {}}
                  onReply={(message) => {
                    const ev = new CustomEvent('start-reply', { detail: { message } });
                    window.dispatchEvent(ev);
                  }}
                  onForward={(message) => {
                    const ev = new CustomEvent('start-forward', { detail: { message } });
                    window.dispatchEvent(ev);
                  }}
                  onScrollToMessage={(targetId) => {
                    const el = containerRef.current?.querySelector(`#msg-${targetId}`) as HTMLElement | null;
                    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                />
              </div>
            )
          )}
        </div>
      ))}
      {isTyping && (
        <div className="flex justify-start px-2">
          <span className="text-xs text-text-secondary italic">Typing...</span>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;
