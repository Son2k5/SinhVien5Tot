import { ArrowUpRight, LayoutGrid, Quote, RefreshCw, Sparkles } from 'lucide-react';
import welcomeHero from '../../../assets/welcome-hero.jpg';
import { formatToday } from './homeDashboardConfig';

interface DashboardWelcomeBannerProps {
  displayName: string;
  isRefreshing: boolean;
  onOpenLauncher: () => void;
  onRefresh: () => void;
}

/* ── Organic blob clip-paths (CSS polygon / ellipse) ── */
const BLOB_MAIN =
  'polygon(30% 0%, 70% 0%, 92% 5%, 100% 25%, 98% 55%, 100% 78%, 92% 95%, 72% 100%, 45% 98%, 20% 100%, 5% 90%, 0% 70%, 2% 45%, 0% 20%, 8% 5%)';
const BLOB_BG =
  'polygon(25% 2%, 65% 0%, 88% 8%, 100% 30%, 96% 58%, 100% 82%, 88% 96%, 68% 100%, 40% 96%, 18% 100%, 2% 88%, 0% 65%, 4% 40%, 0% 18%, 10% 4%)';

export function DashboardWelcomeBanner({
  displayName,
  isRefreshing,
  onOpenLauncher,
  onRefresh,
}: DashboardWelcomeBannerProps) {
  return (
    <section
      aria-label="Lời chào và tổng quan"
      className="relative bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-7 lg:p-8 shadow-sm transition-all"
    >
      {/* Soft background radial nuance */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 -top-20 w-80 h-80 rounded-full bg-gradient-to-br from-blue-50/70 via-slate-50/40 to-transparent blur-3xl"
      />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
        {/* ─── Left Column: Greeting, Description, CTAs & Quote ─── */}
        <div className="lg:col-span-7 flex flex-col justify-start space-y-8">
          <div className="space-y-3.5">
            {/* Date Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50/90 border border-blue-100 text-blue-600 text-xs font-semibold tracking-wide uppercase shadow-xs w-fit">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span>{formatToday()}</span>
            </div>

            {/* Main Greeting Heading */}
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-semibold tracking-tight text-slate-900 leading-snug">
                Xin chào, <span className="text-blue-600 font-semibold">{displayName}</span>!
              </h1>
              <p className="text-xs sm:text-sm font-normal text-slate-600 leading-relaxed max-w-xl">
                Mỗi hành trình tốt đều bắt đầu từ những bước nhỏ. Hãy tiếp tục rèn luyện và lan tỏa giá trị tốt đẹp mỗi ngày!
              </p>
            </div>

            {/* Action CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={onOpenLauncher}
                className="inline-flex items-center justify-center gap-2 h-10 px-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 shadow-sm cursor-pointer"
              >
                <LayoutGrid className="w-4 h-4 " />
                <span>Khám phá chức năng</span>
              </button>

              <button
                type="button"
                disabled={isRefreshing}
                onClick={onRefresh}
                className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs sm:text-sm font-medium transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 cursor-pointer shadow-xs"
              >
                <RefreshCw
                  className={`w-4 h-4 text-slate-500 ${isRefreshing ? 'animate-spin text-blue-500' : ''}`}
                />
                <span>{isRefreshing ? 'Đang cập nhật...' : 'Làm mới dữ liệu'}</span>
              </button>
            </div>
          </div>

          {/* Inspirational Quote Card */}
          <div className="pt-1 border-t border-slate-100 flex items-start gap-3 text-slate-600">
            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
              <Quote className="w-3.5 h-3.5" />
            </div>
            <div className="space-y-0.5 text-xs">
              <p className="font-normal text-slate-600 leading-relaxed italic">
                &ldquo;Sinh viên 5 tốt không chỉ là danh hiệu, đó là hành trình rèn luyện, trưởng thành và cống hiến cho cộng đồng.&rdquo;
              </p>
              <span className="block text-[11px] font-medium text-slate-400 not-italic">
                — Hội Sinh viên Việt Nam
              </span>
            </div>
          </div>
        </div>

        {/* ─── Right Column: Asymmetric Blob Image ─── */}
        <div className="lg:col-span-5 relative min-h-[280px] sm:min-h-[320px] lg:min-h-[340px] group">

          {/* Decorative background blob (soft blue, offset behind the image) */}
          <div
            aria-hidden="true"
            className="absolute inset-0 -right-3 -bottom-3 bg-gradient-to-br from-blue-200/40 via-blue-100/30 to-sky-50/20 transition-transform duration-700 group-hover:scale-[1.03]"
            style={{ clipPath: BLOB_BG }}
          />

          {/* Decorative dot grid pattern (bottom-left) */}
          <div aria-hidden="true" className="absolute -left-2 bottom-6 z-[1] grid grid-cols-4 gap-[5px]">
            {Array.from({ length: 16 }).map((_, i) => (
              <div
                key={i}
                className="w-[5px] h-[5px] rounded-full bg-blue-400/30"
              />
            ))}
          </div>

          {/* Main Hero Image – organic blob shape */}
          <div
            className="relative z-[2] w-full h-[260px] sm:h-[290px] lg:h-[310px] shadow-2xl transition-transform duration-500 group-hover:scale-[1.02] overflow-hidden"
            style={{ clipPath: BLOB_MAIN }}
          >
            <img
              src={welcomeHero}
              alt="Sinh viên 5 tốt cùng nhau rèn luyện và phát triển"
              className="w-full h-full object-cover object-[center_28%]"
            />
            {/* Inner gradient overlay */}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-slate-900/35 via-transparent to-transparent pointer-events-none"
            />
          </div>

          {/* Floating "Hành trình kiến tạo" badge – top-right */}
          <span className="absolute z-[5] top-2 right-4 sm:right-6 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-white/70 text-slate-800 text-[11px] font-bold shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Hành trình kiến tạo</span>
          </span>

          {/* Floating Daily Suggestion Widget – bottom-right, overlapping blob edge */}
          <div
            onClick={onOpenLauncher}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpenLauncher();
              }
            }}
            className="absolute z-[5] -bottom-1 right-0 sm:right-3 w-[84%] sm:w-[78%] p-3.5 sm:p-4 rounded-xl bg-white/95 backdrop-blur-lg border border-slate-200/60 shadow-xl hover:shadow-2xl hover:bg-white transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 group/widget"
          >
            <div className="space-y-0.5 pr-2 min-w-0">
              <div className="flex items-center gap-1 text-blue-600 text-[10px] font-bold tracking-wider uppercase">
                <Sparkles className="w-3 h-3 text-blue-500" />
                <span>Gợi ý hôm nay</span>
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover/widget:text-blue-600 transition-colors truncate">
                Hoàn thiện thêm một minh chứng nhỏ
              </h4>
              <p className="text-[11px] text-slate-500 font-normal truncate">
                Những bước tiến đều đáng được ghi nhận.
              </p>
            </div>

            <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-600 group-hover/widget:bg-blue-700 text-white flex items-center justify-center shadow-sm transition-all group-hover/widget:translate-x-0.5">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>

          {/* Small decorative accent blob – floating top-left */}
          <div
            aria-hidden="true"
            className="absolute -left-4 top-10 w-14 h-14 rounded-[40%_60%_55%_45%/40%_45%_55%_60%] bg-gradient-to-br from-blue-300/40 to-blue-100/20 animate-[float_6s_ease-in-out_infinite]"
          />

          {/* Small circle accent – top area */}
          <div
            aria-hidden="true"
            className="absolute right-[15%] -top-2 w-5 h-5 rounded-full bg-amber-400/70 shadow-sm animate-[float_4s_ease-in-out_infinite_reverse]"
          />
        </div>
      </div>
    </section>
  );
}
