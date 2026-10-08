import { ArrowRight, Quote } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePublishedArticles } from '../../news/hooks/useNews';
import { formatDate } from './homeDashboardConfig';

function NewsMarqueeGroup({ items, duplicate = false }: { items: any[], duplicate?: boolean }) {
  return (
    <div
      className={`flex shrink-0 gap-4 pr-4 ${duplicate ? 'motion-reduce:hidden' : ''}`}
      aria-hidden={duplicate || undefined}
    >
      {items.map((item) => (
        <Link
          key={(duplicate ? 'duplicate-' : 'primary-') + item.id}
          to={'/news/' + item.id}
          tabIndex={duplicate ? -1 : undefined}
          aria-label={duplicate ? undefined : 'Đọc tin: ' + item.title}
          className="group relative w-[300px] sm:w-[320px] shrink-0 bg-white border border-slate-200/90 hover:border-blue-300 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-[box-shadow,border-color] duration-150 flex flex-col justify-between"
        >
          <div className="relative h-40 overflow-hidden bg-slate-100 flex items-center justify-center text-slate-300">
            {item.coverImage ? (
              <img
                src={item.coverImage.url}
                alt={item.title}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <span className="font-bold tracking-wider uppercase">SV5T</span>
            )}
            <span className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-sm text-[10px] font-bold text-slate-700 shadow-sm z-10">
              {item.category === 'News' ? 'Tin tức' : item.category === 'Announcement' ? 'Thông báo' : 'Sự kiện'}
            </span>
          </div>

          <article className="p-4 flex-1 flex flex-col justify-between space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                <span className="font-bold text-blue-600 truncate">{item.authorName}</span>
                <time dateTime={item.publishedAt}>{formatDate(item.publishedAt)}</time>
              </div>
              <h4 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                {item.title}
              </h4>
              <p className="text-xs text-slate-600 font-normal line-clamp-2 leading-relaxed">
                {item.excerpt}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end text-xs">
              <span className="inline-flex items-center gap-1 text-blue-600 font-bold group-hover:translate-x-0.5 transition-transform">
                <span>Đọc tin</span>
                <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </article>
        </Link>
      ))}
    </div>
  );
}

export function NewsSection() {
  const { data, isLoading } = usePublishedArticles({ pageSize: 6 });
  const newsItems = data?.items || [];

  if (!isLoading && newsItems.length === 0) return null;

  return (
    <section className="space-y-4 sm:space-y-5 scroll-mt-24" aria-labelledby="news-title">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 id="news-title" className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Tin tức &amp; sự kiện
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-normal max-w-xl mt-1">
            Lướt qua những câu chuyện mới, sự kiện đáng chú ý và nhịp sống sinh viên đang diễn ra mỗi ngày.
          </p>
        </div>
        <Link
          to="/news"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-semibold transition-colors shadow-sm cursor-pointer w-fit"
        >
          <span>Xem tất cả</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50 py-4 shadow-sm animate-pulse">
          <div className="flex gap-4 px-4 overflow-hidden">
            <div className="w-[300px] h-64 bg-slate-200 rounded-2xl shrink-0" />
            <div className="w-[300px] h-64 bg-slate-200 rounded-2xl shrink-0" />
            <div className="w-[300px] h-64 bg-slate-200 rounded-2xl shrink-0" />
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/40 py-4 shadow-sm">
          <div
            className="group flex w-max animate-[sv-news-marquee_40s_linear_infinite] hover:[animation-play-state:paused] focus-within:[animation-play-state:paused] motion-reduce:transform-none motion-reduce:animate-none"
            style={{ animationDuration: Math.max(newsItems.length * 7, 40) + 's' }}
          >
            <NewsMarqueeGroup items={newsItems} />
            <NewsMarqueeGroup items={newsItems} duplicate />
          </div>
        </div>
      )}
    </section>
  );
}

export function MotivationBanner() {
  return (
    <section
      aria-label="Thông điệp truyền cảm hứng"
      className="relative overflow-hidden bg-gradient-to-r from-blue-50/90 via-white to-blue-50/60 border border-blue-100 rounded-2xl p-6 sm:p-7 shadow-sm flex items-center gap-4 sm:gap-6"
    >
      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
        <Quote className="w-5 h-5" />
      </div>

      <div className="space-y-0.5 min-w-0">
        <p className="text-xs sm:text-sm text-slate-700 font-normal leading-relaxed">
          &ldquo;Hãy không ngừng nỗ lực để trở thành phiên bản tốt nhất của chính mình.&rdquo;
        </p>
        <p className="text-xs sm:text-sm font-bold text-blue-600">
          Hành trình 5 tốt – Hành trình kiến tạo tương lai!
        </p>
      </div>
    </section>
  );
}
