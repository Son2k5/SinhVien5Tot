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
  Image,
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
    <section className='sv2-section sv3-feature-section' aria-labelledby='system-feature-title'>
      <div className='sv2-section-heading sv2-section-heading--row'>
        <div><span>Trung tâm thao tác</span><h2 id='system-feature-title'>Chức năng hệ thống</h2></div>
        <button type='button' className='sv3-text-action' onClick={onOpenAll}>Xem tất cả chức năng <ArrowRight size={17} /></button>
      </div>
      <div className='sv3-feature-grid'>
        {features.slice(0, 6).map((feature, index) => {
          const FeatureIcon = featureIcons[feature.icon] ?? Sparkles;
          const content = (
            <>
              <span className='sv3-feature-card__number'>0{index + 1}</span>
              <span className='sv3-feature-card__icon'><FeatureIcon size={24} /></span>
              <span className='sv3-feature-card__copy'><strong>{feature.title}</strong><small>{feature.description}</small></span>
              {feature.isAvailable ? <ChevronRight size={18} /> : <em>{feature.badge || 'Sắp mở'}</em>}
            </>
          );
          return feature.isAvailable ? (
            <Link key={feature.key} to={feature.route} className='sv3-feature-card is-available'>{content}</Link>
          ) : (
            <button key={feature.key} type='button' disabled className='sv3-feature-card'>{content}</button>
          );
        })}
      </div>
    </section>
  );
}

export function YouthGallerySection({ items }: { items: YouthGalleryItem[] }) {
  return (
    <section className='sv2-section sv3-gallery-section' aria-labelledby='youth-gallery-title'>
      <div className='sv2-section-heading sv2-section-heading--row'>
        <div><span>Nhật ký màu áo xanh</span><h2 id='youth-gallery-title'>Khoảnh khắc Đoàn Thanh niên</h2></div>
        <p>Ảnh hoạt động mới · Dữ liệu mock sẵn sàng nối API</p>
      </div>
      <div className='sv3-gallery-grid'>
        {items.slice(0, 4).map((item, index) => (
          <figure key={item.id} className={'sv3-gallery-card sv3-gallery-card--' + (index + 1)}>
            <img src={item.imageUrl} alt={item.title + ' tại ' + item.location} loading={index === 0 ? 'eager' : 'lazy'} />
            <div className='sv3-gallery-card__scrim' aria-hidden='true' />
            <figcaption>
              <span><Image size={15} /> Ảnh hoạt động</span>
              <h3>{item.title}</h3>
              <p>{item.caption}</p>
              <small><MapPin size={14} /> {item.location} <i /> {formatDate(item.capturedAtUtc)}</small>
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
    <section className='sv3-feedback' aria-labelledby='feedback-title'>
      <div className='sv3-feedback__intro'>
        <span className='sv3-feedback__icon'><MessageSquareText size={27} /></span>
        <span className='sv2-eyebrow'>Kênh kết nối trực tiếp</span>
        <h2 id='feedback-title'>Bạn muốn nhắn gì với quản trị viên?</h2>
        <p>Mọi góp ý đều giúp hệ thống gần gũi và hữu ích hơn với sinh viên. Tin nhắn của bạn sẽ được chuyển đến đội ngũ phụ trách.</p>
        <div><Mail size={17} /><span><strong>Phản hồi trong giờ hành chính</strong><small>support@sv5t.edu.vn</small></span></div>
      </div>
      <form className='sv3-feedback__form' onSubmit={handleSubmit}>
        <div className='sv3-form-row'>
          <label>Người gửi<input name='sender' defaultValue={displayName} autoComplete='name' /></label>
          <label>Chủ đề<select name='topic' defaultValue='feedback'><option value='feedback'>Góp ý giao diện</option><option value='support'>Cần hỗ trợ</option><option value='content'>Nội dung hoạt động</option><option value='other'>Khác</option></select></label>
        </div>
        <label>Nội dung phản hồi<textarea name='message' rows={5} required minLength={10} placeholder='Chia sẻ ý kiến của bạn...' /></label>
        <div className='sv3-feedback__actions'>
          <small><ShieldCheck size={15} /> Đây là luồng gửi mẫu, sẵn sàng kết nối API quản trị.</small>
          <button type='submit' disabled={isSending}>{isSending ? 'Đang gửi...' : <><Send size={17} /> Gửi phản hồi</>}</button>
        </div>
        <p className={'sv3-feedback__success' + (sent ? ' is-visible' : '')} aria-live='polite'>
          <CheckCircle2 size={17} /> Cảm ơn bạn! Phản hồi mẫu đã được ghi nhận.
        </p>
      </form>
    </section>
  );
}
