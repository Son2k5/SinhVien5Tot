import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppHeader } from '../../components/common/AppHeader';
import { SiteFooter } from '../../components/common/SiteFooter';
import { useArticle, usePublishedArticles } from './hooks/useNews';
import { ArticleBlockRenderer } from './ArticleBlockRenderer';
import { parseServerDate, formatRelativeTime } from '../../utils/date';
import { ArrowLeft, AlertCircle, Printer, RefreshCcw, ChevronRight, Share2, Bookmark } from 'lucide-react';

export function NewsDetailPage() {
  const { newsId } = useParams<{ newsId: string }>();
  const { data, isLoading, isError, error } = useArticle(newsId || '');
  const { data: recentNewsData } = usePublishedArticles({ pageSize: 6 });

  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 32);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (data?.title) {
      const originalTitle = document.title;
      document.title = `${data.title} | SV5T`;
      return () => {
        document.title = originalTitle;
      };
    }
  }, [data?.title]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 font-['Be_Vietnam_Pro',_sans-serif]">
        <AppHeader scrolled={scrolled} scrollProgress={0} mobileOpen={mobileOpen} onToggleMobile={() => setMobileOpen(!mobileOpen)} onCloseMobile={() => setMobileOpen(false)} />
        <main className="flex-1 pb-24 px-4">
        <div className="max-w-4xl mx-auto space-y-8 animate-pulse">
          <div className="w-24 h-6 bg-slate-200 rounded-full" />
          <div className="w-full h-12 bg-slate-200 rounded-xl" />
          <div className="w-2/3 h-12 bg-slate-200 rounded-xl" />
          <div className="flex gap-4">
            <div className="w-32 h-6 bg-slate-200 rounded" />
            <div className="w-32 h-6 bg-slate-200 rounded" />
          </div>
          <div className="w-full aspect-[21/9] bg-slate-200 rounded-2xl" />
          <div className="space-y-4">
            <div className="w-full h-4 bg-slate-200 rounded" />
            <div className="w-full h-4 bg-slate-200 rounded" />
            <div className="w-5/6 h-4 bg-slate-200 rounded" />
          </div>
        </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (isError || !data) {
    const is404 = (error as any)?.response?.status === 404;
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 font-['Be_Vietnam_Pro',_sans-serif]">
        <AppHeader scrolled={scrolled} scrollProgress={0} mobileOpen={mobileOpen} onToggleMobile={() => setMobileOpen(!mobileOpen)} onCloseMobile={() => setMobileOpen(false)} />
        <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-sm border border-slate-200">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            {is404 ? 'Không tìm thấy bài viết' : 'Đã có lỗi xảy ra'}
          </h2>
          <p className="text-slate-600 mb-8">
            {is404 
              ? 'Bài viết bạn đang tìm kiếm có thể đã bị xóa hoặc không tồn tại.' 
              : 'Không thể tải nội dung bài viết lúc này. Vui lòng thử lại sau.'}
          </p>
          <Link 
            to="/news"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors shadow-sm cursor-pointer w-full"
          >
            <ArrowLeft size={18} />
            <span>Quay lại danh sách tin tức</span>
          </Link>
        </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const publishedDate = parseServerDate(data.publishedAt);
  const now = Date.now();
  const recentArticles = (recentNewsData?.items || []).filter(item => item.id !== data?.id).slice(0, 5);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-['Arial',sans-serif] text-[14px] font-normal">
      <AppHeader scrolled={scrolled} scrollProgress={0} mobileOpen={mobileOpen} onToggleMobile={() => setMobileOpen(!mobileOpen)} onCloseMobile={() => setMobileOpen(false)} />
      <main className="flex-1 pb-24 bg-white">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 lg:mt-10 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_270px] gap-8">
        
        {/* Main Article Content */}
        <article className="min-w-0">
          {/* Breadcrumbs */}
          <div className="mb-5">
            <nav className="flex flex-wrap items-center gap-2 text-[11px] sm:text-[13px] font-bold text-slate-500 uppercase tracking-wider">
              <Link to="/" className="hover:text-red-700 transition-colors">TRANG CHỦ</Link>
              <ChevronRight size={14} className="text-slate-300" />
              <Link to="/news" className="hover:text-red-700 transition-colors">TIN TỨC - SỰ KIỆN</Link>
            </nav>
          </div>
          
          {/* Header */}
          <header className="space-y-3 mb-8 pb-6 border-b border-slate-200">
            <h1 className="text-[28px] sm:text-[32px] lg:text-[36px] font-semibold text-slate-900 leading-[1.3]">
              {data.title}
            </h1>
            <div className="text-[13px] text-slate-500 font-medium flex items-center gap-1.5 pt-1">
              Thứ {publishedDate.getDay() === 0 ? 'Chủ nhật' : publishedDate.getDay() + 1}, {new Intl.DateTimeFormat('vi-VN', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
              }).format(publishedDate)}
            </div>
            {data.excerpt && (
              <p className="max-w-[78ch] pt-2 text-[14px] font-normal leading-[1.8] text-slate-600">
                {data.excerpt}
              </p>
            )}
          </header>

          {/* Mobile Actions - shown inline on mobile */}
          <div className="sm:hidden flex items-center gap-4 py-3 border-y border-slate-100 mb-6 text-slate-600">
            <button title="Chia sẻ" className="flex items-center gap-1.5 text-sm font-medium hover:text-red-700"><Share2 size={16} /> Chia sẻ</button>
            <button title="Lưu" className="flex items-center gap-1.5 text-sm font-medium hover:text-red-700"><Bookmark size={16} /> Lưu</button>
            <button title="In bài viết" onClick={() => window.print()} className="flex items-center gap-1.5 text-sm font-medium hover:text-red-700"><Printer size={16} /> In</button>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 lg:gap-8 relative">
            {/* Left Action Bar (Floating vertical style) */}
            <div className="hidden sm:block shrink-0 w-14">
              <div className="sticky top-28 flex flex-col items-center gap-3 py-4 px-2 bg-white rounded-full shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-slate-100/80">
                <button title="Chia sẻ" className="p-2.5 text-slate-600 hover:text-red-700 transition-colors rounded-full hover:bg-slate-50 cursor-pointer">
                  <Share2 size={18} />
                </button>
                <div className="w-8 h-[1px] bg-slate-100" />
                <button title="Lưu bài viết" className="p-2.5 text-slate-600 hover:text-red-700 transition-colors rounded-full hover:bg-slate-50 cursor-pointer">
                  <Bookmark size={18} />
                </button>
                <div className="w-8 h-[1px] bg-slate-100" />
                <button title="Làm mới" onClick={() => window.location.reload()} className="p-2.5 text-slate-600 hover:text-red-700 transition-colors rounded-full hover:bg-slate-50 cursor-pointer">
                  <RefreshCcw size={18} />
                </button>
                <div className="w-8 h-[1px] bg-slate-100" />
                <button title="In bài viết" onClick={() => window.print()} className="p-2.5 text-slate-600 hover:text-red-700 transition-colors rounded-full hover:bg-slate-50 cursor-pointer">
                  <Printer size={18} />
                </button>
              </div>
            </div>

            {/* Right Content */}
            <div className="flex-1 min-w-0">
              {/* Content */}
              <div className="max-w-none font-['Arial',sans-serif] text-[14px] font-normal leading-[1.8]">
                <ArticleBlockRenderer blocks={data.blocks} />
              </div>
            </div>
          </div>
        </article>

        {/* Sidebar */}
        <aside className="space-y-8 mt-10 lg:mt-0">
          <div className="sticky top-24">
            <h3 className="text-[14px] font-bold text-red-800 uppercase tracking-wide mb-4 pb-2 border-b-2 border-red-800/10 flex items-center justify-between">
              <span>Tin tức nổi bật</span>
            </h3>
            
            <div className="space-y-4">
              {recentArticles.length > 0 ? recentArticles.map(item => (
                <Link key={item.id} to={`/news/${item.id}`} className="group flex gap-3 items-start">
                  {item.coverImage && (
                    <div className="w-24 h-16 shrink-0 rounded-lg overflow-hidden bg-slate-100 border border-slate-150">
                      <img src={item.coverImage.url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[13px] font-semibold text-slate-800 group-hover:text-red-700 transition-colors line-clamp-3 leading-[1.45] mb-1">
                      {item.title}
                    </h4>
                    <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">
                      {formatRelativeTime(parseServerDate(item.publishedAt), now)}
                    </span>
                  </div>
                </Link>
              )) : (
                <div className="text-sm text-slate-500">Chưa có bài viết nào khác.</div>
              )}
            </div>
          </div>
        </aside>

      </div>
      </main>
      <SiteFooter />
    </div>
  );
}
