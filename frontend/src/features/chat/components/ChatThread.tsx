import { useEffect, useRef, useState, useMemo } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { useChatRealtimeStore } from '../hooks/useChatRealtime';
import { useMessages, useSendMessage, useBlockUser, useUnblockUser } from '../hooks/useChat';
import type { UiMessage, ConversationSummary } from '../types/chat.types';
import { Loader2, Send, AlertCircle, RefreshCw, MoreVertical, ShieldAlert, ShieldCheck } from 'lucide-react';

interface ChatThreadProps {
  conversationId: string;
  conversation?: ConversationSummary;
}

export function ChatThread({ conversationId, conversation }: ChatThreadProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useMessages(conversationId);
  const sendMessage = useSendMessage();
  const user = useAuthStore(s => s.user);
  const setActiveConversationId = useChatRealtimeStore(s => s.setActiveConversationId);
  const blockUser = useBlockUser();
  const unblockUser = useUnblockUser();
  const [text, setText] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // When opening a thread, set it as active
  useEffect(() => {
    setActiveConversationId(conversationId);
    return () => setActiveConversationId(null);
  }, [conversationId, setActiveConversationId]);

  // Flatten messages and reverse because we get newest first (page 0 has newest)
  // We want to render oldest at top, newest at bottom.
  const messages = useMemo(() => {
    if (!data) return [];
    return data.pages.flatMap(p => p.items).reverse();
  }, [data]);

  // Auto scroll to bottom
  useEffect(() => {
    if (shouldAutoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, shouldAutoScroll]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    // If we are near bottom (within 100px), enable auto scroll
    if (scrollHeight - scrollTop - clientHeight < 100) {
      setShouldAutoScroll(true);
    } else {
      setShouldAutoScroll(false);
    }
  };

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        // Save scroll height before fetch
        const oldHeight = containerRef.current?.scrollHeight || 0;
        fetchNextPage().then(() => {
          // Restore scroll position
          if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight - oldHeight;
          }
        });
      }
    });

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage.mutate({ conversationId, body: text.trim() });
    setText('');
    setShouldAutoScroll(true);
  };

  const handleRetry = (msg: UiMessage) => {
    if (msg.clientMessageId) {
      sendMessage.mutate({ conversationId, body: msg.body, clientMessageId: msg.clientMessageId });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // grouping consecutive messages from same user
  const renderMessages = () => {
    let lastDate = '';
    return messages.map((msg, index) => {
      const isMe = msg.senderUserId === user?.id || msg.status === 'sending' || msg.status === 'failed';
      const prevMsg = messages[index - 1];
      void prevMsg;

      const msgDate = new Date(msg.createdAt).toLocaleDateString('vi-VN');
      const dateHeader = msgDate !== lastDate ? (
        <div key={`date-${msg.id}`} className="text-center my-4 text-xs font-medium text-slate-400">
          {msgDate}
        </div>
      ) : null;
      lastDate = msgDate;

      const isRead = data?.pages[0]?.otherLastReadAt && new Date(msg.createdAt) <= new Date(data.pages[0].otherLastReadAt);
      const isLastOfMine = isMe && index === messages.length - 1;

      return (
        <div key={msg.id || msg.clientMessageId}>
          {dateHeader}
          <div className={`flex flex-col mb-1 ${isMe ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 whitespace-pre-wrap break-words text-sm ${
              isMe 
                ? 'bg-gradient-to-tr from-blue-600 to-blue-500 text-white rounded-tr-sm shadow-sm' 
                : 'bg-white/80 backdrop-blur-md border border-white/20 text-slate-800 rounded-tl-sm shadow-sm'
            }`}>
              {msg.body}
            </div>

            {msg.status === 'failed' && (
              <div className="flex items-center gap-1 mt-1 text-rose-500 text-[11px] font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{msg.errorMessage || 'Gửi lỗi'}</span>
                {!msg.errorMessage && (
                  <button onClick={() => handleRetry(msg)} className="ml-1 text-blue-500 hover:underline flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" /> Gửi lại
                  </button>
                )}
              </div>
            )}
            {msg.status === 'sending' && (
              <div className="text-xs text-slate-400 mt-1">Đang gửi...</div>
            )}
            {isLastOfMine && msg.status !== 'sending' && msg.status !== 'failed' && isRead && (
              <div className="text-[10px] text-slate-400 mt-0.5">Đã xem</div>
            )}
          </div>
        </div>
      );
    });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50/50 relative overflow-hidden font-['Be_Vietnam_Pro'] h-full">
      {/* Header */}
      <div className="h-14 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 flex items-center justify-between shadow-sm z-10 shrink-0">
        {conversation?.otherUser && (
          <>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold overflow-hidden border border-slate-200">
                {conversation.otherUser.avatarUrl ? (
                  <img src={conversation.otherUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  conversation.otherUser.displayName.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <div className="font-semibold text-sm text-slate-800 leading-tight">
                  {conversation.otherUser.displayName}
                </div>
                <div className="text-xs text-slate-500 leading-tight">
                  {conversation.otherUser.roleLabel}
                </div>
              </div>
            </div>

            {conversation.otherUser.roleLabel.toLowerCase().includes('sinh viên') && (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <button
                        onClick={() => {
                          blockUser.mutate(conversation.otherUser.id);
                          setMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <ShieldAlert className="w-4 h-4" />
                        Chặn người này
                      </button>
                      <button
                        onClick={() => {
                          unblockUser.mutate(conversation.otherUser.id);
                          setMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Bỏ chặn
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Messages */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 scroll-smooth motion-reduce:scroll-auto"
      >
        <div ref={sentinelRef} className="h-4 w-full flex justify-center items-center">
          {isFetchingNextPage && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
        </div>
        {renderMessages()}
        <div ref={bottomRef} className="h-1" />
      </div>

      {!shouldAutoScroll && (
        <button 
          onClick={() => {
            setShouldAutoScroll(true);
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm border border-slate-200 shadow-lg rounded-full px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
        >
          Tin nhắn mới ↓
        </button>
      )}

      {/* Composer */}
      <div className="p-3 bg-white border-t border-slate-200/80 shrink-0">
        <div className="flex items-end gap-2 max-w-4xl mx-auto bg-slate-100 rounded-2xl p-1 border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400 transition-colors">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập tin nhắn..."
            maxLength={2000}
            className="flex-1 bg-transparent border-none outline-none resize-none max-h-32 min-h-[36px] py-2 px-3 text-sm text-slate-800 placeholder:text-slate-400 font-['Be_Vietnam_Pro'] leading-relaxed"
            rows={1}
            style={{
              height: 'auto',
              minHeight: '36px'
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 128) + 'px';
            }}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sendMessage.isPending}
            className="w-9 h-9 shrink-0 flex items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 transition-colors mb-0.5 mr-0.5"
          >
            {sendMessage.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
          </button>
        </div>
        {text.length > 1800 && (
          <div className="text-right text-[10px] text-slate-400 mt-1 px-2">
            {text.length}/2000
          </div>
        )}
      </div>
    </div>
  );
}
