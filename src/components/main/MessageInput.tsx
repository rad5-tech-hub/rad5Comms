/* eslint-disable @typescript-eslint/no-explicit-any */
// components/main/MessageInput.tsx
import { useState, useRef, useEffect } from 'react';
import {
  Smile,
  Plus,
  Send,
  Paperclip,
  Mic,
  Image as ImageIcon,
  BarChart2,
  X,
  // StopCircle,
  // Trash2,
} from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useWebSocket } from '../../context/ws';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface MessageInputProps {
  selectedChat: { id: string; type: 'channel' | 'dm'; name?: string } | null;
  onMessageSent?: (newMessage: any) => void;
  replyTarget?: {
    id: string;
    text: string;
    sender: { id: string; name: string };
  } | null;
  onCancelReply?: () => void;
}

const MessageInput = ({ selectedChat, onMessageSent, replyTarget, onCancelReply }: MessageInputProps) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  // Media states
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerIntervalRef = useRef<number | null>(null);

  const { socket } = useWebSocket();
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pickerRef = useRef<HTMLDivElement>(null);
  const plusMenuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close pickers on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
      if (plusMenuRef.current && !plusMenuRef.current.contains(event.target as Node)) {
        setShowPlusMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Image Selection
  const handleShareImage = () => {
    fileInputRef.current?.click();
    setShowPlusMenu(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size should be less than 5MB');
        return;
      }
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const clearImage = (revoke = true) => {
    setSelectedImage(null);
    if (revoke && imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handle Audio Recording
  const handleVoiceNote = async () => {
    setShowPlusMenu(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      timerIntervalRef.current = window.setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Error accessing microphone:', err);
      toast.error('Could not access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  const cancelRecording = () => {
    stopRecording();
    setAudioBlob(null);
    setRecordingDuration(0);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Placeholder handlers
  const handleAttachFile = () => {
    toast.info('File attachment coming soon');
    setShowPlusMenu(false);
  };
  const handleCreatePoll = () => {
    toast.info('Polls coming soon');
    setShowPlusMenu(false);
  };

  const handleSend = async () => {
    if ((!message.trim() && !selectedImage && !audioBlob) || !selectedChat || isSending) return;

    setIsSending(true);

    // Optimistic UI update (basic)
    const tempId = Date.now().toString();
    const optimisticMessage = {
      id: tempId,
      sender: { id: 'me', name: 'You', avatar: null },
      text: message || (selectedImage ? 'Image' : 'Voice Note'),
      time: new Date().toISOString(),
      isOwn: true,
      hasImage: !!selectedImage,
      hasAudio: !!audioBlob,
      mediaUrl: imagePreview || (audioBlob ? URL.createObjectURL(audioBlob) : undefined),
      ...(replyTarget && {
        replyTo: replyTarget.id,
        replyToText: replyTarget.text,
        replyToSender: replyTarget.sender.name,
      }),
    };

    onMessageSent?.(optimisticMessage);
    
    // Clear inputs immediately for better UX
    const msgToSend = message;
    const imgToSend = selectedImage;
    const audioToSend = audioBlob;
    
    setMessage('');
    // Do NOT revoke the URL here, as it's being used by the optimistic message
    clearImage(false); 
    setAudioBlob(null);
    setRecordingDuration(0);
    if (onCancelReply) onCancelReply();

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token');

      let endpoint = '';
      if (selectedChat.type === 'channel') {
        endpoint = `/channels/${selectedChat.id}/messages`;
      } else {
        endpoint = `/dms/${selectedChat.id}/messages`; // DM endpoint
      }

      let payload: any;
      const headers: any = { Authorization: `Bearer ${token}` };

      if (imgToSend || audioToSend) {
        // Step 1: Upload media to /upload endpoint
        const formData = new FormData();
        
        if (imgToSend) {
          formData.append('file', imgToSend);
          formData.append('type', 'image');
        } else if (audioToSend) {
          formData.append('file', audioToSend, 'voicenote.webm');
          formData.append('type', 'audio');
          formData.append('duration', recordingDuration.toString());
        }

        try {
          const uploadRes = await axios.post(`${API_BASE_URL}/upload`, formData, { headers });
          const { url, type, duration } = uploadRes.data; // Expecting { url: '...', type: 'image'|'audio', ... }

          // Step 2: Send message with media URL
          payload = {
            text: msgToSend || (type === 'image' ? 'Image' : 'Voice Note'),
            replyTo: replyTarget?.id,
            mediaUrl: url,
            mediaType: type,
            duration: duration, 
            hasImage: type === 'image',
            hasAudio: type === 'audio'
          };
        } catch (uploadErr) {
          console.error('Upload failed', uploadErr);
          toast.error('Failed to upload media');
          setIsSending(false);
          return;
        }
      } else {
        payload = { text: msgToSend, replyTo: replyTarget?.id };
      }

      // Step 3: Post the message to the chat endpoint
      const res = await axios.post(`${API_BASE_URL}${endpoint}`, payload, { headers });
      
      const newMessage = res.data?.message || res.data;
      if (selectedChat.type === 'channel' && newMessage && socket) {
        socket.emit('new_message', { channelId: selectedChat.id, message: newMessage });
      }

    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  if (!selectedChat) return null; // Hide input completely when no chat

  return (
    <div className="border-t border-border bg-gray-300 px-1 py-2 relative flex flex-col items-center justify-center">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleFileChange} 
      />

      {/* Reply Preview */}
      {replyTarget && (
        <div className="w-full px-3 mb-2">
          <div className="bg-white rounded-xl border border-border px-3 py-2 flex items-start justify-between">
            <div className="text-sm">
              <div className="font-semibold">{replyTarget.sender.name}</div>
              <div className="text-gray-600 truncate max-w-[70vw]">{replyTarget.text}</div>
            </div>
            <button
              onClick={onCancelReply}
              className="text-xs text-gray-500 hover:text-gray-700 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Image Preview */}
      {imagePreview && (
        <div className="w-full px-4 mb-2 flex justify-start">
          <div className="relative inline-block">
            <img src={imagePreview} alt="Preview" className="h-32 w-auto rounded-lg border border-gray-300 shadow-sm object-cover" />
            <button 
              onClick={() => clearImage()}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="h-12 flex items-center justify-between md:gap-2 bg-offwhite rounded-3xl px-1 lg:px-3 py-1 focus-within:ring-2 focus-within:ring-blue/30 w-full transition-all duration-300">
        
        {isRecording ? (
          // Recording UI
          <div className="flex-1 flex items-center justify-between px-2">
            <div className="flex items-center gap-2 text-red-500 animate-pulse">
              <Mic className="w-5 h-5 fill-current" />
              <span className="font-mono font-medium">{formatDuration(recordingDuration)}</span>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={cancelRecording}
                className="text-gray-500 hover:text-red-500 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  stopRecording();
                  // Need a small delay to allow onstop to fire and set state
                  setTimeout(handleSend, 100); 
                }}
                className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          // Standard Input UI
          <>
            <button
              className="p-1.5 hover:bg-white/50 rounded cursor-pointer flex items-start"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Smile className="w-3.5 h-3.5 lg:w-5 lg:h-5 text-text-secondary" />
            </button>

            <div className="relative flex items-center justify-center gap-1">
              <button
                className="p-1.5 hover:bg-white/50 rounded cursor-pointer flex items-start "
                onClick={() => setShowPlusMenu(!showPlusMenu)}
              >
                <Plus className="w-3.5 h-3.5 lg:w-5 lg:h-5 text-text-secondary" />
              </button>

              {showPlusMenu && (
                <div
                  ref={plusMenuRef}
                  className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-lg shadow-2xl border border-border py-2 z-50"
                >
                  <button
                    onClick={handleAttachFile}
                    className="w-full cursor-pointer text-left px-4 py-2.5 hover:bg-offwhite flex items-center gap-3 text-sm text-text-primary"
                  >
                    <Paperclip className="w-5 h-5 text-text-secondary" />
                    Attach file
                  </button>
                  <button
                    onClick={handleVoiceNote}
                    className="w-full cursor-pointer text-left px-4 py-2.5 hover:bg-offwhite flex items-center gap-3 text-sm text-text-primary"
                  >
                    <Mic className="w-5 h-5 text-text-secondary" />
                    Voice note
                  </button>
                  <button
                    onClick={handleShareImage}
                    className="w-full cursor-pointer text-left px-4 py-2.5 hover:bg-offwhite flex items-center gap-3 text-sm text-text-primary"
                  >
                    <ImageIcon className="w-5 h-5 text-text-secondary" />
                    Share image
                  </button>
                  <button
                    onClick={handleCreatePoll}
                    className="w-full cursor-pointer text-left px-4 py-2.5 hover:bg-offwhite flex items-center gap-3 text-sm text-text-primary"
                  >
                    <BarChart2 className="w-5 h-5 text-text-secondary" />
                    Create poll
                  </button>
                </div>
              )}
            </div>

            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (selectedChat && socket) {
                  socket.emit('typing', { channelId: selectedChat.id, isTyping: true });
                  if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
                  typingTimerRef.current = setTimeout(() => {
                    socket.emit('typing', { channelId: selectedChat!.id, isTyping: false });
                  }, 1500);
                }
              }}
              placeholder="Type a message..."
              className="flex-1 bg-transparent outline-none text-text-primary placeholder:text-text-secondary px-1 md:px-3"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />

            <button
              onClick={handleSend}
              className={`p-1.5 rounded-full flex items-end border justify-end transition ${
                message.trim() || selectedImage || audioBlob
                  ? 'text-black hover:text-blue-600 cursor-pointer'
                  : 'text-gray-400 cursor-not-allowed'
              }`}
              disabled={(!message.trim() && !selectedImage && !audioBlob) || isSending}
            >
              <Send className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </>
        )}
      </div>

      {showEmojiPicker && (
        <div ref={pickerRef} className="absolute bottom-16 left-4 z-50 shadow-xl">
          <EmojiPicker
            onEmojiClick={(emojiData) => {
              setMessage((prev) => prev + emojiData.emoji);
              setShowEmojiPicker(false);
              inputRef.current?.focus();
            }}
            width={300}
            height={390}
            previewConfig={{ showPreview: false }}
            lazyLoadEmojis={true}
          />
        </div>
      )}
    </div>
  );
};

export default MessageInput;
