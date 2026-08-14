import { ArrowRight, CheckCircle2, ChevronRight, Clock3, MapPin, Quote, Target } from 'lucide-react';
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

  return (
    <section className='sv2-section' aria-labelledby='featured-title'>
      <div className='sv2-section-heading sv2-section-heading--row'>
        <div><span>Gợi ý dành cho bạn</span><h2 id='featured-title'>Hoạt động nổi bật</h2></div>
        {items[0] && <Link to={'/news/' + items[0].id}>Đọc tin mới nhất <ArrowRight size={16} /></Link>}
      </div>
      {featuredItems.length === 0 ? (
        <div className='sv2-empty-state'><strong>Chưa có hoạt động nổi bật</strong><p>Nội dung mới sẽ sớm được cập nhật.</p></div>
      ) : (
        <div className='sv2-featured-grid'>
          {featuredItems.map((item) => {
            const calendar = getEventCalendar(item.eventStartAtUtc);
            return (
              <Link key={item.id} to={'/news/' + item.id} className='sv2-featured-card'>
                <div className='sv2-featured-card__image'>
                  <img src={item.imageUrl} alt={item.title} loading='lazy' />
                  <span><strong>{calendar.day}</strong><small>{calendar.month}</small></span>
                </div>
                <div className='sv2-featured-card__body'>
                  <span className='sv2-featured-card__tag'>{item.category}</span>
                  <h3>{item.title}</h3>
                  <p><Clock3 size={14} /> {formatEventTime(item.eventStartAtUtc)}</p>
                  <p><MapPin size={14} /> {item.location}</p>
                  <i><ArrowRight size={16} /></i>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function NewsSection({ items }: NewsItemsProps) {
  const newsItems = items.slice(0, 5);

  return (
    <section className='sv2-section' aria-labelledby='news-title'>
      <div className='sv2-section-heading sv2-section-heading--row'>
        <div><span>Cập nhật mới nhất</span><h2 id='news-title'>Tin tức &amp; sự kiện</h2></div>
        <span className='sv2-backend-badge'><CheckCircle2 size={14} /> Kết nối dữ liệu backend</span>
      </div>
      {newsItems.length === 0 ? (
        <div className='sv2-empty-state'><strong>Chưa có tin tức</strong><p>Nội dung mới sẽ sớm được cập nhật.</p></div>
      ) : (
        <div className='sv2-news-list'>
          {newsItems.map((item, index) => (
            <Link key={item.id} to={'/news/' + item.id} className={'sv2-news-item sv2-news-item--' + (index + 1)}>
              <img src={item.imageUrl} alt={item.title} loading='lazy' />
              <span className='sv2-news-item__copy'>
                <small>{item.category} · {portalSourceLabels[item.source]}</small>
                <strong>{item.title}</strong>
                <p>{item.summary}</p>
              </span>
              <time dateTime={item.publishedAtUtc}>{formatDate(item.publishedAtUtc)}</time>
              <ChevronRight size={18} />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export function MotivationBanner() {
  return (
    <section className='sv2-quote-banner'>
      <Quote size={32} />
      <p>Hãy không ngừng nỗ lực để trở thành phiên bản tốt nhất của chính mình.<br /><strong>Hành trình 5 tốt – Hành trình kiến tạo tương lai!</strong></p>
      <span><Target size={66} /></span>
    </section>
  );
}
