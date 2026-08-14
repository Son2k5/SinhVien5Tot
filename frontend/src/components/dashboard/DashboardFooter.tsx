import { BrandLogo, Icon } from '../common/BrandLogo';

export function DashboardFooter() {
  return (
    <footer className='sv2-footer'>
      <div className='sv2-footer__inner'>
        <div className='sv2-footer__brand'>
          <BrandLogo />
          <p>Hệ thống quản lý và đồng hành cùng sinh viên trên hành trình chinh phục danh hiệu Sinh viên 5 Tốt.</p>
          <div className='sv2-footer__socials'><a href='#' aria-label='Facebook'><Icon name='facebook' /></a><a href='#' aria-label='YouTube'><Icon name='youtube' /></a><a href='#' aria-label='Instagram'><Icon name='instagram' /></a></div>
        </div>
        <div className='sv2-footer__links'>
          <strong>Khám phá</strong>
          <a href='#journey-title'>Hành trình 5 tốt</a>
          <a href='#progress-title'>Bảng tiến độ</a>
          <a href='#news-title'>Tin tức & sự kiện</a>
        </div>
        <div className='sv2-footer__links'>
          <strong>Hỗ trợ</strong>
          <a href='#feedback-title'>Gửi phản hồi</a>
          <a href='#youth-gallery-title'>Thư viện hình ảnh</a>
          <a href='#'>Hướng dẫn sử dụng</a>
          <a href='#'>Điều khoản sử dụng</a>
        </div>
        <div className='sv2-footer__contact'>
          <strong>Liên hệ</strong>
          <p><Icon name='home' /> Phòng Công tác Sinh viên, Nhà A1</p>
          <p><Icon name='mail' /> support@sv5t.edu.vn</p>
          <p><Icon name='phone' /> 1900 6868</p>
        </div>
      </div>
      <div className='sv2-footer__bottom'><div><span>© {new Date().getFullYear()} Sinh Viên 5 Tốt. Bảo lưu mọi quyền.</span><span>Được xây dựng với <Icon name='heart' /> dành cho sinh viên Việt Nam</span></div></div>
    </footer>
  );
}
