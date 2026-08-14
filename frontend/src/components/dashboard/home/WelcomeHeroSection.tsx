import { ArrowUpRight, LayoutGrid, Quote, RefreshCw, Sparkles, Star } from 'lucide-react';
import welcomeHero from '../../../assets/welcome-hero-v2.jpg';
import { formatToday } from './homeDashboardConfig';

interface WelcomeHeroSectionProps {
  displayName: string;
  isRefreshing: boolean;
  onOpenLauncher: () => void;
  onRefresh: () => void;
}

export function WelcomeHeroSection({
  displayName,
  isRefreshing,
  onOpenLauncher,
  onRefresh,
}: WelcomeHeroSectionProps) {
  return (
    <section className='sv2-hero'>
      <img src={welcomeHero} alt='Nhóm sinh viên cùng nhau rèn luyện và phát triển' />
      <div className='sv2-hero__wash' aria-hidden='true' />
      <span className='sv3-hero-orbit' aria-hidden='true'><Star size={19} /></span>
      <div className='sv2-hero__copy'>
        <span className='sv2-eyebrow'><Sparkles size={14} /> {formatToday()}</span>
        <h1>Xin chào, <span>{displayName}!</span></h1>
        <p>Mỗi hành trình tốt đều bắt đầu từ những bước nhỏ. Hãy tiếp tục rèn luyện và lan tỏa giá trị tốt đẹp mỗi ngày!</p>
        <div className='sv2-hero__actions'>
          <button type='button' onClick={onOpenLauncher}><LayoutGrid size={17} /> Khám phá chức năng</button>
          <button type='button' disabled={isRefreshing} onClick={onRefresh}>
            <RefreshCw size={16} className={isRefreshing ? 'sv2-spin' : ''} />
            {isRefreshing ? 'Đang cập nhật' : 'Làm mới dữ liệu'}
          </button>
        </div>
        <blockquote>
          <Quote size={26} />
          <p>Sinh viên 5 tốt không chỉ là danh hiệu, đó là hành trình rèn luyện, trưởng thành và cống hiến cho cộng đồng.</p>
          <cite>— Hội Sinh viên Việt Nam</cite>
        </blockquote>
      </div>
      <div className='sv3-hero-note'>
        <span><Sparkles size={15} /> Gợi ý hôm nay</span>
        <strong>Hoàn thiện thêm một minh chứng nhỏ</strong>
        <small>Những bước tiến đều đáng được ghi nhận.</small>
        <button type='button' onClick={onOpenLauncher} aria-label='Mở chức năng hệ thống'><ArrowUpRight size={18} /></button>
      </div>
    </section>
  );
}
