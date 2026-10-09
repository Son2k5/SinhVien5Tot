import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { MessageCirclePlus, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import type { User } from '../auth/types/auth.types';
import { SiteFooter as DashboardFooter } from '../../components/common/SiteFooter';
import {
  DashboardHeader,
  SystemLauncher,
  useWelcomeDashboard,
  useLauncher,
  formatUserRole,
} from '../home-dashboard';
import { useConversations, useStartSupport } from './hooks/useChat';
import { ChatThread } from './components/ChatThread';
import { NewChatDialog } from './components/NewChatDialog';

const formatRelativeTime = (isoDate: string | null) => {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Vừa xong';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} phút`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} giờ`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} ngày`;
  return date.toLocaleDateString('vi-VN');
};

export interface ChatPageProps {
  user?: User;
  onLogout?: () => void;
}

export default function ChatPage({ user, onLogout }: ChatPageProps = {}) {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useConversations();
  const startSupport = useStartSupport();

  const authUser = useAuthStore((s) => s.user);
  const authLogout = useAuthStore((s) => s.clearSession);
  const currentUser = user || authUser;
  const handleLogout = onLogout || authLogout;

  const { displayName, avatarUrl, notifications, features } = useWelcomeDashboard(
    currentUser || ({ id: '', email: '', role: 1, name: '' } as unknown as User),
  );
  const {
    launcherOpen,
    featureSearch,
    filteredFeatures,
    featureGroups,
    launcherButtonRef,
    launcherSearchRef,
    openLauncher,
    closeLauncher,
    toggleLauncher,
    setFeatureSearch,
  } = useLauncher(features);

  const conversations = useMemo(() => data?.pages.flatMap((p) => p.items) || [], [data]);
  const activeConversation = conversations.find((c) => c.id === conversationId);

  // Handle ?support=1
  useEffect(() => {
    if (searchParams.get('support') === '1') {
      const appId = searchParams.get('applicationId');
      startSupport.mutateAsync(appId || undefined).then((res) => {
        navigate(`/chat/${res.conversationId}`, { replace: true });
      }).catch((err) => {
        console.error(err);
        navigate('/chat', { replace: true });
      });
    }
  }, [searchParams, navigate, startSupport]);

  const isThreadActive = !!conversationId;

  return (
    <div className="authenticated-page-background min-h-screen text-slate-700 flex flex-col font-['Be_Vietnam_Pro',ui-sans-serif,system-ui,sans-serif]">
      {currentUser && (
        <>
          <DashboardHeader
            displayName={displayName}
            role={formatUserRole(currentUser.role)}
            avatarUrl={avatarUrl}
            notificationCount={notifications.length}
            launcherOpen={launcherOpen}
            menuButtonRef={launcherButtonRef}
            onToggleLauncher={toggleLauncher}
            onOpenLauncher={openLauncher}
            onLogout={handleLogout}
          />

          <SystemLauncher
            open={launcherOpen}
            searchValue={featureSearch}
            featureGroups={featureGroups}
            filteredCount={filteredFeatures.length}
            searchInputRef={launcherSearchRef}
            onSearchChange={setFeatureSearch}
            onClose={closeLauncher}
            onLogout={handleLogout}
          />
        </>
      )}

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Link to="/dashboard" className="hover:text-blue-600 transition-colors">
            Trang tổng quan
          </Link>
          <span className="text-slate-300" aria-hidden="true">/</span>
          <span className="text-slate-800">Tin nhắn</span>
        </nav>

        {/* Chat Card Box */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200/90 overflow-hidden flex h-[calc(100vh-215px)] min-h-[580px] max-h-[850px]">
          {/* Left Pane: Conversation List */}
          <div className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-slate-200 bg-white shrink-0 h-full overflow-hidden ${isThreadActive ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h1 className="text-lg font-bold text-slate-800">Tin nhắn</h1>
              <button 
                onClick={() => setIsNewChatOpen(true)}
                className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors cursor-pointer"
                title="Tạo cuộc trò chuyện mới"
              >
                <MessageCirclePlus className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center p-8 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-2">
                    <MessageCirclePlus className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-sm font-medium text-slate-600">Chưa có cuộc trò chuyện nào</p>
                  <p className="text-xs">Nhấn vào nút dấu cộng phía trên để bắt đầu nhắn tin.</p>
                </div>
              ) : (
                <div className="space-y-0 divide-y divide-slate-100">
                  {conversations.map((conv) => (
                    <Link
                      key={conv.id}
                      to={`/chat/${conv.id}`}
                      className={`flex items-start gap-3 p-3 transition-colors hover:bg-slate-50 cursor-pointer ${conversationId === conv.id ? 'bg-blue-50/60 hover:bg-blue-50/60' : ''}`}
                    >
                      <div className="relative shrink-0">
                        <div className="w-11 h-11 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center font-bold text-slate-600 border border-slate-200 text-sm">
                          {conv.otherUser.avatarUrl ? (
                            <img src={conv.otherUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            conv.otherUser.displayName.charAt(0).toUpperCase()
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <h3 className="font-semibold text-sm text-slate-800 truncate pr-2">{conv.otherUser.displayName}</h3>
                          <span className="text-[11px] text-slate-400 whitespace-nowrap shrink-0">
                            {formatRelativeTime(conv.lastMessageAt)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'font-semibold text-slate-800' : 'text-slate-500'}`}>
                            {conv.lastMessagePreview || 'Bắt đầu cuộc trò chuyện'}
                          </p>
                          {conv.unreadCount > 0 && (
                            <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-['JetBrains_Mono'] text-[10px] font-bold flex items-center justify-center shrink-0">
                              {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                  {hasNextPage && (
                    <button 
                      onClick={() => fetchNextPage()} 
                      className="w-full p-3 text-xs text-blue-600 font-medium hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      {isFetchingNextPage ? 'Đang tải...' : 'Tải thêm'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Pane: Chat Thread */}
          <div className={`flex-1 flex-col bg-slate-50/40 relative h-full overflow-hidden ${!isThreadActive ? 'hidden md:flex' : 'flex'}`}>
            {isThreadActive ? (
              <>
                {/* Mobile Back Button overlay if needed */}
                <div className="md:hidden absolute top-2.5 left-2.5 z-20">
                  <Link to="/chat" className="w-9 h-9 bg-white/90 backdrop-blur-md rounded-full shadow flex items-center justify-center text-slate-600 hover:text-slate-900 border border-slate-200">
                    <ArrowLeft className="w-4 h-4" />
                  </Link>
                </div>
                <ChatThread conversationId={conversationId} conversation={activeConversation} />
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                  <MessageCirclePlus className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-600 font-semibold text-sm">Chọn một cuộc trò chuyện để bắt đầu</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Trao đổi trực tiếp với Hội đồng xét duyệt, Mentor hoặc các sinh viên khác trong trường.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <DashboardFooter />

      <NewChatDialog open={isNewChatOpen} onClose={() => setIsNewChatOpen(false)} />
    </div>
  );
}
