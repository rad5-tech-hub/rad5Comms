/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// components/main/MessageList.tsx
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import MessageBubble from './MessageBubble';
import { format, isToday, isYesterday, differenceInCalendarDays } from 'date-fns';

interface MessageListProps {
  messages?: any[] | null;          // Allow undefined / null
  isLoading: boolean;
  selectedChat: any;
}

const MessageList = ({ messages = [], isLoading, selectedChat }: MessageListProps) => {
  // messages is now guaranteed to be [] even if parent passes undefined/null

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
  if (messages.length === 0) {
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

  // Group messages by date (safe version)
  const groupedMessages: { date: string; messages: any[] }[] = [];
  let currentDate: string | null = null;

  messages.forEach((msg) => {
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

    let dateLabel: string;

    if (isToday(msgDate)) {
      dateLabel = 'Today';
    } else if (isYesterday(msgDate)) {
      dateLabel = 'Yesterday';
    } else {
      const daysDiff = differenceInCalendarDays(new Date(), msgDate);
      if (daysDiff <= 6) {
        dateLabel = format(msgDate, 'EEEE');
      } else {
        dateLabel = format(msgDate, 'MMM d, yyyy');
      }
    }

    if (dateLabel !== currentDate) {
      groupedMessages.push({ date: dateLabel, messages: [] });
      currentDate = dateLabel;
    }

    groupedMessages[groupedMessages.length - 1].messages.push(msg);
  });

  return (
    <div className="flex-1 overflow-y-scroll px-6 py-4 space-y-8 scroll">
      {groupedMessages.map((group, groupIndex) => (
        <div key={groupIndex}>
          <div className="flex justify-center my-6">
            <span className="bg-gray-200 text-gray-600 text-xs font-medium px-4 py-1.5 rounded-full shadow-sm">
              {group.date}
            </span>
          </div>

          {group.messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onDelete={(msgId) => {
                // This callback is defined in parent — safe
              }}
              onEdit={(msgId, newText) => {
                // This callback is defined in parent — safe
              }}
              onReply={(msg) => console.log('Reply to:', msg)}
              onForward={(msg) => console.log('Forward:', msg)}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default MessageList;