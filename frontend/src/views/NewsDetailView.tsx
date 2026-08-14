import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CalendarDays, Clock3, MapPin, Newspaper, Share2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { BrandLogo } from '../components/common/BrandLogo';
import { resolveNewsItems } from '../mocks/welcomeContent';
import { welcomeService } from '../services/welcomeService';
import './NewsDetailView.css';

function formatLongDate(value: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function NewsDetailView() {
  const { newsId = '' } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ['welcome-dashboard', 'news-detail'],
    queryFn: welcomeService.getDashboard,
  });
  const newsItems = resolveNewsItems(data?.news);
  const article = newsItems.find((item) => item.id === newsId);

  if (isLoading && !article) {
    return <div className='news-page'><div className='news-page__loading' role='status'>Đang tải bản tin...</div></div>;
  }

  if (!article) {
    return (
      <div className='news-page'>
        <main className='news-not-found'>
          <Newspaper size={34} />
          <h1>Không tìm thấy bản tin</h1>
          <p>Nội dung có thể đã được di chuyển hoặc chưa được đồng bộ.</p>
          <Link to='/dashboard'><ArrowLeft size={17} /> Quay lại trang chào mừng</Link>
        </main>
      </div>
    );
  }

  return (
    <div className='news-page'>
      <header className='news-header'>
        <div className='news-header__inner'>
          <BrandLogo />
          <Link to='/dashboard'><ArrowLeft size={16} /> Trang chào mừng</Link>
        </div>
      </header>
      <main className='news-main'>
        <Link to='/dashboard' className='news-back'><ArrowLeft size={16} /> Quay lại</Link>
        <article className='news-article'>
          <div className='news-article__heading'>
            <span>{article.category}</span>
            <h1>{article.title}</h1>
            <p>{article.summary}</p>
            <div className='news-article__meta'>
              <span><CalendarDays size={15} /> {formatLongDate(article.publishedAtUtc)}</span>
              <span><Clock3 size={15} /> {formatTime(article.eventStartAtUtc)}</span>
              <span><MapPin size={15} /> {article.location}</span>
            </div>
          </div>
          <figure><img src={article.imageUrl} alt={article.title} /></figure>
          <div className='news-article__layout'>
            <div className='news-article__body'>
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
    </div>
  );
}
