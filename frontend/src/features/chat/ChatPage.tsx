import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { MessageCirclePlus, ArrowLeft, Loader2 } from 'lucide-react';
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

export default function ChatPage() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useConversations();
  const startSupport = useStartSupport();

  const conversations = useMemo(() => data?.pages.flatMap(p => p.items) || [], [data]);
  const activeConversation = conversations.find(c => c.id === conversationId);

  // Handle ?support=1
  useEffect(() => {
    if (searchParams.get('support') === '1') {
      const appId = searchParams.get('applicationId');
      startSupport.mutateAsync(appId || undefined).then(res => {
        navigate(`/chat/${res.conversationId}`, { replace: true });
      }).catch(err => {
        console.error(err);
        // Navigate to /chat if failed
        navigate('/chat', { replace: true });
      });
    }
  }, [searchParams, navigate, startSupport]);

  // If mobile and has conversationId, hide list. If desktop, show both.
  // We'll use CSS classes (hidden md:flex) to handle responsiveness.
  const isThreadActive = !!conversationId;

  return (
    <div className="flex h-screen bg-white font-['Be_Vietnam_Pro'] overflow-hidden">
      {/* Left Pane: Conversation List */}
      <div className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-slate-200 shrink-0 ${isThreadActive ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800">Tin nhắn</h1>
          <button 
            onClick={() => setIsNewChatOpen(true)}
            className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors"
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
            <div className="space-y-0">
              {conversations.map(conv => (
                <Link
                  key={conv.id}
                  to={`/chat/${conv.id}`}
                  className={`flex items-start gap-3 p-3 transition-colors hover:bg-slate-50 cursor-pointer ${conversationId === conv.id ? 'bg-blue-50/50 hover:bg-blue-50/50' : ''}`}
                >
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center font-bold text-slate-600 border border-slate-200">
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
                  className="w-full p-3 text-xs text-blue-600 font-medium hover:bg-slate-50 transition-colors"
                >
                  {isFetchingNextPage ? 'Đang tải...' : 'Tải thêm'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Pane: Chat Thread */}
      <div className={`flex-1 flex-col bg-slate-50/50 relative ${!isThreadActive ? 'hidden md:flex' : 'flex'}`}>
        {isThreadActive ? (
          <>
            {/* Mobile Back Button overlay if needed */}
            <div className="md:hidden absolute top-2 left-2 z-20">
              <Link to="/chat" className="w-10 h-10 bg-white/80 backdrop-blur-md rounded-full shadow flex items-center justify-center text-slate-600">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </div>
            <ChatThread conversationId={conversationId} conversation={activeConversation} />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <MessageCirclePlus className="w-10 h-10 text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">Chọn một cuộc trò chuyện để bắt đầu</p>
          </div>
        )}
      </div>

      <NewChatDialog open={isNewChatOpen} onClose={() => setIsNewChatOpen(false)} />
    </div>
  );
}
