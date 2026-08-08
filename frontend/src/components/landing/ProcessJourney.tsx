import type { CSSProperties } from 'react';
import { Icon, type IconName } from '../common/BrandLogo';

type ProcessStep = {
  number: string;
  title: string;
  description: string;
  icon: IconName;
  status: string;
};

type ProcessStyle = CSSProperties & Record<`--${string}`, string>;

const steps: ProcessStep[] = [
  {
    number: '01',
    title: 'Tạo tài khoản',
    description: 'Đăng ký nhanh bằng email sinh viên và bắt đầu hành trình của bạn.',
    icon: 'user',
    status: 'Bắt đầu',
  },
  {
    number: '02',
    title: 'Hoàn thiện hồ sơ',
    description: 'Bổ sung thông tin cá nhân và xác định mục tiêu rèn luyện rõ ràng.',
    icon: 'layers',
    status: 'Tiếp nối',
  },
  {
    number: '03',
    title: 'Nộp minh chứng',
    description: 'Tải lên minh chứng theo từng tiêu chí và theo dõi phản hồi trực tuyến.',
    icon: 'upload',
    status: 'Xác thực',
  },
  {
    number: '04',
    title: 'Nhận danh hiệu',
    description: 'Theo dõi xét duyệt, nhận kết quả và ghi dấu hành trình trưởng thành.',
    icon: 'award',
    status: 'Hoàn tất',
  },
];

const stepOffsets = ['76px', '26px', '-26px', '-84px'];
const stars = Array.from({ length: 28 }, (_, index) => ({
  left: `${(index * 37 + 9) % 98}%`,
  top: `${(index * 47 + 7) % 78}%`,
  delay: `${(index % 8) * 0.42}s`,
  duration: `${3.1 + (index % 5) * 0.45}s`,
}));

export function ProcessJourney() {
  return (
    <section id="quy-trinh" className="section process-section">
      <div className="process-decor" aria-hidden="true">
        <span className="process-glow process-glow--one" />
        <span className="process-glow process-glow--two" />
        <span className="process-dot-grid" />
        <span className="process-stars">
          {stars.map((star, index) => (
            <i
              key={index}
              style={{
                '--star-left': star.left,
                '--star-top': star.top,
                '--star-delay': star.delay,
                '--star-duration': star.duration,
              } as ProcessStyle}
            />
          ))}
        </span>
      </div>

      <div className="landing-container process-inner">
        <header className="process-heading" data-reveal>
          <span className="eyebrow eyebrow--dark">
            <span className="eyebrow__dot" /> Quy trình tinh gọn
          </span>
          <h2>Bốn bước để <span>chạm đến danh hiệu</span></h2>
          <p>Một lộ trình rõ ràng để bạn tập trung vào điều quan trọng nhất: rèn luyện, hoàn thiện và trưởng thành.</p>
        </header>

        <div className="process-stairway">
          <svg className="process-path" viewBox="0 0 1160 430" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="process-path-gradient" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" className="process-path-stop process-path-stop--start" />
                <stop offset="58%" className="process-path-stop process-path-stop--middle" />
                <stop offset="100%" className="process-path-stop process-path-stop--end" />
              </linearGradient>
              <filter id="process-path-glow" x="-15%" y="-30%" width="130%" height="160%">
                <feGaussianBlur stdDeviation="7" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            <path
              className="process-path__glow"
              d="M28 356 C170 360 215 310 320 304 S495 274 590 242 S760 191 852 150 S1015 98 1132 40"
            />
            <path
              className="process-path__line"
              d="M28 356 C170 360 215 310 320 304 S495 274 590 242 S760 191 852 150 S1015 98 1132 40"
            />
          </svg>

          <ol className="process-steps" data-reveal aria-label="Quy trình đăng ký Sinh viên 5 Tốt">
            {steps.map((step, index) => (
              <li
                className={`process-step${index === steps.length - 1 ? ' process-step--final' : ''}`}
                data-step={index + 1}
                key={step.title}
                style={{
                  '--step-offset': stepOffsets[index],
                  '--step-delay': `${index * 130}ms`,
                } as ProcessStyle}
              >
                <article className="process-card">
                  <span className="process-card__ghost" aria-hidden="true">{step.number}</span>
                  <div className="process-card__top">
                    <span>Bước {step.number}</span>
                    <span className="process-card__status"><i /> {step.status}</span>
                  </div>
                  <span className="process-card__icon"><Icon name={step.icon} /></span>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </article>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
