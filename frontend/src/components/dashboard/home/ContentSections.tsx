import { ArrowRight, ArrowUpRight, Clock3, MapPin, Quote, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { WelcomeNewsItem } from '../../../mocks/welcomeContent';
import {
  formatDate,
  formatEventTime,
  getEventCalendar,
  portalSourceLabels,
} from './homeDashboardConfig';

interface NewsItemsProps {
  items: WelcomeNewsItem[];
}

export function FeaturedActivitiesSection({ items }: NewsItemsProps) {
  const featuredItems = items.slice(0, 3);
  const primaryItem = featuredItems[0];
  const supportingItems = featuredItems.slice(1);
  const primaryCalendar = primaryItem ? getEventCalendar(primaryItem.eventStartAtUtc) : null;

  return (
    <section className="space-y-4 sm:space-y-5 scroll-mt-24" aria-labelledby="featured-title">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <span className="text-[11px] font-bold text-blue-600 tracking-wider uppercase">Lịch hẹn dành cho bạn</span>
          <h2 id="featured-title" className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Hoạt động nổi bật
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-normal max-w-xl mt-1">
            Những điểm hẹn đáng chú ý để bạn trải nghiệm, kết nối và viết tiếp hành trình Sinh viên 5 tốt.
          </p>
        </div>
        {primaryItem && (
          <Link
            to={'/news/' + primaryItem.id}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-semibold transition-colors shadow-sm cursor-pointer w-fit"
          >
            <span>Khám phá chi tiết</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {featuredItems.length === 0 || !primaryItem || !primaryCalendar ? (
        <div className="p-12 text-center bg-white border border-dashed border-slate-200 rounded-2xl">
          <p className="text-sm font-semibold text-slate-800">Chưa có hoạt động nổi bật</p>
          <p className="text-xs text-slate-500 mt-1">Nội dung mới sẽ sớm được cập nhật.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* Main Primary Feature Card */}
          <Link
            to={'/news/' + primaryItem.id}
            className="group lg:col-span-7 relative min-h-[380px] sm:min-h-[420px] rounded-2xl overflow-hidden bg-slate-900 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between p-6 sm:p-8 text-white cursor-pointer"
          >
            <img
              src={primaryItem.imageUrl}
              alt={primaryItem.title}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-slate-950/20 pointer-events-none"
              aria-hidden="true"
            />

            {/* Top Bar: Highlight Badge + Date Stamp */}
            <div className="relative z-10 flex items-start justify-between gap-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600/90 backdrop-blur-sm text-white text-[11px] font-bold tracking-wide uppercase shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tâm điểm tuần này</span>
              </span>

              <div className="w-14 h-14 rounded-xl bg-white/95 backdrop-blur-sm text-slate-800 flex flex-col items-center justify-center shadow-md flex-shrink-0">
                <span className="text-xl font-bold leading-none text-blue-600">{primaryCalendar.day}</span>
                <span className="text-[10px] font-bold text-slate-600 uppercase mt-0.5">{primaryCalendar.month}</span>
              </div>
            </div>

            {/* Bottom Content */}
            <article className="relative z-10 space-y-3 pt-12">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/90 text-white text-[10px] font-bold uppercase tracking-wider">
                {primaryItem.category}
              </span>
              <h3 className="text-lg sm:text-2xl font-bold leading-snug text-white group-hover:text-blue-200 transition-colors">
                {primaryItem.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-200 font-normal line-clamp-2 leading-relaxed">
                {primaryItem.summary}
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-slate-300">
                <span className="inline-flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-lg font-medium">
                  <Clock3 className="w-3.5 h-3.5 text-blue-400" />
                  <span>{formatEventTime(primaryItem.eventStartAtUtc)}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-lg font-medium">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{primaryItem.location}</span>
                </span>
              </div>
            </article>
          </Link>

          {/* Supporting Items */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {supportingItems.map((item) => {
              const calendar = getEventCalendar(item.eventStartAtUtc);
              return (
                <Link
                  key={item.id}
                  to={'/news/' + item.id}
                  className="group flex-1 flex flex-col sm:flex-row items-stretch gap-4 p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="relative w-full sm:w-36 h-36 sm:h-auto rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg bg-white/95 backdrop-blur-sm text-slate-800 text-center shadow-sm">
                      <span className="text-xs font-bold leading-none text-blue-600 block">{calendar.day}</span>
                      <span className="text-[9px] font-bold text-slate-600 uppercase">{calendar.month}</span>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col justify-between space-y-2 py-0.5">
                    <div className="space-y-1">
                      <span className="inline-block text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {item.category}
                      </span>
                      <h4 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {item.title}
                      </h4>
                    </div>

                    <div className="space-y-1 text-[11px] text-slate-600 font-normal">
                      <div className="flex items-center gap-1.5 truncate">
                        <Clock3 className="w-3 h-3 text-blue-600 flex-shrink-0" />
                        <span>{formatEventTime(item.eventStartAtUtc)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                        <span className="truncate">{item.location}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

function NewsMarqueeGroup({ items, duplicate = false }: NewsItemsProps & { duplicate?: boolean }) {
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
          className="group relative w-[300px] sm:w-[320px] shrink-0 bg-white border border-slate-200/90 hover:border-blue-300 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-150 flex flex-col justify-between"
        >
          <div className="relative h-40 overflow-hidden bg-slate-100">
            <img
              src={item.imageUrl}
              alt={item.title}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <span className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-sm text-[10px] font-bold text-slate-700 shadow-sm">
              {item.category}
            </span>
          </div>

          <article className="p-4 flex-1 flex flex-col justify-between space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                <span className="font-bold text-blue-600 truncate">{portalSourceLabels[item.source]}</span>
                <time dateTime={item.publishedAtUtc}>{formatDate(item.publishedAtUtc)}</time>
              </div>
              <h4 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                {item.title}
              </h4>
              <p className="text-xs text-slate-600 font-normal line-clamp-2 leading-relaxed">
                {item.summary}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 truncate max-w-[170px]">
                <MapPin className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                <span className="truncate">{item.location}</span>
              </span>
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

export function NewsSection({ items }: NewsItemsProps) {
  const newsItems = items;

  return (
    <section className="space-y-4 sm:space-y-5 scroll-mt-24" aria-labelledby="news-title">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <span className="text-[11px] font-bold text-blue-600 tracking-wider uppercase">Bắt nhịp sinh viên</span>
          <h2 id="news-title" className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Tin tức &amp; sự kiện
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-normal max-w-xl mt-1">
            Lướt qua những câu chuyện mới, sự kiện đáng chú ý và nhịp sống sinh viên đang diễn ra mỗi ngày.
          </p>
        </div>
      </div>

      {newsItems.length === 0 ? (
        <div className="p-12 text-center bg-white border border-dashed border-slate-200 rounded-2xl">
          <p className="text-sm font-semibold text-slate-800">Chưa có tin tức</p>
          <p className="text-xs text-slate-500 mt-1">Nội dung mới sẽ sớm được cập nhật.</p>
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
