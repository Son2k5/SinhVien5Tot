import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CalendarDays, Clock3, MapPin, Newspaper, Share2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { BrandLogo } from '../components/common/BrandLogo';
import { SiteFooter } from '../components/common/SiteFooter';
import { resolveNewsItems } from '../mocks/welcomeContent';
import { welcomeService } from '../services/welcomeService';

const longDateFormatter = new Intl.DateTimeFormat('vi-VN', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('vi-VN', {
  hour: '2-digit',
  minute: '2-digit',
});

function formatLongDate(value: string): string {
  return longDateFormatter.format(new Date(value));
}

function formatTime(value: string): string {
  return timeFormatter.format(new Date(value));
}

export function NewsDetailPage() {
  const { newsId = '' } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ['welcome-dashboard', 'news-detail'],
    queryFn: welcomeService.getDashboard,
  });
  const newsItems = resolveNewsItems(data?.news);
  const article = newsItems.find((item) => item.id === newsId);

  if (isLoading && !article) {
    return <div className={`[--news-blue:#2463eb] [--news-navy:#11295f] min-h-dvh text-[#263b64] bg-[linear-gradient(180deg,#f7f9fe,#fff)] font-['Be_Vietnam_Pro',ui-sans-serif,system-ui,sans-serif]`}><div className={`min-h-dvh grid place-items-center content-center text-center text-[#71809c] text-[11px]`} role='status'>Đang tải bản tin...</div><SiteFooter /></div>;
  }

  if (!article) {
    return (
      <div className={`[--news-blue:#2463eb] [--news-navy:#11295f] min-h-dvh text-[#263b64] bg-[linear-gradient(180deg,#f7f9fe,#fff)] font-['Be_Vietnam_Pro',ui-sans-serif,system-ui,sans-serif]`}>
        <main className={`min-h-dvh grid place-items-center content-center text-center gap-[9px] text-[#8796ae] [&_h1]:m-[5px_0_0] [&_h1]:text-[#243c6b] [&_h1]:[font:800_26px_'Be_Vietnam_Pro',sans-serif] [&_p]:m-0 [&_p]:text-[10px] [&_a]:min-h-[42px] [&_a]:mt-[12px] [&_a]:px-[14px] [&_a]:flex [&_a]:items-center [&_a]:gap-[7px] [&_a]:text-white [&_a]:rounded-[12px] [&_a]:bg-[var(--news-blue)] [&_a]:text-[9.5px] [&_a]:font-extrabold`}>
          <Newspaper size={34} />
          <h1>Không tìm thấy bản tin</h1>
          <p>Nội dung có thể đã được di chuyển hoặc chưa được đồng bộ.</p>
          <Link to='/dashboard'><ArrowLeft size={17} /> Quay lại trang chào mừng</Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className={`[--news-blue:#2463eb] [--news-navy:#11295f] min-h-dvh text-[#263b64] bg-[linear-gradient(180deg,#f7f9fe,#fff)] font-['Be_Vietnam_Pro',ui-sans-serif,system-ui,sans-serif]`}>
      <header className={`sticky z-[20] top-[0] h-[78px] border-b border-b-[#e1e8f4] bg-[rgba(255,255,255,.9)] backdrop-blur-[17px] max-[760px]:h-[68px] max-[760px]:[&_.brand-logo__copy]:hidden`}>
        <div className={`w-[min(1180px,calc(100%_-_40px))] h-full m-[auto] flex items-center justify-between [&>a]:inline-flex [&>a]:items-center [&>a]:gap-[7px] [&>a]:text-[#53698e] [&>a]:text-[10px] [&>a]:font-extrabold [&>a:hover]:text-[var(--news-blue)] max-[760px]:[&>a]:text-[9px]`}>
          <Link to='/dashboard' className="cursor-pointer transition-opacity hover:opacity-90 flex items-center" aria-label="Về trang tổng quan">
            <BrandLogo />
          </Link>
          <Link to='/dashboard'><ArrowLeft size={16} /> Trang chào mừng</Link>
        </div>
      </header>
      <main className={`w-[min(1080px,calc(100%_-_40px))] m-[auto] p-[28px_0_70px] max-[760px]:w-[calc(100%_-_24px)] max-[760px]:pt-[18px]`}>
        <Link to='/dashboard' className={`inline-flex items-center gap-[7px] text-[#53698e] text-[10px] font-extrabold hover:text-[var(--news-blue)] w-[max-content] mb-[18px]`}><ArrowLeft size={16} /> Quay lại</Link>
        <article className={`overflow-hidden border border-[#e0e7f3] rounded-[27px] bg-white shadow-[0_20px_65px_rgba(27,52,103,.09)] [&>figure]:h-[min(52vw,520px)] [&>figure]:m-[0_18px] [&>figure]:overflow-hidden [&>figure]:rounded-[20px] [&>figure]:bg-[#e8eef8] [&>figure_img]:w-full [&>figure_img]:h-full [&>figure_img]:object-cover max-[760px]:rounded-[21px] max-[760px]:[&>figure]:h-[260px] max-[760px]:[&>figure]:m-[0_10px] max-[760px]:[&>figure]:rounded-[16px]`}>
          <div className={`max-w-[860px] m-[auto] p-[46px_38px_30px] text-center [&>span]:inline-flex [&>span]:p-[7px_11px] [&>span]:text-[var(--news-blue)] [&>span]:rounded-full [&>span]:bg-[#edf3ff] [&>span]:text-[8px] [&>span]:font-extrabold [&>span]:uppercase [&_h1]:m-[17px_0_13px] [&_h1]:text-[var(--news-navy)] [&_h1]:[font:800_clamp(29px,4vw,46px)/1.18_'Be_Vietnam_Pro',sans-serif] [&_h1]:tracking-[-1.5px] [&>p]:max-w-[720px] [&>p]:m-[auto] [&>p]:text-[#71809c] [&>p]:text-[11px] [&>p]:leading-[1.75] max-[760px]:p-[31px_20px_24px] max-[760px]:[&_h1]:text-[30px] max-[760px]:[&_h1]:tracking-[-1px]`}>
            <span>{article.category}</span>
            <h1>{article.title}</h1>
            <p>{article.summary}</p>
            <div className={`mt-[20px] flex items-center justify-center flex-wrap gap-[9px] [&>span]:min-h-[31px] [&>span]:px-[10px] [&>span]:inline-flex [&>span]:items-center [&>span]:gap-[6px] [&>span]:text-[#74839e] [&>span]:border [&>span]:border-[#e2e8f2] [&>span]:rounded-full [&>span]:bg-[#fafbfe] [&>span]:text-[8.5px] max-[760px]:gap-[6px]`}>
              <span><CalendarDays size={15} /> {formatLongDate(article.publishedAtUtc)}</span>
              <span><Clock3 size={15} /> {formatTime(article.eventStartAtUtc)}</span>
              <span><MapPin size={15} /> {article.location}</span>
            </div>
          </div>
          <figure><img src={article.imageUrl} alt={article.title} /></figure>
          <div className={`p-[38px] grid grid-cols-[minmax(0,1fr)_285px] items-[start] gap-[38px] [&_aside]:sticky [&_aside]:top-[104px] [&_aside]:p-[20px] [&_aside]:border [&_aside]:border-[#dfe7f5] [&_aside]:rounded-[18px] [&_aside]:bg-[#f8faff] [&_aside>strong]:text-[#1d376d] [&_aside>strong]:[font:800_14px_'Be_Vietnam_Pro',sans-serif] [&_aside_p]:m-[15px_0_0] [&_aside_p]:flex [&_aside_p]:items-start [&_aside_p]:gap-[9px] [&_aside_p]:text-[var(--news-blue)] [&_aside_p_span]:grid [&_aside_p_span]:gap-[3px] [&_aside_p_span]:text-[#4e6080] [&_aside_p_span]:text-[9px] [&_aside_p_span]:leading-[1.5] [&_aside_p_small]:text-[#8996ac] [&_aside_p_small]:text-[7.5px] [&_aside_p_small]:uppercase [&_aside_button]:w-full [&_aside_button]:min-h-[42px] [&_aside_button]:mt-[20px] [&_aside_button]:flex [&_aside_button]:items-center [&_aside_button]:justify-center [&_aside_button]:gap-[7px] [&_aside_button]:text-white [&_aside_button]:border-0 [&_aside_button]:rounded-[12px] [&_aside_button]:bg-[var(--news-blue)] [&_aside_button]:cursor-pointer [&_aside_button]:text-[9.5px] [&_aside_button]:font-extrabold max-[760px]:p-[25px_20px] max-[760px]:grid-cols-[1fr] max-[760px]:gap-[24px] max-[760px]:[&_aside]:static`}>
            <div className={`text-[#4f6180] text-[11.5px] leading-[1.9] [&_p]:m-[0_0_18px] [&_p:first-child:first-letter]:float-left [&_p:first-child:first-letter]:m-[6px_8px_0_0] [&_p:first-child:first-letter]:text-[var(--news-blue)] [&_p:first-child:first-letter]:[font:800_42px/32px_'Be_Vietnam_Pro',sans-serif] [&_blockquote]:m-[26px_0_0] [&_blockquote]:p-[18px_20px] [&_blockquote]:text-[#2d4c85] [&_blockquote]:border-l-[length:4px] [&_blockquote]:border-solid [&_blockquote]:border-l-[var(--news-blue)] [&_blockquote]:rounded-[0_13px_13px_0] [&_blockquote]:bg-[#f2f6ff] [&_blockquote]:text-[10.5px] [&_blockquote]:font-semibold`}>
              {article.content.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              <blockquote>Hãy theo dõi hệ thống Sinh viên 5 tốt để không bỏ lỡ các thông báo và hoạt động mới nhất.</blockquote>
            </div>
            <aside>
              <strong>Thông tin sự kiện</strong>
              <p><CalendarDays size={16} /><span><small>Thời gian</small>{formatLongDate(article.eventStartAtUtc)} · {formatTime(article.eventStartAtUtc)}</span></p>
              <p><MapPin size={16} /><span><small>Địa điểm</small>{article.location}</span></p>
              <button type='button'><Share2 size={16} /> Chia sẻ bản tin</button>
            </aside>
          </div>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
