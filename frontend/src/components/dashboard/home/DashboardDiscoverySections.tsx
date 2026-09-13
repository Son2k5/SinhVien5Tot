import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  Award,
  Bookmark,
  ChartNoAxesColumnIncreasing,
  CheckCircle2,
  ChevronRight,
  FileCheck2,
  Flag,
  GraduationCap,
  HeartHandshake,
  Home,
  Image as ImageIcon,
  Landmark,
  Mail,
  MapPin,
  MessageSquareText,
  Newspaper,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import type { SystemFeature, YouthGalleryItem } from '../../../types/welcome';
import { formatDate } from './homeDashboardConfig';

const featureIcons: Record<string, LucideIcon> = {
  home: Home,
  newspaper: Newspaper,
  award: Award,
  'file-check': FileCheck2,
  flag: Flag,
  chart: ChartNoAxesColumnIncreasing,
  users: Users,
  bookmark: Bookmark,
  sparkles: Sparkles,
  'shield-check': ShieldCheck,
  landmark: Landmark,
  'graduation-cap': GraduationCap,
  'heart-handshake': HeartHandshake,
};

interface SystemFeatureSectionProps {
  features: SystemFeature[];
  onOpenAll: () => void;
}

export function SystemFeatureSection({ features, onOpenAll }: SystemFeatureSectionProps) {
  return (
    <section className="space-y-4 sm:space-y-5 scroll-mt-24" aria-labelledby="system-feature-title">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <span className="text-[11px] font-bold text-blue-600 tracking-wider uppercase">Trung tâm thao tác</span>
          <h2 id="system-feature-title" className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Chức năng hệ thống
          </h2>
        </div>
        <button
          type="button"
          onClick={onOpenAll}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-semibold transition-colors shadow-sm cursor-pointer w-fit"
        >
          <span>Xem tất cả chức năng</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {features.slice(0, 6).map((feature) => {
          const FeatureIcon = featureIcons[feature.icon] ?? Sparkles;
          return feature.isAvailable ? (
            <Link
              key={feature.key}
              to={feature.route}
              className="group flex items-start justify-between p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-blue-300 hover:shadow-md transition-[border-color,box-shadow] duration-150 cursor-pointer"
            >
              <div className="flex items-start gap-3.5 min-w-0 pr-2">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <FeatureIcon className="w-5 h-5" />
                </div>
                <div className="space-y-1 min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-slate-600 font-normal line-clamp-2 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-[color,transform] flex-shrink-0 mt-1" />
            </Link>
          ) : (
            <div
              key={feature.key}
              className="flex items-start justify-between p-4 sm:p-5 rounded-2xl bg-slate-50/60 border border-slate-200/70 opacity-75 cursor-not-allowed"
            >
              <div className="flex items-start gap-3.5 min-w-0 pr-2">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center flex-shrink-0">
                  <FeatureIcon className="w-5 h-5" />
                </div>
                <div className="space-y-1 min-w-0">
                  <h3 className="text-sm font-semibold text-slate-700 truncate">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-normal line-clamp-2 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-full flex-shrink-0">
                {feature.badge || 'Sắp mở'}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function YouthGallerySection({ items }: { items: YouthGalleryItem[] }) {
  const visibleItems = items.slice(0, 4);

  return (
    <section className="space-y-4 sm:space-y-5 scroll-mt-24" aria-labelledby="youth-gallery-title">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <span className="text-[11px] font-bold text-blue-600 tracking-wider uppercase">Nhật ký màu áo xanh</span>
          <h2 id="youth-gallery-title" className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Khoảnh khắc Đoàn Thanh niên
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-normal max-w-xl mt-1">
            Mỗi hoạt động là một dấu ấn tuổi trẻ, được lưu lại bằng niềm vui và tinh thần cống hiến.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-50/90 border border-blue-100 text-blue-700 text-xs font-bold w-fit">
          <ImageIcon className="w-4 h-4 text-blue-600" />
          <span>{visibleItems.length} câu chuyện nổi bật</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {visibleItems.map((item, index) => (
          <figure
            key={item.id}
            className={`group relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 min-h-[260px] flex flex-col justify-end ${
              index === 0 ? 'sm:col-span-2 sm:row-span-2 min-h-[320px] sm:min-h-[360px]' : ''
            }`}
          >
            <img
              src={item.imageUrl}
              alt={`${item.title} tại ${item.location}`}
              loading={index === 0 ? 'eager' : 'lazy'}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent pointer-events-none"
              aria-hidden="true"
            />

            <figcaption className="relative z-10 p-4 sm:p-5 text-white space-y-1.5">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-300 uppercase tracking-wider">
                <ImageIcon className="w-3 h-3" />
                <span>Ảnh hoạt động</span>
              </span>
              <h3 className="text-sm sm:text-base font-bold leading-snug text-white line-clamp-2">
                {item.title}
              </h3>
              <p className="text-xs text-slate-200 font-normal line-clamp-2 leading-relaxed">
                {item.caption}
              </p>
              <div className="pt-1 flex items-center gap-3 text-[11px] text-slate-300 font-medium">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  <span>{item.location}</span>
                </span>
                <span>•</span>
                <time dateTime={item.capturedAtUtc}>{formatDate(item.capturedAtUtc)}</time>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

export function AdminFeedbackSection({ displayName }: { displayName: string }) {
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setIsSending(true);
    setSent(false);
    window.setTimeout(() => {
      setIsSending(false);
      setSent(true);
      form.reset();
    }, 650);
  };

  return (
    <section className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm scroll-mt-24" aria-labelledby="feedback-title">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
            <MessageSquareText className="w-5 h-5" />
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-blue-600 tracking-wider uppercase">Kênh kết nối trực tiếp</span>
            <h2 id="feedback-title" className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Bạn muốn nhắn gì với ban quản trị?
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              Mọi góp ý đều giúp hệ thống gần gũi và hữu ích hơn với sinh viên. Ý kiến của bạn sẽ được chuyển đến đội ngũ phụ trách.
            </p>
          </div>

          <div className="pt-2 flex items-center gap-3 text-xs text-slate-600">
            <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">Phản hồi trong giờ hành chính</p>
              <p className="text-slate-500 font-normal">support@sv5t.edu.vn</p>
            </div>
          </div>
        </div>

        {/* Right Column: Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="feedback-sender-input" className="text-xs font-semibold text-slate-800">Người gửi</label>
              <input
                id="feedback-sender-input"
                name="sender"
                defaultValue={displayName}
                autoComplete="name"
                className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 font-medium focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-[border-color,box-shadow,background-color]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="feedback-topic-select" className="text-xs font-semibold text-slate-800">Chủ đề</label>
              <select
                id="feedback-topic-select"
                name="topic"
                defaultValue="feedback"
                className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 font-medium focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-[border-color,box-shadow,background-color]"
              >
                <option value="feedback">Góp ý giao diện &amp; trải nghiệm</option>
                <option value="support">Cần hỗ trợ minh chứng</option>
                <option value="content">Nội dung hoạt động</option>
                <option value="other">Khác</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="feedback-message-textarea" className="text-xs font-semibold text-slate-800">Nội dung phản hồi</label>
            <textarea
              id="feedback-message-textarea"
              name="message"
              rows={4}
              required
              minLength={10}
              placeholder="Chia sẻ ý kiến hoặc thắc mắc của bạn tại đây..."
              className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-[border-color,box-shadow,background-color] leading-relaxed font-normal"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sẵn sàng kết nối quản trị viên</span>
            </div>

            <button
              type="submit"
              disabled={isSending}
              className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSending ? (
                <span>Đang gửi...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Gửi phản hồi</span>
                </>
              )}
            </button>
          </div>

          {sent && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Cảm ơn bạn! Phản hồi mẫu đã được ghi nhận.</span>
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
