/* eslint-disable @typescript-eslint/no-explicit-any */
// components/main/MessageBubble.tsx
import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import {
  MoreVertical,
  Reply,
  Forward,
  Copy,
  Pencil,
  Trash2,
  SmilePlus,
} from "lucide-react";
import { Check, CheckCheck } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import axios from "axios";
import { toast } from "sonner";

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
    mediaUrl?: string; // Added mediaUrl
    duration?: string;
    replyTo?: string;
    replyToText?: string;
    replyToSender?: string;
    reactions?: Array<{ emoji: string; count: number }>;
    status?: 'sent' | 'delivered' | 'read';
  };
  onDelete?: (messageId: string) => void;
  onEdit?: (messageId: string, newText: string) => void;
  onReply?: (message: any) => void;
  onForward?: (message: any) => void;
  onScrollToMessage?: (targetId: string) => void;
  showSenderName?: boolean;
  channelId?: string;
  /** Relay reaction via the correct socket hook (channel or DM) */
  relayReaction?: (messageId: string, emoji: string, action: 'add' | 'remove') => void;
}

const MessageBubble = ({
  message,
  onDelete,
  onEdit,
  onReply,
  onForward,
  onScrollToMessage,
  showSenderName = false,
  relayReaction,
}: MessageBubbleProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const [showConfirm, setShowConfirm] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
      if (
        emojiRef.current &&
        !emojiRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleReact = async (emojiData: any) => {
    if (!emojiData?.emoji) return;

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_BASE_URL}/messages/${message.id}/reactions`,
        { emoji: emojiData.emoji },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setShowEmojiPicker(false);

      // Relay via socket hook (works for both channel & DM)
      if (relayReaction) {
        relayReaction(message.id, emojiData.emoji, 'add');
      }

      // Also dispatch local event for immediate UI update
      const ev = new CustomEvent("reaction-update", {
        detail: {
          messageId: message.id,
          emoji: emojiData.emoji,
          action: "added" as const,
        },
      });
      window.dispatchEvent(ev);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to add reaction");
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/messages/${message.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      onDelete?.(message.id);
      toast.success("Message deleted");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete message");
    }
  };

  const handleEdit = async () => {
    if (editText.trim() === message.text.trim()) {
      setIsEditing(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_BASE_URL}/messages/${message.id}`,
        { text: editText.trim() },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      onEdit?.(message.id, editText.trim());
      setIsEditing(false);
      toast.success("Message updated");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to edit message");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    toast.success("Copied to clipboard");
    setShowMenu(false);
  };

  let displayTime = "—";
  if (message.time) {
    const timestamp = new Date(message.time);
    if (!isNaN(timestamp.getTime())) {
      displayTime = format(timestamp, "HH:mm");
    }
  }

  const isEmojiOnly = (text: string) => {
    const t = text.trim();
    if (!t) return false;
    const re =
      /^(?:\p{Extended_Pictographic}(?:\uFE0F)?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F)?)*\s?)+$/u;
    return re.test(t);
  };
  const emojiOnly = isEmojiOnly(message.text);

  return (
    <div
      className={`relative flex items-start gap-3 group ${message.isOwn ? "justify-end" : "justify-start"}`}
    >
      {!message.isOwn && !emojiOnly && message.sender?.avatar && (
        <img
          src={message.sender.avatar}
          alt={message.sender.name}
          className="w-8 h-8 rounded-full object-cover shrink-0 mt-1"
        />
      )}

      <div
        className={`max-w-[70%] ${message.isOwn ? "items-end" : "items-start"}`}
      >
        {!message.isOwn && showSenderName && (
          <div className="text-xs text-text-secondary mb-1">
            {message.sender?.name}
          </div>
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
            className={`relative ${
              emojiOnly
                ? "flex w-full justify-center"
                : `px-2.5 py-1.5 rounded-2xl text-sm leading-relaxed group-hover:bg-opacity-90 transition ${
                    message.isOwn
                      ? "bg-blue text-white rounded-br-none"
                      : "bg-white border border-border text-text-primary rounded-bl-none shadow-sm"
                  }`
            }`}
          >
            {message.replyTo && (
              <button
                onClick={() => onScrollToMessage?.(message.replyTo!)}
                className={`block w-full text-left rounded-xl px-3 py-2 mb-2 text-xs ${
                  message.isOwn
                    ? "bg-white/10 text-white"
                    : "bg-gray-100 text-gray-700"
                } cursor-pointer`}
              >
                <span className="font-semibold">
                  {message.replyToSender || "Replied to"}
                </span>
                <span className="opacity-80">
                  {" "}
                  — {message.replyToText || "message"}
                </span>
              </button>
            )}

            {/* Image Rendering */}
            {message.hasImage && (message.mediaUrl || message.text) && (
              <div className="mb-2 overflow-hidden rounded-lg">
                <img
                  src={message.mediaUrl || message.text} // Fallback to text if it contains URL
                  alt="Sent image"
                  className="max-w-full sm:max-w-70 h-auto object-cover rounded-lg hover:opacity-95 transition cursor-pointer"
                  onClick={() => window.open(message.mediaUrl || message.text, "_blank")}
                />
              </div>
            )}

            {/* Audio Rendering */}
            {message.hasAudio && (message.mediaUrl || message.text) && (
              <div className="mb-2 min-w-50">
                <audio controls src={message.mediaUrl || message.text} className="w-full h-10 rounded-full" />
              </div>
            )}

            {emojiOnly ? (
              <span
                className={`text-6xl leading-none ${
                  message.isOwn ? "text-white" : "text-text-primary"
                }`}
              >
                {message.text !== 'Voice Note' && message.text !== 'Image' ? message.text : ''}
              </span>
            ) : (
              // Only show text if it's not just the fallback "Image" or "Voice Note" text
              (message.text && message.text !== 'Image' && message.text !== 'Voice Note') && <span>{message.text}</span>
            )}

            {/* Three-dot menu */}
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={`absolute top-1 ${
                message.isOwn ? "right-1" : "right-1"
              } opacity-0 group-hover:opacity-100 transition p-1 rounded-full hover:bg-black/70 cursor-pointer text-white`}
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Timestamp + Status ticks */}
        <div className="text-xs text-text-secondary mt-1 opacity-70 flex items-center gap-1">
          <span>{displayTime}</span>
          {message.isOwn && (
            <>
              {message.status === 'read' ? (
                <CheckCheck className="w-3 h-3 text-blue" />
              ) : message.status === 'delivered' ? (
                <CheckCheck className="w-3 h-3 text-gray-500" />
              ) : (
                <Check className="w-3 h-3 text-gray-500" />
              )}
            </>
          )}
        </div>

        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {message.reactions.map((r) => (
              <span
                key={r.emoji}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                  message.isOwn
                    ? "bg-white/20 text-white"
                    : "bg-gray-200 text-gray-800"
                }`}
              >
                <span>{r.emoji}</span>
                <span>{r.count}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions Dropdown */}
      {showMenu && (
        <div
          ref={menuRef}
          className={`absolute z-50 mt-2 w-36 bg-white rounded-lg shadow-xl border border-gray-200 p-1 ${
            message.isOwn ? "right-0" : "left-0"
          }`}
        >
          <button
            onClick={() => {
              setShowEmojiPicker(true);
              setShowMenu(false);
            }}
            className="cursor-pointer w-full text-left px-2 py-2 hover:bg-sidebar flex items-center gap-2 text-sm rounded-sm hover:text-white"
          >
            <SmilePlus className="w-4 h-4" />
            React
          </button>

          <button
            onClick={() => {
              onReply?.(message);
              setShowMenu(false);
            }}
            className="cursor-pointer w-full text-left px-2 py-2 hover:bg-sidebar flex items-center gap-2 text-sm rounded-sm hover:text-white"
          >
            <Reply className="w-4 h-4" />
            Reply
          </button>

          <button
            onClick={() => {
              onForward?.(message);
              setShowMenu(false);
            }}
            className="cursor-pointer w-full text-left px-2 py-2 hover:bg-sidebar flex items-center gap-2 text-sm rounded-sm hover:text-white"
          >
            <Forward className="w-4 h-4" />
            Forward
          </button>

          <button
            onClick={handleCopy}
            className="cursor-pointer w-full text-left px-2 py-2 hover:bg-sidebar flex items-center gap-2 text-sm rounded-sm hover:text-white"
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
                className="cursor-pointer w-full text-left px-2 py-2 hover:bg-sidebar flex items-center gap-2 text-sm hover:text-white rounded-sm"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </button>

              <button
                onClick={() => setShowConfirm(true)}
                className="cursor-pointer w-full text-left px-2 py-2 hover:bg-red-100 rounded-sm text-red-600 flex items-center gap-2 text-sm"
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
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowConfirm(false)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b">
              <div className="text-base font-semibold text-gray-900">Delete message?</div>
              <div className="text-sm text-gray-600 mt-1">This action cannot be undone.</div>
            </div>
            <div className="p-3 flex justify-end gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-3 py-1.5 cursor-pointer text-sm rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirm(false);
                  handleDelete();
                }}
                className="px-3 py-1.5 text-sm rounded cursor-pointer bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
