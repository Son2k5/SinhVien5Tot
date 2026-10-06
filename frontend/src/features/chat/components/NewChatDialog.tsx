import { useState, useRef, useEffect } from 'react';
import { Search, X, Loader2, MessageSquarePlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore';
import { useChatSearch, useSuggestedContacts, useStartConversation, useStartSupport } from '../hooks/useChat';

interface NewChatDialogProps {
  open: boolean;
  onClose: () => void;
}

export function NewChatDialog({ open, onClose }: NewChatDialogProps) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'All' | 'Students' | 'Staff'>('All');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isStudent = user?.role === 'student';

  const { data: searchResults, isFetching: isSearching } = useChatSearch(q, filter);
  const { data: suggestedContacts, isLoading: isSuggestedLoading } = useSuggestedContacts();
  const startConversation = useStartConversation();
  const startSupport = useStartSupport();

  const showSuggestions = q.trim().length < 2;
  const items = showSuggestions ? (suggestedContacts || []) : (searchResults || []);

  useEffect(() => {
    if (open) {
      setQ('');
      setFilter('All');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [q, filter, items.length]);

  const handleSelect = async (contact: typeof items[0]) => {
    if (contact.existingConversationId) {
      navigate(`/chat/${contact.existingConversationId}`);
      onClose();
    } else {
      try {
        const res = await startConversation.mutateAsync(contact.userId);
        navigate(`/chat/${res.conversationId}`);
        onClose();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSupport = async () => {
    try {
      const res = await startSupport.mutateAsync(undefined);
      navigate(`/chat/${res.conversationId}`);
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (items[selectedIndex]) {
        handleSelect(items[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 font-['Be_Vietnam_Pro']" onClick={onClose}>
      <div 
        className="w-full max-w-lg bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-slate-800 placeholder:text-slate-400 text-sm"
            placeholder="Tìm kiếm theo tên, email, MSSV..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={handleKeyDown}
            role="combobox"
            aria-expanded="true"
            aria-activedescendant={items[selectedIndex] ? `contact-${items[selectedIndex].userId}` : undefined}
          />
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isStudent && (
          <div className="px-4 pt-3 flex gap-2">
            {(['All', 'Students', 'Staff'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${filter === f ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {f === 'All' ? 'Tất cả' : f === 'Students' ? 'Sinh viên' : 'Mentor & Admin'}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-2 min-h-[300px]">
          {showSuggestions && (
            <div className="mb-2">
              <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Gợi ý
              </div>
              <button
                onClick={handleSupport}
                className="w-full text-left p-3 rounded-xl flex items-center gap-3 hover:bg-blue-50 transition-colors mb-2 border border-blue-100/50"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <MessageSquarePlus className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-slate-800">Nhắn hỗ trợ</div>
                  <div className="text-xs text-slate-500">Kết nối ngay với Admin/Mentor</div>
                </div>
              </button>
            </div>
          )}

          {(!showSuggestions && isSearching) || (showSuggestions && isSuggestedLoading) ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span className="text-sm">Đang tải...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                <Search className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium">Không tìm thấy kết quả</span>
            </div>
          ) : (
            <div className="space-y-1">
              {items.map((contact, index) => (
                <button
                  key={contact.userId}
                  id={`contact-${contact.userId}`}
                  onClick={() => handleSelect(contact)}
                  className={`w-full text-left p-2.5 rounded-xl flex items-center gap-3 transition-colors ${index === selectedIndex ? 'bg-slate-100 ring-1 ring-slate-200' : 'hover:bg-slate-50'}`}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0 overflow-hidden text-slate-600 font-bold flex items-center justify-center text-sm border border-slate-200">
                    {contact.avatarUrl ? (
                      <img src={contact.avatarUrl} alt={contact.displayName} className="w-full h-full object-cover" />
                    ) : (
                      contact.displayName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-800 truncate">{contact.displayName}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 whitespace-nowrap">
                        {contact.roleLabel}
                      </span>
                    </div>
                    {contact.unitLabel && (
                      <div className="text-xs text-slate-500 truncate">{contact.unitLabel}</div>
                    )}
                    {contact.reason && showSuggestions && (
                      <div className="text-[11px] text-blue-600 mt-0.5">{contact.reason}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
