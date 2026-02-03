/* eslint-disable @typescript-eslint/no-explicit-any */
// components/main/MessageBubble.tsx
import { useState, useRef, useEffect } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import {
  MoreVertical,
  Reply,
  Forward,
  Copy,
  Pencil,
  Trash2,
  SmilePlus,
} from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import axios from 'axios';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface MessageBubbleProps {
  message: {
    id: string;
    sender: { id: string; name: string; avatar?: string };
    text: string;
    time: string;
    isOwn: boolean;
    hasImage?: boolean;
    hasAudio?: boolean;
    duration?: string;
  };
  onDelete?: (messageId: string) => void;     // callback to remove from list
  onEdit?: (messageId: string, newText: string) => void; // callback to update list
  onReply?: (message: any) => void;           // optional reply feature
  onForward?: (message: any) => void;         // optional forward feature
}

const MessageBubble = ({
  message,
  onDelete,
  onEdit,
  onReply,
  onForward,
}: MessageBubbleProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);

  const menuRef = useRef<HTMLDivElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
      if (emojiRef.current && !emojiRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleReact = async (emojiData: any) => {
    if (!emojiData?.emoji) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/messages/${message.id}/reactions`,
        { emoji: emojiData.emoji },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Reaction added!');
      setShowEmojiPicker(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to add reaction');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this message?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/messages/${message.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      onDelete?.(message.id);
      toast.success('Message deleted');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete message');
    }
  };

  const handleEdit = async () => {
    if (editText.trim() === message.text.trim()) {
      setIsEditing(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}/messages/${message.id}`,
        { text: editText.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      onEdit?.(message.id, editText.trim());
      setIsEditing(false);
      toast.success('Message updated');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to edit message');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    toast.success('Copied to clipboard');
    setShowMenu(false);
  };

  // Friendly timestamp
  let displayTime = '—';
  if (message.time) {
    const timestamp = new Date(message.time);
    if (!isNaN(timestamp.getTime())) {
      if (isToday(timestamp)) {
        displayTime = format(timestamp, 'HH:mm');
      } else if (isYesterday(timestamp)) {
        displayTime = `Yesterday ${format(timestamp, 'HH:mm')}`;
      } else {
        displayTime = format(timestamp, 'MMM d, HH:mm');
      }
    }
  }

  return (
    <div
      className={`relative flex items-start gap-3 group ${message.isOwn ? 'justify-end' : 'justify-start'}`}
    >
      {!message.isOwn && message.sender?.avatar && (
        <img
          src={message.sender.avatar}
          alt={message.sender.name}
          className="w-8 h-8 rounded-full object-cover shrink-0 mt-1"
        />
      )}

      <div className={`max-w-[70%] ${message.isOwn ? 'items-end' : 'items-start'}`}>
        {!message.isOwn && (
          <div className="text-xs text-text-secondary mb-1">{message.sender?.name}</div>
        )}

        {isEditing ? (
          <div className="relative">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl text-sm border border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              rows={3}
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-1">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed relative group-hover:bg-opacity-90 transition ${
              message.isOwn
                ? 'bg-blue text-white rounded-br-none'
                : 'bg-white border border-border text-text-primary rounded-bl-none shadow-sm'
            }`}
          >
            {message.text}

            {/* Placeholder for attachments/audio */}
            {message.hasImage && <div className="mt-2 grid grid-cols-3 gap-2">...</div>}
            {message.hasAudio && <div className="mt-2">Audio placeholder</div>}

            {/* Three-dot menu */}
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={`absolute top-1 ${
                message.isOwn ? 'right-2' : 'left-2'
              } opacity-0 group-hover:opacity-100 transition p-1 rounded-full hover:bg-black/70 cursor-pointer text-white`}
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Timestamp */}
        <div className="text-xs text-text-secondary mt-1 opacity-70">
          {displayTime}
        </div>
      </div>

      {/* Actions Dropdown */}
      {showMenu && (
        <div
          ref={menuRef}
          className={`absolute z-50 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 ${
            message.isOwn ? 'right-0' : 'left-0'
          }`}
        >
          <button
            onClick={() => {
              setShowEmojiPicker(true);
              setShowMenu(false);
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm"
          >
            <SmilePlus className="w-4 h-4" />
            React
          </button>

          <button
            onClick={() => {
              onReply?.(message);
              setShowMenu(false);
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm"
          >
            <Reply className="w-4 h-4" />
            Reply
          </button>

          <button
            onClick={() => {
              onForward?.(message);
              setShowMenu(false);
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm"
          >
            <Forward className="w-4 h-4" />
            Forward
          </button>

          <button
            onClick={handleCopy}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm"
          >
            <Copy className="w-4 h-4" />
            Copy
          </button>

          {message.isOwn && (
            <>
              <button
                onClick={() => {
                  setIsEditing(true);
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </button>

              <button
                onClick={handleDelete}
                className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2 text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </>
          )}
        </div>
      )}

      {/* Emoji Picker for reactions */}
      {showEmojiPicker && (
        <div ref={emojiRef} className="absolute z-50 bottom-full mb-2">
          <EmojiPicker
            onEmojiClick={handleReact}
            width={280}
            height={350}
            previewConfig={{ showPreview: false }}
            lazyLoadEmojis={true}
          />
        </div>
      )}
    </div>
  );
};

export default MessageBubble;