import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BrandLogo, Icon, type IconName } from '../components/common/BrandLogo';
import { ProcessJourney } from '../components/landing/ProcessJourney';
import { TestimonialsSection } from '../components/landing/TestimonialsSection';
import { testimonialMockData } from '../mocks/testimonials';
import heroEvent from '../assets/homePage/Artboard 1.png';

const criteria: Array<{ number: string; title: string; description: string; icon: IconName; tone: string }> = [
  { number: '01', title: 'Đạo đức tốt', description: 'Rèn luyện bản lĩnh, trách nhiệm và lối sống đẹp trong cộng đồng.', icon: 'heart', tone: 'violet' },
  { number: '02', title: 'Học tập tốt', description: 'Không ngừng học hỏi, sáng tạo và chinh phục những mục tiêu mới.', icon: 'book', tone: 'blue' },
  { number: '03', title: 'Thể lực tốt', description: 'Duy trì thể chất bền bỉ, tinh thần tích cực và lối sống lành mạnh.', icon: 'activity', tone: 'green' },
  { number: '04', title: 'Tình nguyện tốt', description: 'Lan tỏa sự tử tế bằng những hành động ý nghĩa vì cộng đồng.', icon: 'users', tone: 'orange' },
  { number: '05', title: 'Hội nhập tốt', description: 'Chủ động ngoại ngữ, kỹ năng số và tư duy công dân toàn cầu.', icon: 'trend', tone: 'cyan' },
];

const features: Array<{ title: string; description: string; icon: IconName }> = [
  { title: 'Hồ sơ số thông minh', description: 'Tất cả thành tích, hoạt động và minh chứng được lưu trữ tập trung, dễ dàng tra cứu.', icon: 'cloud' },
  { title: 'Theo dõi tiến độ', description: 'Biết chính xác tiêu chí đã đạt và nội dung cần bổ sung qua bảng tiến độ trực quan.', icon: 'target' },
  { title: 'Nộp minh chứng online', description: 'Tải lên tài liệu mọi lúc, mọi nơi và nhận phản hồi trực tiếp từ hội đồng.', icon: 'upload' },
  { title: 'Xét duyệt minh bạch', description: 'Quy trình rõ ràng, trạng thái cập nhật theo thời gian thực và bảo mật dữ liệu.', icon: 'shield' },
  { title: 'Nhắc việc đúng lúc', description: 'Thông báo mốc thời gian, hồ sơ cần bổ sung và kết quả mới để bạn không bỏ lỡ cơ hội.', icon: 'bell' },
  { title: 'Kết quả dễ tra cứu', description: 'Xem lịch sử xét duyệt, phản hồi và kết quả công nhận trong cùng một không gian.', icon: 'file-check' },
];

const gallery = [
  { src: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1000&q=82', alt: 'Sinh viên tham gia hoạt động tình nguyện', label: 'Mùa hè xanh' },
  { src: 'https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=800&q=82', alt: 'Nhóm sinh viên trẻ cùng hoạt động', label: 'Sức trẻ tình nguyện' },
  { src: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=800&q=82', alt: 'Sinh viên học tập tại trường', label: 'Học tập và sáng tạo' },
  { src: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=82', alt: 'Khuôn viên trường đại học', label: 'Hội nhập và trưởng thành' },
];

const faqs = [
  ['Sinh viên 5 Tốt là danh hiệu gì?', 'Đây là danh hiệu cao quý ghi nhận sinh viên phát triển toàn diện ở 5 tiêu chí: đạo đức, học tập, thể lực, tình nguyện và hội nhập.'],
  ['Làm thế nào để đăng ký tham gia?', 'Bạn chỉ cần tạo tài khoản bằng email sinh viên, hoàn thiện hồ sơ cá nhân và đăng ký tham gia chương trình trên hệ thống.'],
  ['Minh chứng cần nộp ở định dạng nào?', 'Hệ thống hỗ trợ hình ảnh và PDF. Mỗi tệp có dung lượng tối đa 10 MB để quá trình tải lên luôn nhanh chóng.'],
  ['Thời gian xét duyệt minh chứng là bao lâu?', 'Thông thường hội đồng sẽ phản hồi trong vòng 5–7 ngày làm việc. Bạn có thể theo dõi trạng thái ngay trên hồ sơ.'],
  ['Tôi có thể chỉnh sửa minh chứng sau khi nộp không?', 'Có. Bạn có thể cập nhật minh chứng trước thời điểm hội đồng bắt đầu xét duyệt hồ sơ.'],
];

function useReveal() {
  useEffect(() => {
    const items = document.querySelectorAll<HTMLElement>('[data-reveal]');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -30px' });
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);
}

export function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  useReveal();

  useEffect(() => {
    const update = () => {
      const height = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(height > 0 ? (window.scrollY / height) * 100 : 0);
      setScrolled(window.scrollY > 32);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  const closeMenu = () => setMobileOpen(false);

  return (
    <div className="landing-shell">
      <div className="scroll-progress" style={{ width: `${scrollProgress}%` }} />
      <header className={`site-nav ${scrolled ? 'site-nav--scrolled' : ''}`}>
        <div className="landing-container site-nav__inner">
          <a href="#trang-chu" onClick={closeMenu}><BrandLogo /></a>
          <nav className={`site-nav__links ${mobileOpen ? 'is-open' : ''}`} aria-label="Điều hướng chính">
            <a href="#trang-chu" onClick={closeMenu}>Trang chủ</a>
            <a href="#gioi-thieu" onClick={closeMenu}>Giới thiệu</a>
            <a href="#tieu-chi" onClick={closeMenu}>Tiêu chí</a>
            <a href="#tinh-nang" onClick={closeMenu}>Tính năng</a>
            <a href="#thu-vien" onClick={closeMenu}>Thư viện</a>
            <a href="#lien-he" onClick={closeMenu}>Liên hệ</a>
            <div className="site-nav__mobile-actions">
              <Link to="/login">Đăng nhập</Link>
              <Link to="/register" className="button button--primary">Đăng ký ngay</Link>
            </div>
          </nav>
          <div className="site-nav__actions">
            <Link to="/login" className="button button--ghost">Đăng nhập</Link>
            <Link to="/register" className="button button--primary">Đăng ký ngay <Icon name="arrow-right" /></Link>
          </div>
          <button className="menu-button" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Mở menu" aria-expanded={mobileOpen}>
            <Icon name={mobileOpen ? 'x' : 'menu'} />
          </button>
        </div>
      </header>

      <main>
        <section id="trang-chu" className="landing-hero" ref={heroRef}>
          <div className="hero-grid-lines" aria-hidden="true" />
          <div className="hero-orb hero-orb--one" aria-hidden="true" />
          <div className="hero-orb hero-orb--two" aria-hidden="true" />
          <div className="landing-container landing-hero__grid">
            <div className="landing-hero__content" data-reveal>
              <span className="eyebrow"><span className="eyebrow__dot" /> Nền tảng dành cho sinh viên Việt Nam</span>
              <h1>Biến nỗ lực hôm nay thành <span className="hero-title-dark">dấu ấn</span><br /><span>Sinh viên 5 Tốt</span></h1>
              <p>Một không gian số để bạn quản lý hồ sơ, nhìn rõ tiến độ và kết nối mọi dấu mốc rèn luyện — trực quan, minh bạch và đầy cảm hứng.</p>
              <div className="landing-hero__actions">
                <Link to="/register" className="button button--primary button--large">Bắt đầu hành trình <Icon name="arrow-right" /></Link>
                <a href="#gioi-thieu" className="button button--soft button--large"><span className="play-dot"><Icon name="play" /></span> Khám phá thêm</a>
              </div>
              <div className="hero-trust">
                <span className="hero-avatars" aria-hidden="true"><i>MN</i><i>TL</i><i>HP</i><i>+2k</i></span>
                <span><strong>2.000+ sinh viên</strong><small>đang hoàn thiện hồ sơ mỗi ngày</small></span>
              </div>
            </div>

            <div className="landing-hero__visual" data-reveal>
              <div className="visual-glow" />
              <div className="hero-collage__back" aria-hidden="true" />
              <div className="hero-collage__number" aria-hidden="true"><strong>05</strong><span>tiêu chí</span></div>
              <figure className="hero-photo-card">
                <img src={heroEvent} alt="Tập thể sinh viên tham gia chương trình Sinh viên 5 Tốt" width="876" height="390" />
                <span className="hero-photo-card__shine" aria-hidden="true" />
                <figcaption><span><Icon name="sparkles" /></span><div><strong>Tuổi trẻ tạo dấu ấn</strong><small>Đạo đức · Học tập · Thể lực · Tình nguyện · Hội nhập</small></div></figcaption>
              </figure>
              <figure className="hero-orbit-photo" aria-hidden="true"><img src={heroEvent} alt="" /></figure>
              <span className="hero-collage__tag">Hành trình · 2025–2026</span>
              <div className="hero-photo-dots" aria-hidden="true" />
              <div className="floating-card floating-card--top"><span><Icon name="award" /></span><div><b>5 tiêu chí toàn diện</b><small>Một hành trình đáng tự hào</small></div></div>
              <div className="floating-card floating-card--bottom"><span><Icon name="users" /></span><div><b>2.000+ sinh viên</b><small>Đang cùng nhau tiến bước</small></div></div>
            </div>
          </div>
          <a className="scroll-cue" href="#stats" aria-label="Cuộn xuống"><span /><small>Cuộn để khám phá</small></a>
        </section>

        <section id="stats" className="stats-strip">
          <div className="landing-container stats-grid">
            {[
              ['2.000+', 'Sinh viên tham gia'], ['10.000+', 'Minh chứng đã nộp'], ['85%', 'Hoàn thành đúng hạn'], ['98%', 'Sinh viên hài lòng'],
            ].map(([value, label]) => <div key={label} data-reveal><strong>{value}</strong><span>{label}</span></div>)}
          </div>
        </section>

        <section id="gioi-thieu" className="section about-section">
          <div className="landing-container about-layout">
            <div className="about-visual" data-reveal>
              <figure className="about-visual__main"><img src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1100&q=84" alt="Sinh viên cùng tham gia hoạt động cộng đồng" loading="lazy" /></figure>
              <figure className="about-visual__accent"><img src="https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=600&q=82" alt="Sinh viên trao đổi và học tập cùng nhau" loading="lazy" /></figure>
              <div className="about-visual__badge"><Icon name="award" /><span><strong>5 tiêu chí</strong><small>Phát triển toàn diện</small></span></div>
            </div>
            <div className="about-copy" data-reveal>
              <span className="eyebrow"><span className="eyebrow__dot" /> Hiểu đúng về danh hiệu</span>
              <h2>Sinh viên 5 Tốt<br /><span>là gì?</span></h2>
              <p className="about-copy__lead">Sinh viên 5 Tốt là danh hiệu ghi nhận những sinh viên có quá trình phấn đấu nổi bật và phát triển toàn diện trên năm phương diện.</p>
              <p>Đây không chỉ là một kết quả để tự hào, mà còn là bộ khung giúp mỗi sinh viên chủ động đặt mục tiêu, tích lũy trải nghiệm và trưởng thành qua từng năm học.</p>
              <div className="about-points">
                <div><span><Icon name="target" /></span><p><strong>Mục tiêu rõ ràng</strong><small>Biết mình cần rèn luyện điều gì ở từng tiêu chí.</small></p></div>
                <div><span><Icon name="trend" /></span><p><strong>Hành trình có chiều sâu</strong><small>Mỗi minh chứng kể lại một bước tiến của chính bạn.</small></p></div>
                <div><span><Icon name="award" /></span><p><strong>Giá trị được ghi nhận</strong><small>Tạo nền tảng tốt cho học tập, hoạt động và tương lai.</small></p></div>
              </div>
              <a href="#tieu-chi" className="text-link">Khám phá 5 tiêu chí <Icon name="arrow-right" /></a>
            </div>
          </div>
        </section>

        <section id="tieu-chi" className="section section--soft criteria-section">
          <div className="landing-container">
            <div className="section-heading section-heading--center" data-reveal>
              <span className="eyebrow"><span className="eyebrow__dot" /> Danh hiệu cao quý</span>
              <h2>Trở thành phiên bản <span>tốt hơn mỗi ngày</span></h2>
              <p>Sinh viên 5 Tốt không chỉ là một danh hiệu, mà là hành trình rèn luyện để trưởng thành toàn diện.</p>
            </div>
            <div className="criteria-grid">
              {criteria.map((item) => (
                <article className={`criteria-card tone-${item.tone}`} key={item.title} data-reveal>
                  <span className="criteria-card__number">{item.number}</span>
                  <span className="criteria-card__icon"><Icon name={item.icon} /></span>
                  <h3>{item.title}</h3><p>{item.description}</p>
                  <a href="#tinh-nang" aria-label={`Tìm hiểu ${item.title}`}><Icon name="arrow-right" /></a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="tinh-nang" className="section features-section">
          <div className="landing-container">
            <div className="section-heading section-heading--center" data-reveal>
              <span className="eyebrow"><span className="eyebrow__dot" /> Website giúp bạn làm được gì?</span>
              <h2>Mọi chức năng cần thiết,<br /><span>trong một nền tảng</span></h2>
              <p>Từ lúc tạo hồ sơ đến khi được công nhận, SV5T giúp từng bước trở nên rõ ràng, nhanh gọn và dễ theo dõi.</p>
            </div>
            <div className="features-grid">
              {features.map((feature, index) => (
                <article key={feature.title} className="feature-card" data-reveal style={{ '--delay': `${index * 70}ms` } as React.CSSProperties}>
                  <span><Icon name={feature.icon} /></span><div><h3>{feature.title}</h3><p>{feature.description}</p></div>
                </article>
              ))}
            </div>
            <div className="features-action" data-reveal><Link to="/register" className="button button--primary button--large">Trải nghiệm các chức năng <Icon name="arrow-right" /></Link></div>
          </div>
        </section>

        <ProcessJourney />

        <section id="thu-vien" className="section gallery-section">
          <div className="landing-container">
            <div className="section-heading section-heading--split" data-reveal>
              <div><span className="eyebrow"><span className="eyebrow__dot" /> Khoảnh khắc tuổi trẻ</span><h2>Những hành trình <span>đáng nhớ</span></h2></div>
              <p>Mỗi hoạt động là một trải nghiệm, mỗi trải nghiệm là một bước tiến gần hơn đến phiên bản tốt nhất của chính mình.</p>
            </div>
            <div className="gallery-grid">
              {gallery.map((item, index) => <figure key={item.label} className={index === 0 ? 'gallery-item gallery-item--large' : 'gallery-item'} data-reveal><img src={item.src} alt={item.alt} loading="lazy" /><figcaption><span>{item.label}</span><Icon name="arrow-right" /></figcaption></figure>)}
            </div>
          </div>
        </section>

        <section className="section why-section">
          <div className="landing-container why-layout">
            <div className="why-visual" data-reveal>
              <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1100&q=84" alt="Nhóm sinh viên cùng học tập và làm việc" loading="lazy" />
              <div className="why-badge"><strong>5+</strong><span>Năm đồng hành<br />cùng sinh viên</span></div>
            </div>
            <div className="why-copy" data-reveal>
              <span className="eyebrow"><span className="eyebrow__dot" /> Vì sao chọn SV5T?</span>
              <h2>Thiết kế để bạn <span>tự tin tiến bước</span></h2>
              <p>Nền tảng lấy trải nghiệm sinh viên làm trung tâm, giúp mọi cột mốc trở nên rõ ràng và đáng nhớ.</p>
              <ul>
                {[['Minh bạch và công bằng', 'Mọi tiêu chí và kết quả xét duyệt đều rõ ràng.'], ['Dữ liệu luôn an toàn', 'Thông tin cá nhân được bảo vệ theo tiêu chuẩn cao.'], ['Hỗ trợ xuyên suốt', 'Đội ngũ sẵn sàng đồng hành trong toàn bộ hành trình.']].map(([title, desc]) => <li key={title}><span><Icon name="check" /></span><div><strong>{title}</strong><small>{desc}</small></div></li>)}
              </ul>
            </div>
          </div>
        </section>

        <TestimonialsSection testimonials={testimonialMockData} />

        <section id="faq" className="section faq-section">
          <div className="landing-container faq-layout">
            <div className="faq-copy" data-reveal><span className="eyebrow"><span className="eyebrow__dot" /> Giải đáp nhanh</span><h2>Bạn đang có<br /><span>câu hỏi?</span></h2><p>Không tìm thấy câu trả lời? Đội ngũ hỗ trợ luôn sẵn sàng lắng nghe bạn.</p><a href="mailto:lienhe@sv5t.edu.vn" className="text-link">Liên hệ hỗ trợ <Icon name="arrow-right" /></a></div>
            <div className="faq-list" data-reveal>
              {faqs.map(([question, answer], index) => <article className={`faq-item ${openFaq === index ? 'is-open' : ''}`} key={question}><button onClick={() => setOpenFaq(openFaq === index ? -1 : index)} aria-expanded={openFaq === index}><span><i>{String(index + 1).padStart(2, '0')}</i>{question}</span><Icon name="chevron-down" /></button><div className="faq-answer"><p>{answer}</p></div></article>)}
            </div>
          </div>
        </section>

        <section className="cta-section">
          <div className="cta-bg" aria-hidden="true" />
          <div className="landing-container cta-content" data-reveal><span className="eyebrow eyebrow--dark"><span className="eyebrow__dot" /> Hành trình bắt đầu từ hôm nay</span><h2>Sẵn sàng chinh phục danh hiệu<br /><span>Sinh viên 5 Tốt?</span></h2><p>Tham gia cùng hàng ngàn sinh viên đang xây dựng phiên bản toàn diện hơn của chính mình.</p><div><Link to="/register" className="button button--white button--large">Tạo tài khoản miễn phí <Icon name="arrow-right" /></Link><a href="#gioi-thieu" className="button button--outline-white button--large">Tìm hiểu thêm</a></div></div>
        </section>
      </main>

      <footer id="lien-he" className="site-footer">
        <div className="landing-container footer-grid">
          <div className="footer-brand"><BrandLogo /><p>Hệ thống quản lý và đồng hành cùng sinh viên trên hành trình chinh phục danh hiệu Sinh viên 5 Tốt.</p><div className="socials"><a href="#" aria-label="Facebook"><Icon name="facebook" /></a><a href="#" aria-label="YouTube"><Icon name="youtube" /></a><a href="#" aria-label="Instagram"><Icon name="instagram" /></a></div></div>
          <div><h3>Khám phá</h3><a href="#trang-chu">Trang chủ</a><a href="#gioi-thieu">Giới thiệu</a><a href="#tieu-chi">Tiêu chí</a><a href="#tinh-nang">Tính năng</a></div>
          <div><h3>Hỗ trợ</h3><a href="#faq">Câu hỏi thường gặp</a><a href="#lien-he">Liên hệ</a><a href="#">Hướng dẫn sử dụng</a><a href="#">Điều khoản sử dụng</a></div>
          <div><h3>Liên hệ</h3><p><Icon name="home" /> Phòng Công tác Sinh viên, Nhà A1</p><p><Icon name="mail" /> lienhe@sv5t.edu.vn</p><p><Icon name="phone" /> 1900 6868</p></div>
        </div>
        <div className="footer-bottom"><div className="landing-container"><span>© 2026 Sinh Viên 5 Tốt. Bảo lưu mọi quyền.</span><span>Được xây dựng với <Icon name="heart" /> dành cho sinh viên Việt Nam</span></div></div>
      </footer>
    </div>
  );
}
