/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { X, Search, Hash, Send } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useWebSocket } from '../../context/webSocketContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface ForwardModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceMessage: { id: string; text: string } | null;
}

const ForwardModal = ({ isOpen, onClose, sourceMessage }: ForwardModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [channelResults, setChannelResults] = useState<Array<{ id: string; name: string }>>([]);
  const [userResults, setUserResults] = useState<Array<{ id: string; name: string; avatar?: string }>>([]);
  const [selectedTargets, setSelectedTargets] = useState<Array<{ id: string; type: 'channel' | 'dm'; name: string }>>([]);
  const { socket } = useWebSocket();

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setChannelResults([]);
      setUserResults([]);
      setSelectedTargets([]);
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const term = searchTerm.trim();
    if (!term) {
      setChannelResults([]);
      setUserResults([]);
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) return;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const [channelsRes, usersRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/channels?search=${encodeURIComponent(term)}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_BASE_URL}/users?search=${encodeURIComponent(term)}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        const chans = channelsRes.data?.channels || channelsRes.data || [];
        const users = usersRes.data?.users || usersRes.data || [];
        setChannelResults(chans.slice(0, 10));
        setUserResults(users.slice(0, 10));
      } catch {
        setChannelResults([]);
        setUserResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [isOpen, searchTerm]);

  const toggleSelect = (id: string, type: 'channel' | 'dm', name: string) => {
    setSelectedTargets((prev) => {
      const idx = prev.findIndex((p) => p.id === id && p.type === type);
      if (idx >= 0) {
        const next = [...prev];
        next.splice(idx, 1);
        return next;
      }
      return [...prev, { id, type, name }];
    });
  };

  const handleForward = async () => {
    if (!sourceMessage || selectedTargets.length === 0) return;
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please log in');
      return;
    }
    try {
      for (const target of selectedTargets) {
        const endpoint =
          target.type === 'channel'
            ? `/channels/${target.id}/messages`
            : `/dms/${target.id}/messages`;
        const res = await axios.post(
          `${API_BASE_URL}${endpoint}`,
          { text: sourceMessage.text },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const newMessage = res.data?.message || res.data;
        if (socket && target.type === 'channel') {
          socket.emit('new_message', { channelId: target.id, message: newMessage });
        }
      }
      toast.success('Message forwarded');
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to forward');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md lg:max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold">Forward message</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {sourceMessage && (
          <div className="px-4 pt-3">
            <div className="bg-sidebar rounded-xl px-3 py-2 text-sm text-white">{sourceMessage.text}</div>
          </div>
        )}

        <div className="p-4">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search channels or people..."
              className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 text-black"
              autoFocus
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="px-4 pb-3 flex flex-wrap gap-2">
          {selectedTargets.map((t) => (
            <span
              key={`${t.type}-${t.id}`}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
            >
              {t.type === 'channel' ? <Hash className="w-3 h-3" /> : null}
              {t.name}
              <button
                onClick={() => toggleSelect(t.id, t.type, t.name)}
                className="ml-1 text-blue-800 hover:text-blue-900"
              >
                ×
              </button>
            </span>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
          {isSearching ? (
            <div className="text-center text-gray-500">Searching...</div>
          ) : (
            <>
              {channelResults.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 mb-2">Channels</h3>
                  {channelResults.map((ch) => {
                    const selected = selectedTargets.some((t) => t.id === ch.id && t.type === 'channel');
                    return (
                      <button
                        key={ch.id}
                        onClick={() => toggleSelect(ch.id, 'channel', ch.name)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition cursor-pointer ${
                          selected ? 'bg-gray-200' : 'hover:bg-gray-100'
                        }`}
                      >
                        <Hash className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{ch.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {userResults.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 mb-2">People</h3>
                  {userResults.map((u) => {
                    const selected = selectedTargets.some((t) => t.id === u.id && t.type === 'dm');
                    return (
                      <button
                        key={u.id}
                        onClick={() => toggleSelect(u.id, 'dm', u.name)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition cursor-pointer ${
                          selected ? 'bg-gray-200' : 'hover:bg-gray-100'
                        }`}
                      >
                        {u.avatar ? (
                          <img src={u.avatar} alt={u.name} className="w-7 h-7 rounded-full object-cover" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-medium">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium">{u.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-4 border-t flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-3 py-2 rounded-md bg-gray-200  cursor-pointer hover:bg-gray-400 text-black">
            Cancel
          </button>
          <button
            onClick={handleForward}
            disabled={!sourceMessage || selectedTargets.length === 0}
            className="px-4 py-2 rounded-md bg-blue-900 text-white hover:bg-sidebar/80 disabled:bg-sidebar disabled:cursor-not-allowed flex items-center cursor-pointer gap-2"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForwardModal;
