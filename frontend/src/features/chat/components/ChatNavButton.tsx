import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { useUnreadTotal } from '../hooks/useChat';

export function ChatNavButton() {
  const { data } = useUnreadTotal();
  const count = data?.count || 0;

  return (
    <div className="relative">
      <Link
        to="/chat"
        className="flex w-10 h-10 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-blue-600 items-center justify-center transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 active:scale-95"
        title="Tin nhắn"
        aria-label="Tin nhắn"
      >
        <MessageCircle size={18} aria-hidden="true" />
        {count > 0 && (
          <span className="absolute top-1 right-1 min-w-[15px] h-[15px] px-1 grid place-items-center text-white bg-blue-600 font-['JetBrains_Mono'] text-[9px] font-extrabold rounded-full ring-2 ring-white">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </Link>
    </div>
  );
}
