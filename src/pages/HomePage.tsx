// src/pages/HomePage.tsx
import { useState, useEffect } from 'react';
import Aside from '../components/aside/Aside';
import Main from '../components/main/Main';
import ThreadPane from '../components/threadPane/ThreadPane';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

function HomePage() {
  const [isThreadOpen, setIsThreadOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1000);
  const [activeView, setActiveView] = useState<'aside' | 'main' | 'thread'>('aside');

  // Global page loading state
  const [isPageLoading, setIsPageLoading] = useState(true);

  // Selected chat now includes name
  const [selectedChat, setSelectedChat] = useState<{
    id: string;
    type: 'channel' | 'dm';
    name?: string;
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

  const toggleThreadPane = () => {
    setIsThreadOpen((prev) => {
      const next = !prev;
      if (isMobile) {
        setActiveView(next ? 'thread' : 'main');
      }
      return next;
    });
  };

  const handleSelectChat = (chatId: string, type: 'channel' | 'dm', name?: string) => {
    setSelectedChat({ id: chatId, type, name });
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

  if (isPageLoading) {
    return (
      <div className="relative flex h-screen w-screen overflow-hidden bg-offwhite">
        {/* Skeleton Sidebar */}
        <div className="w-full lg:w-[280px] lg:min-w-[260px] h-full border-r border-border shrink-0 bg-gray-50 px-4">
          <div className="p-4 pb-2 border-b border-gray-200 flex items-center justify-between">
            <div>
              <Skeleton width={160} height={28} baseColor="#1f2937" highlightColor="#4b5563" />
              <Skeleton width={110} height={16} className="mt-1" baseColor="#1f2937" highlightColor="#4b5563" />
            </div>
            <Skeleton circle width={32} height={32} baseColor="#1f2937" highlightColor="#4b5563" />
          </div>

          <div className="flex border-b border-gray-200 mt-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex-1 py-3">
                <Skeleton height={20} width="60%" className="mx-auto" baseColor="#1f2937" highlightColor="#4b5563" />
              </div>
            ))}
          </div>

          <div className="flex-1 p-4 space-y-6">
            <Skeleton width={100} height={16} className="mb-2" baseColor="#1f2937" highlightColor="#4b5563" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5">
                <Skeleton circle width={24} height={24} baseColor="#1f2937" highlightColor="#4b5563" />
                <Skeleton width={140} height={16} baseColor="#1f2937" highlightColor="#4b5563" />
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-gray-200 flex gap-3">
            <Skeleton width="70%" height={36} className="rounded-md" baseColor="#1f2937" highlightColor="#4b5563" />
            <Skeleton circle width={36} height={36} baseColor="#1f2937" highlightColor="#4b5563" />
          </div>
        </div>

        {/* Skeleton Main */}
        <div className="hidden lg:flex-1 lg:flex lg:flex-col ">
          <div className="flex items-center justify-center mb-2 px-4">
            <div className="h-14 bg-white w-full max-w-4xl mt-2 rounded-3xl shadow-lg flex items-center justify-between px-6">
              <Skeleton width={120} height={20} baseColor="#1f2937" highlightColor="#4b5563" />
              <div className="flex gap-4">
                <Skeleton circle width={32} height={32} baseColor="#1f2937" highlightColor="#4b5563" />
                <Skeleton circle width={32} height={32} baseColor="#1f2937" highlightColor="#4b5563" />
                <Skeleton circle width={32} height={32} baseColor="#1f2937" highlightColor="#4b5563" />
              </div>
            </div>
          </div>

          <div className="flex-1 px-6 py-4 space-y-6">
            {Array.from({ length: 12 }).map((_, i) => {
              const isOwn = i % 4 === 3;
              return (
                <div key={i} className={`flex gap-3 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  {!isOwn && <Skeleton circle width={40} height={40} className="mt-1" baseColor="#1f2937" highlightColor="#4b5563" />}
                  <div className={`max-w-[80%] ${isOwn ? 'items-end' : 'items-start'}`}>
                    {!isOwn && <Skeleton width={120} height={14} className="mb-1" baseColor="#1f2937" highlightColor="#4b5563" />}
                    <Skeleton 
                      height={i % 3 === 0 ? 90 : 60} 
                      borderRadius={16} 
                      className={isOwn ? 'rounded-br-none' : 'rounded-bl-none'}
                      baseColor="#1f2937" 
                      highlightColor="#4b5563" 
                    />
                    <Skeleton width={60} height={14} className="mt-1" baseColor="#1f2937" highlightColor="#4b5563" />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-gray-200 px-4 py-3">
            <div className="flex items-center gap-3 bg-gray-100 rounded-3xl px-4 py-2">
              <Skeleton circle width={32} height={32} baseColor="#1f2937" highlightColor="#4b5563" />
              <Skeleton width="70%" height={32} baseColor="#1f2937" highlightColor="#4b5563" />
              <Skeleton circle width={32} height={32} baseColor="#1f2937" highlightColor="#4b5563" />
            </div>
          </div>
        </div>

        {/* Skeleton Thread Pane */}
        <div className="hidden lg:w-[320px] lg:min-w-[300px] h-full border-l border-gray-200 bg-white">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton circle width={40} height={40} baseColor="#1f2937" highlightColor="#4b5563" />
              <div>
                <Skeleton width={120} height={20} baseColor="#1f2937" highlightColor="#4b5563" />
                <Skeleton width={80} height={12} className="mt-1" baseColor="#1f2937" highlightColor="#4b5563" />
              </div>
            </div>
            <Skeleton circle width={32} height={32} baseColor="#1f2937" highlightColor="#4b5563" />
          </div>

          <div className="p-6 space-y-8">
            <Skeleton width={140} height={16} className="mb-4" baseColor="#1f2937" highlightColor="#4b5563" />
            <Skeleton circle width={80} height={80} className="mx-auto" baseColor="#1f2937" highlightColor="#4b5563" />

            <div>
              <Skeleton width={160} height={16} className="mb-4" baseColor="#1f2937" highlightColor="#4b5563" />
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} height={96} className="rounded-lg" baseColor="#1f2937" highlightColor="#4b5563" />
                ))}
              </div>
            </div>

            <div>
              <Skeleton width={140} height={16} className="mb-4" baseColor="#1f2937" highlightColor="#4b5563" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-lg mb-3">
                  <Skeleton width={40} height={40} className="rounded" baseColor="#1f2937" highlightColor="#4b5563" />
                  <div className="flex-1">
                    <Skeleton width={180} height={16} baseColor="#1f2937" highlightColor="#4b5563" />
                    <Skeleton width={100} height={12} className="mt-1" baseColor="#1f2937" highlightColor="#4b5563" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
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
            : 'w-[280px] min-w-[260px] h-full border-r border-border shrink-0'}
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
                isThreadOpen ? 'w-[320px] min-w-[300px]' : 'w-0 overflow-hidden'
              }`}
        `}
      >
        {(isMobile ? activeView === 'thread' : isThreadOpen) && (
          <ThreadPane
            isGroup={true}
            isOpen={true}
            onToggle={toggleThreadPane}
            onBack={isMobile ? goBackToMain : undefined}
          />
        )}
      </div>
    </div>
  );
}

export default HomePage;