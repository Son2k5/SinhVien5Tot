import { ArrowRight, Mail, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BrandLogo, Icon } from './BrandLogo';

interface SiteFooterProps { className?: string; }

const navGroups = [
  {
    title: 'Chương trình', links: [
      ['Giới thiệu phong trào', '/#gioi-thieu'],
      ['Tiêu chí bình xét', '/#tieu-chi'],
      ['Chức năng hệ thống', '/#tinh-nang'],
      ['Bảng điều khiển', '/dashboard'],
    ]
  },
  {
    title: 'Dành cho sinh viên', links: [
      ['Đăng ký danh hiệu', '/register'],
      ['Theo dõi hành trình', '/dashboard'],
      ['Hồ sơ cá nhân', '/dashboard/profile'],
      ['Câu hỏi thường gặp', '/#faq'],
    ]
  },
] as const;

const linkClass = `relative w-max max-w-full text-[rgba(255,255,255,.85)] text-[13px] leading-[1.55] transition-colors duration-200 hover:text-white after:content-[''] after:absolute after:left-0 after:-bottom-[3px] after:w-0 after:h-px after:bg-white after:transition-[width] after:duration-[.25s] hover:after:w-full`;
export function SiteFooter({ className = '' }: SiteFooterProps) {
  return (
    <footer id='lien-he' className={`site-footer relative mt-auto text-white font-['Be_Vietnam_Pro',_ui-sans-serif,_system-ui,_sans-serif] [&_.brand-logo__copy_strong]:text-white [&_.brand-logo__copy_strong]:text-[22px] [&_.brand-logo__copy_small]:text-white/70 ${className}`}>
      <div className='h-[70px] -mb-[2px] leading-none overflow-hidden' aria-hidden='true'>
      </div>
      <div className='relative overflow-hidden bg-[linear-gradient(135deg,var(--blue-700)_0%,var(--blue)_62%,#4c9fff_100%)]'>
        <div className='absolute -top-[150px] -right-[70px] w-[340px] h-[340px] rounded-full bg-white opacity-[.16] blur-[70px] pointer-events-none' aria-hidden='true' />
        <div className='absolute -bottom-[160px] left-[8%] w-[300px] h-[300px] rounded-full bg-white opacity-[.12] blur-[70px] pointer-events-none' aria-hidden='true' />
        <div className='relative z-[1] w-[min(1180px,calc(100%_-_48px))] mx-auto pt-[54px] pb-[30px] grid grid-cols-[1.3fr_1fr_1fr_1.1fr] gap-[40px] max-[860px]:w-[min(680px,calc(100%_-_36px))] max-[860px]:grid-cols-1 max-[860px]:text-center max-[480px]:w-[calc(100%_-_28px)]'>
          <section className='max-[860px]:flex max-[860px]:flex-col max-[860px]:items-center' aria-label='Giới thiệu Sinh Viên 5 Tốt'>
            <BrandLogo />
            <p className='max-w-[330px] mt-[16px] mb-0 text-white/90 text-[14px] font-semibold leading-[1.65]'>Hệ thống quản lý danh hiệu Sinh Viên 5 Tốt</p>
            <p className='max-w-[350px] mt-[10px] mb-0 text-white/75 text-[12px] leading-[1.75]'>Đồng hành cùng sinh viên trên hành trình rèn luyện đạo đức, học tập, thể lực, tình nguyện và hội nhập.</p>
            <Link to='/register' className='inline-flex items-center gap-2 mt-[22px] px-5 min-h-[44px] text-[var(--blue-700)] bg-white rounded-full shadow-[0_8px_22px_rgba(20,50,120,.18)] text-[12px] font-bold transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(20,50,120,.26)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white'>
              Đăng ký danh hiệu <ArrowRight size={16} aria-hidden='true' />
            </Link>
          </section>
          {navGroups.map((group) => (
            <nav key={group.title} className='max-[860px]:flex max-[860px]:flex-col max-[860px]:items-center' aria-label={group.title}>
              <h2 className='m-[0_0_18px] text-[11px] font-extrabold tracking-[1.4px] uppercase'>{group.title}</h2>
              <ul className='m-0 p-0 list-none flex flex-col gap-3 max-[860px]:items-center'>
                {group.links.map(([label, to]) => <li key={to}><Link className={linkClass} to={to}>{label}</Link></li>)}
              </ul>
            </nav>
          ))}
          <section className='max-[860px]:flex max-[860px]:flex-col max-[860px]:items-center' aria-label='Hỗ trợ và liên hệ'>
            <h2 className='m-[0_0_18px] text-[11px] font-extrabold tracking-[1.4px] uppercase'>Hỗ trợ &amp; liên hệ</h2>
            <address className='not-italic max-[860px]:w-[min(100%,320px)]'>
              <a className='mb-3 flex items-start gap-2.5 text-[rgba(255,255,255,.85)] text-[12px] leading-[1.55] hover:text-white max-[860px]:text-left' href='mailto:support@sv5t.edu.vn'><Mail className='mt-0.5 shrink-0' size={17} />support@sv5t.edu.vn</a>
              <a className='mb-3 flex items-start gap-2.5 text-[rgba(255,255,255,.85)] text-[12px] leading-[1.55] hover:text-white max-[860px]:text-left' href='tel:19006868'><Phone className='mt-0.5 shrink-0' size={17} />1900 6868</a>
              <p className='m-0 flex items-start gap-2.5 text-[rgba(255,255,255,.85)] text-[12px] leading-[1.55] max-[860px]:text-left'><MapPin className='mt-0.5 shrink-0' size={17} />Phòng Công tác Sinh viên, Nhà A1</p>
            </address>
            <div className='flex gap-2.5 mt-[18px]' aria-label='Mạng xã hội'>
              {(['facebook', 'youtube', 'instagram'] as const).map((name) => (
                <a key={name} href='#' aria-label={name} className='w-9 h-9 grid place-items-center text-white/90 border border-white/40 rounded-full bg-[rgba(255,255,255,.15)] transition-[color,background-color,transform] duration-200 hover:text-[var(--blue-700)] hover:bg-white hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white'>
                  <Icon name={name} className='w-[15px] h-[15px]' />
                </a>
              ))}
            </div>
          </section>
        </div>
        <div className='relative z-[1] w-[min(1180px,calc(100%_-_48px))] h-px mx-auto bg-[linear-gradient(90deg,transparent,rgba(255,255,255,.28),transparent)] max-[480px]:w-[calc(100%_-_28px)]' />
        <div className='relative z-[1] w-[min(1180px,calc(100%_-_48px))] mx-auto py-[20px_26px] flex items-center justify-between gap-4 text-white/70 text-[11px] max-[700px]:flex-col max-[700px]:gap-2.5 max-[700px]:text-center max-[480px]:w-[calc(100%_-_28px)]'>
          <span>© {new Date().getFullYear()} Sinh Viên 5 Tốt. Bảo lưu mọi quyền.</span>
          <div className='flex gap-[18px] max-[420px]:flex-wrap max-[420px]:justify-center'>
            <Link className='hover:text-white' to='/#faq'>Điều khoản</Link>
            <Link className='hover:text-white' to='/#faq'>Bảo mật</Link>
            <Link className='hover:text-white' to='/'>Sơ đồ trang</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
