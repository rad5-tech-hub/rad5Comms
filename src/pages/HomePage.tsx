// src/pages/HomePage.tsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import Aside from '../components/aside/Aside';
import Main from '../components/main/Main';
import ThreadPane from '../components/threadPane/ThreadPane';
import 'react-loading-skeleton/dist/skeleton.css';

function HomePage() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [isThreadOpen, setIsThreadOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1000);
  const [activeView, setActiveView] = useState<'aside' | 'main' | 'thread'>('aside');

  // Global page loading state
  const [isPageLoading, setIsPageLoading] = useState(true);

  const [selectedChat, setSelectedChat] = useState<{
    id: string;
    type: 'channel' | 'dm';
    name: string;
    description?: string;
    avatar?: string;
    memberCount?: number;
    members?: Array<{ id: string; name: string; avatar?: string }>;
    isAdmin?: boolean;
  } | null>(null);

  // Mobile detection
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1000;
      setIsMobile(mobile);
      if (!mobile && activeView !== 'aside') {
        setActiveView('aside');
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeView]);

  // Simulate initial page load
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleChatAction = () => {
      setSelectedChat(null);
      // You might want to refetch your chat lists here as well
    };
    window.addEventListener('chat-action-success', handleChatAction);
    return () => window.removeEventListener('chat-action-success', handleChatAction);
  }, []);

  const toggleThreadPane = () => {
    setIsThreadOpen((prev) => {
      const next = !prev;
      if (isMobile) {
        setActiveView(next ? 'thread' : 'main');
      }
      return next;
    });
  };

  const handleSelectChat = async (
    chatId: string,
    type: 'channel' | 'dm',
    name?: string,
    extra?: {
      avatar?: string;
      description?: string;
      bio?: string;
      memberCount?: number;
    }
  ) => {
    const token = localStorage.getItem('token');
    let fullData: {
      avatar?: string;
      description?: string;
      bio?: string;
      memberCount?: number;
      members?: Array<{ id: string; name: string; avatar?: string }>;
      isAdmin?: boolean;
    } = { ...extra };

    if (token) {
      try {
        if (type === 'channel') {
          const res = await axios.get(`${API_BASE_URL}/channels/${chatId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const ch = res.data?.channel || res.data || {};
          fullData = {
            avatar: ch.avatar || extra?.avatar,
            description: ch.description || extra?.description,
            memberCount: typeof ch.memberCount === 'number' ? ch.memberCount : ch.members?.length || extra?.memberCount,
            members: Array.isArray(ch.members) ? ch.members : [], // will be spread into selectedChat below
            isAdmin: ch.role === 'admin' || ch.isAdmin === true,
          };
          // Try to fetch channel media (images, audio, video)
          try {
            const mediaRes = await axios.get(`${API_BASE_URL}/channels/${chatId}/media`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const mediaData = Array.isArray(mediaRes.data) ? mediaRes.data : mediaRes.data?.media || [];
            (fullData as any).media = mediaData;
          } catch (mediaErr) {
            console.warn('Failed to fetch channel media', mediaErr);
            (fullData as any).media = (fullData as any).media || [];
          }
        } else {
          // DM: fetch user details for bio/avatar if missing
          const res = await axios.get(`${API_BASE_URL}/users/${chatId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const user = res.data?.user || res.data;
          fullData = {
            avatar: user.avatar || extra?.avatar,
            bio: user.bio || extra?.bio,
          };
          // Try to fetch DM media by recipient ID (selectedChat.id is recipient user id)
          try {
            const mediaRes = await axios.get(`${API_BASE_URL}/dms/${chatId}/media`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const mediaData = Array.isArray(mediaRes.data) ? mediaRes.data : mediaRes.data?.media || [];
            (fullData as any).media = mediaData;
          } catch (mediaErr) {
            console.warn('Failed to fetch DM media', mediaErr);
            (fullData as any).media = (fullData as any).media || [];
          }
        }
      } catch (err) {
        console.warn('Failed to fetch full chat details:', err);
        // Fallback to extra/minimal data
      }
    }

    setSelectedChat({
      id: chatId,
      type,
      name: name || 'Unnamed Chat',
      ...fullData,
    });

    if (isMobile) {
      setActiveView('main');
    }
  };

  const goBackToAside = () => setActiveView('aside');
  const goBackToMain = () => {
    setIsThreadOpen(false);
    setActiveView('main');
  };

  const mobileViewClass = isMobile
    ? 'absolute inset-0 transform transition-transform duration-300 ease-in-out'
    : '';

  useEffect(() => {
    const onMemberAdded = (e: Event) => {
      const ce = e as CustomEvent<{
        channelId: string;
        addedUser: { id: string; name: string; avatar?: string };
        addedBy: { name: string };
      }>;
      if (!selectedChat || selectedChat.type !== 'channel') return;
      if (selectedChat.id !== ce.detail.channelId) return;
      const existing = Array.isArray(selectedChat.members)
        ? (selectedChat.members as Array<{ id: string; name: string; avatar?: string }>)
        : [];
      const already = existing.some((m) => m.id === ce.detail.addedUser.id);
      const nextMembers = already
        ? existing
        : [...existing, { id: ce.detail.addedUser.id, name: ce.detail.addedUser.name, avatar: ce.detail.addedUser.avatar }];
      setSelectedChat({
        ...selectedChat,
        memberCount: (selectedChat.memberCount || existing.length) + (already ? 0 : 1),
        members: nextMembers,
      });
    };
    window.addEventListener('member-added', onMemberAdded as EventListener);
    return () => window.removeEventListener('member-added', onMemberAdded as EventListener);
  }, [selectedChat]);

  if (isPageLoading) {
    // ... your skeleton code remains unchanged ...
    return (
      <div className="relative flex h-screen w-screen overflow-hidden bg-offwhite">
        {/* ... skeleton ... */}
      </div>
    );
  }

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-offwhite">
      {/* Aside */}
      <div
        className={`
          ${isMobile
            ? `${mobileViewClass} ${
                activeView === 'aside' ? 'translate-x-0' : '-translate-x-full'
              } z-30`
            : 'w-70 min-w-65 h-full border-r border-border shrink-0'}
        `}
      >
        <Aside onSelectChat={handleSelectChat} />
      </div>

      {/* Main */}
      <div
        className={`
          flex-1 flex flex-col min-w-0 h-full
          ${isMobile
            ? `${mobileViewClass} ${
                activeView === 'main' ? 'translate-x-0' : 'translate-x-full'
              } z-20`
            : ''}
        `}
      >
        <Main
          isThreadOpen={isThreadOpen}
          toggleThreadPane={toggleThreadPane}
          onBack={isMobile ? goBackToAside : undefined}
          selectedChat={selectedChat}
        />
      </div>

      {/* Thread Pane */}
      <div
        className={`
          ${isMobile
            ? `${mobileViewClass} ${
                activeView === 'thread' ? 'translate-x-0' : 'translate-x-full'
              } z-40 bg-white`
            : `h-full border-l border-border transition-all duration-300 ease-in-out ${
                isThreadOpen ? 'w-[320px] min-w-75' : 'w-0 overflow-hidden'
              }`}
        `}
      >
        {(isMobile ? activeView === 'thread' : isThreadOpen) && (
          <ThreadPane
            isOpen={true}
            onToggle={toggleThreadPane}
            onBack={isMobile ? goBackToMain : undefined}
            selectedChat={selectedChat}
          />
        )}
      </div>
    </div>
  );
}

export default HomePage;
