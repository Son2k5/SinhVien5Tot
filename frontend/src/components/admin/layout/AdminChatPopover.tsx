import { useState } from 'react';
import { MessageSquare, Search, Send, X, ExternalLink } from 'lucide-react';

interface ChatConversation {
  id: string;
  userName: string;
  studentId: string;
  avatar?: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  online: boolean;
  role: string;
}

const mockConversations: ChatConversation[] = [
  {
    id: '1',
    userName: 'Nguyễn Văn An',
    studentId: '21110001',
    lastMessage: 'Thầy/Cô cho em hỏi về minh chứng tiêu chuẩn Học tập tốt ạ?',
    time: '2 phút trước',
    unreadCount: 2,
    online: true,
    role: 'Sinh viên',
  },
  {
    id: '2',
    userName: 'Trần Thị Mai',
    studentId: '21110145',
    lastMessage: 'Em đã nộp lại file PDF chứng nhận tình nguyện hè rồi ạ.',
    time: '15 phút trước',
    unreadCount: 1,
    online: true,
    role: 'Sinh viên',
  },
  {
    id: '3',
    userName: 'Lê Hoàng Long',
    studentId: '20110320',
    lastMessage: 'Cảm ơn Thầy/Cô đã duyệt hồ sơ cấp Khoa giúp em!',
    time: '1 giờ trước',
    unreadCount: 0,
    online: false,
    role: 'Lớp trưởng 20CLC01',
  },
  {
    id: '4',
    userName: 'Đoàn Thanh Niên Khoa CNTT',
    studentId: 'BCH-CNTT',
    lastMessage: 'Đã gửi danh sách tổng hợp sinh viên đủ điều kiện sơ duyệt.',
    time: '3 giờ trước',
    unreadCount: 0,
    online: false,
    role: 'Ban Chấp Hành',
  },
];

interface AdminChatPopoverProps {
  onClose: () => void;
}

export function AdminChatPopover({ onClose }: AdminChatPopoverProps) {
  const [selectedChat, setSelectedChat] = useState<ChatConversation | null>(null);
  const [chatSearch, setChatSearch] = useState('');
  const [replyText, setReplyText] = useState('');
  const [messages, setMessages] = useState<Record<string, Array<{ sender: 'user' | 'admin'; text: string; time: string }>>>({
    '1': [
      { sender: 'user', text: 'Dạ em chào Thầy/Cô ạ!', time: '14:20' },
      { sender: 'user', text: 'Thầy/Cô cho em hỏi về minh chứng tiêu chuẩn Học tập tốt ạ? Em nộp bảng điểm có cần dấu mộc đỏ không?', time: '14:22' },
    ],
    '2': [
      { sender: 'user', text: 'Em đã nộp lại file PDF chứng nhận tình nguyện hè rồi ạ. Nhờ Thầy/Cô xem giúp em.', time: '14:05' },
    ],
  });

  const filteredConversations = mockConversations.filter(
    (c) =>
      c.userName.toLowerCase().includes(chatSearch.toLowerCase()) ||
      c.studentId.toLowerCase().includes(chatSearch.toLowerCase())
  );

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedChat) return;

    const newMsg = {
      sender: 'admin' as const,
      text: replyText.trim(),
      time: 'Vừa xong',
    };

    setMessages((prev) => ({
      ...prev,
      [selectedChat.id]: [...(prev[selectedChat.id] || []), newMsg],
    }));
    setReplyText('');
  };

  return (
    <div className="absolute z-50 top-full right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200/90 rounded-2xl shadow-2xl animate-fade-in overflow-hidden flex flex-col max-h-[520px]">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
            <MessageSquare size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold leading-tight">Tin nhắn & Hỗ trợ sinh viên</h3>
            <p className="text-[10px] text-slate-300 leading-tight">3 người đang trực tuyến</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <X size={16} />
        </button>
      </div>

      {selectedChat ? (
        /* Conversation Detail View */
        <div className="flex-1 flex flex-col min-h-[360px] bg-slate-50">
          {/* Top Bar of Active Conversation */}
          <div className="px-3.5 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => setSelectedChat(null)}
                className="text-xs text-blue-600 font-semibold hover:underline cursor-pointer"
              >
                ← Trở lại
              </button>
              <div className="h-4 w-px bg-slate-200" />
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-800 truncate">{selectedChat.userName}</div>
                <div className="text-[10px] text-slate-400 truncate">{selectedChat.studentId} • {selectedChat.role}</div>
              </div>
            </div>
            {selectedChat.online && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </span>
            )}
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs">
            {(messages[selectedChat.id] || []).map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.sender === 'admin' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[82%] px-3 py-2 rounded-2xl ${
                    msg.sender === 'admin'
                      ? 'bg-blue-600 text-white rounded-br-xs'
                      : 'bg-white text-slate-800 border border-slate-200/80 shadow-2xs rounded-bl-xs'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>
                <span className="text-[9px] text-slate-400 mt-1 px-1">{msg.time}</span>
              </div>
            ))}
          </div>

          {/* Reply Form */}
          <form onSubmit={handleSendMessage} className="p-2.5 bg-white border-t border-slate-100 flex items-center gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Trả lời ${selectedChat.userName}...`}
              className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              autoFocus
            />
            <button
              type="submit"
              disabled={!replyText.trim()}
              className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      ) : (
        /* Conversations List */
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search Box */}
          <div className="p-2.5 border-b border-slate-100 bg-slate-50/70">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input
                type="text"
                value={chatSearch}
                onChange={(e) => setChatSearch(e.target.value)}
                placeholder="Tìm người dùng hoặc MSSV..."
                className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredConversations.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                Không tìm thấy hội thoại phù hợp
              </div>
            ) : (
              filteredConversations.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedChat(item)}
                  className="w-full p-3 flex items-start gap-3 hover:bg-slate-50 text-left transition-colors cursor-pointer group"
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                      {item.userName.charAt(0)}
                    </div>
                    {item.online && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                        {item.userName}
                      </span>
                      <span className="text-[10px] text-slate-400 flex-shrink-0">{item.time}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] text-slate-500 truncate leading-tight">
                        {item.lastMessage}
                      </p>
                      {item.unreadCount > 0 && (
                        <span className="px-1.5 py-0.2 min-w-[16px] text-center text-[10px] font-bold text-white bg-blue-600 rounded-full flex-shrink-0">
                          {item.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer inline-flex items-center gap-1"
            >
              <span>Xem tất cả danh sách hỗ trợ</span>
              <ExternalLink size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
