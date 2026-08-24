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
    <section id="quy-trinh" className={`p-[100px_0] max-[580px]:p-[75px_0] max-[420px]:py-[66px] [--process-cyan:#24b6f7] [--process-sky:#69d5ff] relative min-h-[760px] overflow-hidden p-[112px_0_132px] text-[var(--navy)] bg-[radial-gradient(circle_at_78%_18%,_rgba(36,182,247,.13),_transparent_31%),_radial-gradient(circle_at_12%_82%,_rgba(22,131,255,.08),_transparent_29%),_linear-gradient(180deg,_#f6fbff_0%,_#eaf6ff_52%,_#f8fcff_100%)] isolate before:content-[''] before:absolute before:z-[-1] before:inset-0 before:opacity-[.3] before:pointer-events-none before:bg-[image:linear-gradient(rgba(22,131,255,.07)_1px,transparent_1px),_linear-gradient(90deg,rgba(22,131,255,.07)_1px,transparent_1px)] before:bg-[length:54px_54px] before:[mask-image:linear-gradient(to_bottom,transparent,black_28%,black_75%,transparent)] max-[900px]:min-h-[auto] max-[900px]:py-[88px_94px] max-[580px]:py-[74px_80px]`}>
      <div className={`absolute z-[-1] inset-0 overflow-hidden pointer-events-none`} aria-hidden="true">
        <span className={`absolute rounded-full filter-[blur(2px)] w-[520px] h-[520px] left-[-210px] top-[-260px] bg-[radial-gradient(circle,rgba(36,182,247,.16),transparent_69%)]`} />
        <span className={`absolute rounded-full filter-[blur(2px)] w-[650px] h-[650px] right-[-240px] bottom-[-430px] bg-[radial-gradient(circle,rgba(22,131,255,.11),transparent_68%)]`} />
        <span className={`absolute right-[6%] top-[8%] w-[210px] h-[150px] opacity-[.18] bg-[image:radial-gradient(circle,_var(--blue)_1px,_transparent_1.5px)] bg-[length:18px_18px] transform-[rotate(-7deg)] max-[900px]:right-[-45px] max-[900px]:top-[5%]`} />
        <span className={`process-stars absolute z-[-1] inset-0 overflow-hidden pointer-events-none [&_i]:absolute [&_i]:left-[var(--star-left)] [&_i]:top-[var(--star-top)] [&_i]:w-[2px] [&_i]:h-[2px] [&_i]:rounded-full [&_i]:bg-[rgba(22,131,255,.38)] [&_i]:shadow-[0_0_7px_rgba(36,182,247,.3)]`}>
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

      <div className={`landing-container w-[min(1180px,_calc(100%_-_48px))] mx-auto max-[850px]:w-[min(100%_-_36px,_680px)] max-[580px]:w-[calc(100%_-_30px)] max-[700px]:w-[calc(100%_-_30px)] max-[420px]:w-[calc(100%_-_24px)] relative z-[1]`}>
        <header className={`max-w-[800px] [&_h2]:m-[19px_0_14px] [&_h2]:max-w-[760px] [&_h2]:text-[var(--navy)] [&_h2]:font-['Be_Vietnam_Pro',sans-serif] [&_h2]:text-[clamp(38px,5.2vw,68px)] [&_h2]:leading-[1.04] [&_h2]:tracking-[-2.7px] [&_p]:max-w-[625px] [&_p]:m-0 [&_p]:text-[var(--muted)] [&_p]:text-[14px] [&_p]:leading-[1.8] max-[900px]:mx-auto max-[900px]:text-center max-[900px]:[&_h2]:max-w-[660px] max-[900px]:[&_h2]:mx-auto max-[900px]:[&_h2]:text-[clamp(36px,8vw,53px)] max-[900px]:[&_h2]:tracking-[-2px] max-[900px]:[&_p]:mx-auto max-[580px]:[&_h2]:text-[34px] max-[580px]:[&_h2]:tracking-[-1.5px] max-[580px]:[&_p]:text-[13px] max-[420px]:[&_h2]:text-[30px] [&_h2]:text-[var(--landing-heading)] [&_h2]:font-['Be_Vietnam_Pro',_ui-sans-serif,_system-ui,_sans-serif] [&_h2]:font-bold [&_p]:text-[var(--landing-muted)]`} data-reveal>
          <span className={`inline-flex items-center gap-[8px] text-[var(--blue)] p-[7px_11px] border border-[#d7e4fb] rounded-full bg-[rgba(255,255,255,.75)] text-[9.5px] font-extrabold tracking-[1.25px] uppercase text-[var(--blue-700)] border-[#cfe8fb] bg-[rgba(255,255,255,.82)] shadow-[0_8px_22px_rgba(22,131,255,.07)] [&_.eyebrow__dot]:bg-[var(--blue)] [&_.eyebrow__dot]:shadow-[0_0_0_5px_rgba(22,131,255,.1)]`}>
            <span className={`eyebrow__dot relative w-[6px] h-[6px] rounded-full bg-[var(--blue)] shadow-[0_0_0_4px_rgba(36,99,235,.12)]`} /> Quy trình tinh gọn
          </span>
          <h2>Bốn bước để <span className="inline-block bg-[linear-gradient(95deg,var(--blue-700),var(--process-cyan))] bg-clip-text text-transparent [-webkit-text-fill-color:transparent]">chạm đến danh hiệu</span></h2>
          <p>Một lộ trình rõ ràng để bạn tập trung vào điều quan trọng nhất: rèn luyện, hoàn thiện và trưởng thành.</p>
        </header>

        <div className={`relative min-h-[430px] mt-[70px] max-[900px]:min-h-0 max-[900px]:mt-[55px] max-[580px]:mt-[43px]`}>
          <svg className={`absolute z-[0] inset-[-11px_0_auto] w-full h-[430px] overflow-visible max-[900px]:hidden`} viewBox="0 0 1160 430" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="process-path-gradient" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" className={`process-path-stop [stop-color:var(--blue)]`} />
                <stop offset="58%" className={`process-path-stop [stop-color:var(--process-cyan)]`} />
                <stop offset="100%" className={`process-path-stop [stop-color:var(--process-sky)]`} />
              </linearGradient>
              <filter id="process-path-glow" x="-15%" y="-30%" width="130%" height="160%">
                <feGaussianBlur stdDeviation="7" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            <path
              className={`fill-[none] stroke-[url(#process-path-gradient)] [stroke-linecap:round] stroke-[length:15] opacity-[.1] filter-[url(#process-path-glow)]`}
              d="M28 356 C170 360 215 310 320 304 S495 274 590 242 S760 191 852 150 S1015 98 1132 40"
            />
            <path
              className={`fill-[none] stroke-[url(#process-path-gradient)] [stroke-linecap:round] stroke-[length:2.2] [stroke-dasharray:9_12] opacity-[.58]`}
              d="M28 356 C170 360 215 310 320 304 S495 274 590 242 S760 191 852 150 S1015 98 1132 40"
            />
          </svg>

          <ol className={`process-steps relative z-[1] flex items-start gap-[22px] m-0 p-0 list-none [&.is-visible_.process-step]:opacity-100 [&.is-visible_.process-step]:transform-[translateY(var(--step-offset))] max-[900px]:flex max-[900px]:flex-col max-[900px]:gap-[22px] max-[900px]:max-w-[650px] max-[900px]:mx-auto max-[900px]:pl-[55px] max-[900px]:before:content-[''] max-[900px]:before:absolute max-[900px]:before:left-[16px] max-[900px]:before:top-[18px] max-[900px]:before:bottom-[18px] max-[900px]:before:w-[2px] max-[900px]:before:rounded-full max-[900px]:before:bg-[linear-gradient(to_bottom,var(--blue),var(--process-cyan),var(--process-sky))] max-[900px]:before:opacity-[.58] max-[900px]:[&.is-visible_.process-step]:w-full max-[900px]:[&.is-visible_.process-step]:min-h-0 max-[900px]:[&.is-visible_.process-step]:p-0 max-[900px]:[&.is-visible_.process-step]:transform-none max-[900px]:[&.is-visible_.process-step]:transform-[translateX(0)] max-[580px]:gap-[17px] max-[580px]:pl-[45px] max-[580px]:before:left-[14px] max-[420px]:pl-[41px] max-[420px]:before:left-[13px]`} data-reveal aria-label="Quy trình đăng ký Sinh viên 5 Tốt">
            {steps.map((step, index) => (
              <li
                className={`process-step relative flex-1 min-w-0 opacity-0 transform-[translateY(calc(var(--step-offset)_+_30px))] transition-[var(--step-delay),var(--step-delay)] duration-[.62s,.72s] ease-[ease,cubic-bezier(.2,.85,.25,1)] before:[content:''] before:absolute before:z-[-1] before:left-[50%] before:top-[-18px] before:w-[13px] before:h-[13px] before:border-[length:3px] before:border-solid before:border-[white] before:rounded-full before:bg-[var(--blue)] before:shadow-[0_0_0_7px_rgba(22,131,255,.12),0_0_20px_rgba(36,182,247,.35)] before:transform-[translateX(-50%)] before:transition-[transform,box-shadow] before:duration-[.3s,.3s] before:ease-[ease,ease] hover:z-[3] [&:hover::before]:transform-[translateX(-50%)_scale(1.22)] [&:hover::before]:shadow-[0_0_0_9px_rgba(36,182,247,.14),0_0_28px_rgba(105,213,255,.8)] [&:hover_.process-card]:border-[#8dcfff] [&:hover_.process-card]:bg-white [&:hover_.process-card]:shadow-[0_30px_68px_rgba(24,105,170,.2),0_0_0_1px_rgba(22,131,255,.05)] [&:hover_.process-card]:transform-[translateY(-12px)] [&:hover_.process-card__icon]:text-white [&:hover_.process-card__icon]:bg-[linear-gradient(145deg,var(--process-cyan),var(--blue))] [&:hover_.process-card__icon]:transform-[rotate(-5deg)_scale(1.08)] max-[900px]:w-full max-[900px]:min-h-0 max-[900px]:p-0 max-[900px]:transform-none max-[900px]:transform-[translateX(26px)] max-[900px]:before:content-[attr(data-step)] max-[900px]:before:left-[-55px] max-[900px]:before:top-[22px] max-[900px]:before:grid max-[900px]:before:place-items-center max-[900px]:before:w-[34px] max-[900px]:before:h-[34px] max-[900px]:before:text-white max-[900px]:before:border-[length:2px] max-[900px]:before:border-solid max-[900px]:before:border-[rgba(224,246,255,.94)] max-[900px]:before:bg-[var(--blue)] max-[900px]:before:shadow-[0_0_0_6px_rgba(22,131,255,.14),0_0_19px_rgba(36,182,247,.46)] max-[900px]:before:[font-family:'Be_Vietnam_Pro',sans-serif] max-[900px]:before:text-[10px] max-[900px]:before:font-extrabold max-[900px]:before:transform-none max-[900px]:[&:hover::before]:transform-[scale(1.07)] max-[580px]:before:left-[-45px] max-[580px]:before:top-[21px] max-[580px]:before:w-[30px] max-[580px]:before:h-[30px] max-[420px]:before:left-[-41px]${index === steps.length - 1 ? ` process-step--final before:bg-[var(--process-cyan)] before:shadow-[0_0_0_8px_rgba(36,182,247,.17),0_0_30px_rgba(105,213,255,.75)] [&_.process-card]:border-[#8dcefa] [&_.process-card]:bg-[linear-gradient(150deg,#fff,#ecf8ff)] [&_.process-card]:shadow-[0_28px_64px_rgba(18,111,181,.2),inset_0_1px_0_white] [&_.process-card__ghost]:text-[rgba(22,131,255,.08)] [&_.process-card__status]:text-[#0668bd] [&_.process-card__status]:border-[#b8dff8] [&_.process-card__status]:bg-[#e8f6ff]` : ''}`}
                data-step={index + 1}
                key={step.title}
                style={{
                  '--step-offset': stepOffsets[index],
                  '--step-delay': `${index * 130}ms`,
                } as ProcessStyle}
              >
                <article className={`process-card relative min-h-[260px] overflow-hidden p-[23px_21px_25px] border border-[#d5e9f8] rounded-[19px] bg-[rgba(255,255,255,.94)] shadow-[0_22px_52px_rgba(24,87,137,.13),0_3px_10px_rgba(24,87,137,.05)] backdrop-blur-[14px] transition-[transform,border-color,background,box-shadow] duration-[.35s,.35s,.35s,.35s] ease-[ease,ease,ease,ease] after:content-[''] after:absolute after:inset-0 after:pointer-events-none after:bg-[linear-gradient(125deg,rgba(105,213,255,.08),transparent_34%)] [&_h3]:relative [&_h3]:z-[1] [&_h3]:m-[0_0_10px] [&_h3]:text-[#143452] [&_h3]:text-[16px] [&_h3]:tracking-[-.25px] [&_p]:relative [&_p]:z-[1] [&_p]:m-0 [&_p]:text-[#647c93] [&_p]:text-[11px] [&_p]:leading-[1.72] max-[900px]:min-h-0 max-[900px]:p-[25px_25px_27px] max-[900px]:[&_p]:max-w-[520px] max-[580px]:p-[21px_19px_23px] max-[580px]:rounded-[17px] max-[420px]:p-[20px_17px_22px] [&_h3]:text-[var(--landing-heading)] [&_h3]:font-['Be_Vietnam_Pro',_ui-sans-serif,_system-ui,_sans-serif] [&_h3]:font-bold [&_p]:text-[var(--landing-muted)] [&_p]:text-[var(--landing-body)]`}>
                  <span className={`process-card__ghost absolute right-[10px] bottom-[-23px] text-[rgba(22,131,255,.055)] font-['Be_Vietnam_Pro',sans-serif] text-[105px] font-extrabold leading-[1] tracking-[-7px] select-none max-[580px]:right-[8px] max-[580px]:bottom-[-16px] max-[580px]:text-[82px]`} aria-hidden="true">{step.number}</span>
                  <div className={`relative z-[1] flex justify-between items-center gap-[9px] text-[#758ba2] text-[9px] font-extrabold tracking-[.9px] uppercase max-[580px]:items-start`}>
                    <span>Bước {step.number}</span>
                    <span className={`process-card__status inline-flex items-center gap-[6px] p-[6px_9px] text-[var(--blue-700)] border border-[#cce8fb] rounded-full bg-[#eff9ff] text-[7.5px] tracking-[.35px] whitespace-nowrap [&_i]:w-[5px] [&_i]:h-[5px] [&_i]:rounded-full [&_i]:bg-[var(--process-cyan)] [&_i]:shadow-[0_0_0_4px_rgba(36,182,247,.1)] max-[420px]:px-[7px]`}><i /> {step.status}</span>
                  </div>
                  <span className={`process-card__icon relative z-[1] grid place-items-center w-[52px] h-[52px] m-[28px_0_23px] text-[var(--blue-700)] border border-[#cce7fa] rounded-[15px] bg-[linear-gradient(145deg,#eef9ff,#e4f3ff)] shadow-[inset_0_1px_0_white] transition-[transform,color,background] duration-[.35s,.3s,.3s] ease-[cubic-bezier(.2,.8,.2,1),ease,ease] [&_svg]:w-[23px] [&_svg]:h-[23px] max-[900px]:m-[24px_0_20px] max-[580px]:w-[48px] max-[580px]:h-[48px] max-[580px]:m-[21px_0_18px]`}><Icon name={step.icon} /></span>
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
