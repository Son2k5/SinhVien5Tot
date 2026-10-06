import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { AppHeader } from '../../components/common/AppHeader';
import { SiteFooter } from '../../components/common/SiteFooter';
import { usePublishedArticles } from './hooks/useNews';
import { parseServerDate, formatRelativeTime } from '../../utils/date';
import { Search, ChevronLeft, ChevronRight, Pin, AlertCircle } from 'lucide-react';

const CATEGORIES = [
  { value: '', label: 'Tất cả' },
  { value: 'News', label: 'Tin tức' },
  { value: 'Announcement', label: 'Thông báo' },
  { value: 'Event', label: 'Sự kiện' },
];

export function NewsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || '';
  const initialQ = searchParams.get('q') || '';
  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = 20;

  const [category, setCategory] = useState(initialCategory);
  const [q, setQ] = useState(initialQ);
  const [debouncedQ, setDebouncedQ] = useState(initialQ);
  const [page, setPage] = useState(initialPage);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 32);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQ(q.length >= 2 ? q : '');
    }, 300);
    return () => clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    setPage(1); // Reset page on filter change
  }, [category, debouncedQ]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (debouncedQ) params.set('q', debouncedQ);
    if (page > 1) params.set('page', page.toString());
    setSearchParams(params, { replace: true });
  }, [category, debouncedQ, page, setSearchParams]);

  const { data, isLoading, isError, refetch } = usePublishedArticles({
    category: category || undefined,
    q: debouncedQ || undefined,
    page,
    pageSize,
  });

  const handleCategoryClick = (val: string) => setCategory(val);
  const handleNextPage = () => setPage(p => p + 1);
  const handlePrevPage = () => setPage(p => Math.max(1, p - 1));

  const now = Date.now();

  const renderTable = (title: string, items: any[], showEmpty = true) => {
    if (items.length === 0 && !showEmpty) return null;
    
    return (
      <div className="mb-8">
        <h2 className="text-lg font-bold text-slate-800 mb-3 px-1">{title}</h2>
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-[0_8px_30px_-12px_rgba(30,58,138,0.18)] overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="tbl-div border-collapse text-xs w-full min-w-[900px]">
              <thead>
                <tr className="bg-[#ECEDEF] border-y border-[#D9DCE1] text-black select-none">
                  <th className="px-3 py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black w-[5%]">STT</th>
                  <th className="px-3 py-3.5 text-left font-th-inter text-[12px] uppercase tracking-[0.04em] text-black w-[30%]">Bài viết</th>
                  <th className="px-3 py-3.5 text-left font-th-inter text-[12px] uppercase tracking-[0.04em] text-black w-[40%]">Mô tả</th>
                  <th className="px-3 py-3.5 text-left font-th-inter text-[12px] uppercase tracking-[0.04em] text-black w-[15%]">Cập nhật (Người đăng)</th>
                  <th className="px-3 py-3.5 text-center font-th-inter text-[12px] uppercase tracking-[0.04em] text-black w-[10%]">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80 [&>tr:nth-child(even)]:bg-slate-50/50">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      <div className="text-sm font-medium text-slate-600">Chưa có {title.toLowerCase()} nào</div>
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => {
                    const publishedDate = parseServerDate(item.publishedAt);
                    return (
                      <tr key={item.id} className="hover:bg-blue-50/60 transition-colors duration-200 hover:shadow-[inset_2px_0_0_0_#3b82f6]">
                        <td className="px-3 py-3 text-center align-middle font-medium text-slate-600">
                          {idx + 1 + (page - 1) * pageSize}
                        </td>
                        <td className="px-3 py-3 align-middle">
                          <Link to={`/news/${item.id}`} className="font-semibold text-blue-600 hover:text-blue-800 hover:underline line-clamp-2">
                            {item.isPinned && <Pin size={12} className="inline mr-1 text-rose-500" />}
                            {item.title}
                          </Link>
                        </td>
                        <td className="px-3 py-3 align-middle">
                          <p className="text-slate-600 line-clamp-2 text-xs leading-relaxed">{item.excerpt}</p>
                        </td>
                        <td className="px-3 py-3 align-middle font-medium text-slate-700">
                          {item.authorName}
                        </td>
                        <td className="px-3 py-3 text-center align-middle text-slate-500 whitespace-nowrap">
                          {formatRelativeTime(publishedDate, now)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const tinTucItems = (data?.items || []).filter(item => item.category === 'News' || item.category === 'Event' || !item.category);
  const thongBaoItems = (data?.items || []).filter(item => item.category === 'Announcement');

  return (
    <div className="min-h-screen bg-slate-50 font-['Be_Vietnam_Pro',_sans-serif] flex flex-col">
      <AppHeader scrolled={scrolled} scrollProgress={0} mobileOpen={mobileOpen} onToggleMobile={() => setMobileOpen(!mobileOpen)} onCloseMobile={() => setMobileOpen(false)} />
      
      {/* Header Area */}
      <div className="bg-white border-b border-slate-200 py-10 lg:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            Tin tức & Thông báo
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto text-sm sm:text-base">
            Cập nhật những thông tin mới nhất, hoạt động nổi bật và các thông báo quan trọng.
          </p>
        </div>
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 space-y-6">
        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none">
            {CATEGORIES.map(c => (
              <button
                key={c.value}
                onClick={() => handleCategoryClick(c.value)}
                className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-semibold transition-colors cursor-pointer ${
                  category === c.value 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64 lg:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Tìm kiếm bài viết..."
              value={q}
              onChange={e => setQ(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-md border border-slate-300 hover:border-slate-400 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/25 focus:border-blue-500 transition-colors shadow-sm placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Content Area */}
        {isError ? (
          <div className="text-center py-20 bg-white rounded-xl border border-slate-200 shadow-sm">
            <AlertCircle size={40} className="text-rose-500 mx-auto mb-4" />
            <p className="text-slate-600 mb-4 font-medium">Đã có lỗi xảy ra khi tải dữ liệu.</p>
            <button 
              onClick={() => refetch()}
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
            >
              Thử lại
            </button>
          </div>
        ) : isLoading ? (
          <div className="space-y-8">
            <div className="w-full h-[250px] bg-slate-200/50 rounded-xl animate-pulse border border-slate-200" />
            <div className="w-full h-[250px] bg-slate-200/50 rounded-xl animate-pulse border border-slate-200" />
          </div>
        ) : data?.items.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-slate-200 border-dashed">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Không tìm thấy bài viết nào</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              Hãy thử thay đổi từ khóa tìm kiếm hoặc chọn danh mục khác.
            </p>
          </div>
        ) : (
          <div>
            {(category === '' || category === 'News' || category === 'Event') && renderTable("Tin tức", tinTucItems, category !== '')}
            {(category === '' || category === 'Announcement') && renderTable("Thông báo", thongBaoItems, category !== '')}

            {/* Pagination */}
            {data && data.total > data.pageSize && (
              <div className="flex items-center justify-center gap-4 pt-4 pb-8">
                <button
                  onClick={handlePrevPage}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-sm"
                  aria-label="Trang trước"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-sm font-semibold text-slate-700">
                  Trang {page} / {Math.ceil(data.total / data.pageSize)}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={page * data.pageSize >= data.total}
                  className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-sm"
                  aria-label="Trang sau"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
