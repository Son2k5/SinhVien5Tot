import { Link } from 'react-router-dom';
import { Icon } from '../common/BrandLogo';
import heroEvent from '../../assets/home-page/artboard-1.png';

export function LandingHeroSection() {
  return (
    <section
      id="trang-chu"
      className={`relative min-h-[790px] p-[142px_0_102px] bg-[linear-gradient(145deg,_#ffffff_8%,_#f0f9ff_54%,_#dff3ff)] overflow-hidden before:content-[''] before:absolute before:w-[58vw] before:h-[58vw] before:max-w-[840px] before:max-h-[840px] before:right-[-18vw] before:top-[-24vw] before:rounded-full before:border before:border-[rgba(34,154,233,.15)] before:shadow-[0_0_0_68px_rgba(61,184,255,.045),_0_0_0_136px_rgba(61,184,255,.03)] [&_h1]:m-[22px_0_20px] [&_h1]:text-[#0d213e] [&_h1]:font-['Be_Vietnam_Pro',_sans-serif] [&_h1]:text-[clamp(43px,_4.5vw,_64px)] [&_h1]:leading-[1.06] [&_h1]:tracking-[-2.7px] [&_h1_.hero-title-dark]:text-[#0d213e] [&_h1_.hero-title-dark]:bg-none [&_h1_.hero-title-dark]:[-webkit-text-fill-color:#0d213e] max-[850px]:min-h-[auto] max-[850px]:pt-[125px] max-[580px]:p-[108px_0_70px] max-[580px]:[&_h1]:max-w-full max-[580px]:[&_h1]:text-[34px] max-[580px]:[&_h1]:tracking-[-1.5px] max-[580px]:[&_h1]:[overflow-wrap:anywhere] max-[420px]:[&_h1]:text-[30px] max-[420px]:[&_h1]:leading-[1.1] max-[420px]:[&_h1]:tracking-[-1.25px] [&_h1]:text-[var(--landing-heading)] [&_h1]:font-['Be_Vietnam_Pro',_ui-sans-serif,_system-ui,_sans-serif] [&_h1]:font-bold [&_h1_.hero-title-dark]:text-[var(--landing-heading)] [&_h1_.hero-title-dark]:[-webkit-text-fill-color:var(--landing-heading)]`}
    >
      <div
        className={`absolute inset-0 opacity-[.28] bg-[image:linear-gradient(rgba(80,112,171,.08)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(80,112,171,.08)_1px,_transparent_1px)] bg-[length:44px_44px] [mask-image:linear-gradient(to_right,_#000,_transparent_42%,_#000)]`}
        aria-hidden="true"
      />
      <div
        className={`absolute rounded-full filter-[blur(2px)] opacity-[.45] w-[430px] h-[430px] right-[-140px] top-[80px] bg-[radial-gradient(circle,_#9edcff,_transparent_70%)]`}
        aria-hidden="true"
      />
      <div
        className={`absolute rounded-full filter-[blur(2px)] opacity-[.45] w-[330px] h-[330px] left-[-170px] bottom-[10px] bg-[radial-gradient(circle,_#bdeeff,_transparent_70%)]`}
        aria-hidden="true"
      />
      <div className={`landing-container w-[min(1180px,_calc(100%_-_48px))] mx-auto max-[850px]:w-[min(100%_-_36px,_680px)] max-[580px]:w-[calc(100%_-_30px)] max-[700px]:w-[calc(100%_-_30px)] max-[420px]:w-[calc(100%_-_24px)] relative grid grid-cols-[.86fr_1.14fr] items-center gap-[30px] [&>*]:min-w-0 max-[1050px]:gap-[28px] max-[850px]:grid-cols-[1fr] max-[850px]:text-center`}>
        <div
          className={`w-full max-w-[620px] [&>p]:max-w-[570px] [&>p]:m-0 [&>p]:text-[#627088] [&>p]:text-[15px] [&>p]:leading-[1.85] max-[850px]:m-[auto] max-[850px]:[&>p]:mx-auto max-[580px]:[&>p]:text-[14px] max-[420px]:[&>p]:text-[13px] max-[420px]:[&>p]:leading-[1.75] [&>p]:text-[var(--landing-muted)]`}
          data-reveal
        >
          <span className={`inline-flex items-center gap-[8px] text-[var(--blue)] p-[7px_11px] border border-[#d7e4fb] rounded-full bg-[rgba(255,255,255,.75)] text-[9.5px] font-extrabold tracking-[1.25px] uppercase`}>
            <span className={`eyebrow__dot relative w-[6px] h-[6px] rounded-full bg-[var(--blue)] shadow-[0_0_0_4px_rgba(36,99,235,.12)]`} /> Nền tảng dành cho sinh viên Việt Nam
          </span>
          <h1>
            Biến nỗ lực hôm nay thành <span className="hero-title-dark">dấu ấn</span><br />
            <span className="inline-block bg-gradient-to-r from-[#0878f5] to-[#24b6f7] bg-clip-text text-transparent [-webkit-text-fill-color:transparent]">Sinh viên 5 Tốt</span>
          </h1>
          <p>Một không gian số để bạn quản lý hồ sơ, nhìn rõ tiến độ và kết nối mọi dấu mốc rèn luyện — trực quan, minh bạch và đầy cảm hứng.</p>
          <div className={`flex gap-[12px] mt-[30px] max-[850px]:justify-center max-[580px]:grid max-[420px]:[&_.button]:w-full max-[420px]:[&_.button]:justify-center`}>
            <Link
              to="/register"
              className={`button inline-flex justify-center items-center gap-[8px] min-h-[42px] p-[0_17px] border border-[transparent] rounded-[11px] text-[12.5px] font-bold cursor-pointer transition-[transform,box-shadow,color,background] duration-[.2s,.2s,.2s,.2s] ease-[ease,ease,ease,ease] [&_svg]:w-[16px] [&_svg]:h-[16px] [&_svg]:transition-[transform] [&_svg]:duration-[.2s] [&_svg]:ease-[ease] hover:transform-[translateY(-2px)] [&:hover_svg]:transform-[translateX(3px)] text-white bg-[linear-gradient(135deg,_#20a4ff,_#0876ef)] shadow-[0_10px_25px_rgba(8,118,239,.25)] hover:shadow-[0_14px_30px_rgba(8,118,239,.38)] min-h-[52px] px-[23px] rounded-[13px] text-[13px]`}
            >
              Bắt đầu hành trình <Icon name="arrow-right" />
            </Link>
            <a
              href="#gioi-thieu"
              className={`button inline-flex justify-center items-center gap-[8px] min-h-[42px] p-[0_17px] border border-[transparent] rounded-[11px] text-[12.5px] font-bold cursor-pointer transition-[transform,box-shadow,color,background] duration-[.2s,.2s,.2s,.2s] ease-[ease,ease,ease,ease] [&_svg]:w-[16px] [&_svg]:h-[16px] [&_svg]:transition-[transform] [&_svg]:duration-[.2s] [&_svg]:ease-[ease] hover:transform-[translateY(-2px)] [&:hover_svg]:transform-[translateX(3px)] text-[#29354b] bg-white border-[#dce4f0] shadow-[0_8px_24px_rgba(28,53,100,.07)] min-h-[52px] px-[23px] rounded-[13px] text-[13px]`}
            >
              <span className={`grid place-items-center w-[25px] h-[25px] rounded-full text-white bg-[var(--blue)] [&_svg]:w-[11px] [&_svg]:h-[11px] [&_svg]:ml-[1px]`}>
                <Icon name="play" />
              </span> Khám phá thêm
            </a>
          </div>
          <div className={`flex items-center gap-[13px] mt-[34px] [&>span:last-child]:grid [&>span:last-child]:gap-[2px] [&>span:last-child]:text-[10px] [&_strong]:text-[11px] [&_small]:text-[#8490a3] max-[850px]:justify-center max-[580px]:mt-[25px]`}>
            <span
              className={`flex [&_i]:grid [&_i]:place-items-center [&_i]:w-[32px] [&_i]:h-[32px] [&_i]:mr-[-7px] [&_i]:border-[length:2px] [&_i]:border-solid [&_i]:border-[#fff] [&_i]:rounded-full [&_i]:text-white [&_i]:bg-[linear-gradient(145deg,_#92b7f8,_#315bb5)] [&_i]:text-[8px] [&_i]:not-italic [&_i]:font-bold [&_i:nth-child(2)]:bg-[linear-gradient(145deg,_#ae94eb,_#6548b0)] [&_i:nth-child(3)]:bg-[linear-gradient(145deg,_#6fc6bc,_#28756f)] [&_i:last-child]:text-[var(--blue)] [&_i:last-child]:bg-[#e7efff]`}
              aria-hidden="true"
            >
              <i>MN</i><i>TL</i><i>HP</i><i>+2k</i>
            </span>
            <span><strong>2.000+ sinh viên</strong><small>đang hoàn thiện hồ sơ mỗi ngày</small></span>
          </div>
        </div>

        <div
          className={`relative min-h-[570px] grid items-center isolate before:content-[''] before:absolute before:z-[-1] before:w-[570px] before:h-[570px] before:right-[-110px] before:top-[0] before:border before:border-[rgba(64,181,247,.18)] before:rounded-full before:shadow-[0_0_0_44px_rgba(81,194,255,.045),_0_0_0_90px_rgba(81,194,255,.025)] [&:hover_.hero-orbit-photo]:transform-[translate(5px,-7px)_rotate(5deg)] max-[1050px]:min-h-[520px] max-[850px]:w-[min(100%,640px)] max-[850px]:min-h-[490px] max-[850px]:m-[16px_auto_0] max-[580px]:min-h-[350px] max-[580px]:m-[18px_auto_-5px] max-[580px]:w-full max-[580px]:max-w-full max-[580px]:before:hidden`}
          data-reveal
        >
          <div className={`absolute inset-[4%_-14%_0_-4%] bg-[radial-gradient(ellipse,_rgba(28,168,255,.42),_transparent_66%)] filter-[blur(20px)]`} />
          <div className={`absolute z-[0] inset-[64px_-56px_54px_20px] rounded-[96px_34px_122px_48px_/_62px_118px_52px_104px] bg-[linear-gradient(135deg,#0f80f5,#35c8f4_72%,#85e5f6)] transform-[rotate(4deg)_scale(1.015)] shadow-[0_35px_80px_rgba(14,123,221,.25)] max-[1050px]:right-[-26px] max-[850px]:inset-[58px_-20px_48px_20px] max-[580px]:inset-[48px_2px_38px_24px]`} aria-hidden="true" />
          <div className={`absolute z-[3] top-[24px] left-[-24px] grid text-[#0d75df] transform-[rotate(-7deg)] [&_strong]:font-['Be_Vietnam_Pro',sans-serif] [&_strong]:text-[88px] [&_strong]:leading-[.8] [&_strong]:tracking-[-7px] [&_strong]:text-shadow-[5px_5px_0_#fff,_10px_10px_0_rgba(19,137,230,.14)] [&_span]:m-[8px_0_0_18px] [&_span]:text-[#315b80] [&_span]:text-[9px] [&_span]:font-extrabold [&_span]:tracking-[2px] [&_span]:uppercase max-[850px]:left-[0] max-[580px]:top-[18px] max-[580px]:left-[2px] max-[580px]:[&_strong]:text-[48px] max-[580px]:[&_strong]:tracking-[-4px] max-[580px]:[&_strong]:text-shadow-[3px_3px_0_#fff,_6px_6px_0_rgba(19,137,230,.12)] max-[580px]:[&_span]:m-[6px_0_0_10px] max-[580px]:[&_span]:text-[7px]`} aria-hidden="true">
            <strong>05</strong><span>tiêu chí</span>
          </div>
          <figure className={`relative z-[2] w-[min(690px,_calc(100%_+_64px))] h-[420px] m-[0_-46px_0_auto] overflow-hidden border-[length:10px] border-solid border-[rgba(255,255,255,.94)] rounded-[88px_28px_108px_42px_/_58px_102px_46px_92px] bg-[#d7eeff] shadow-[0_44px_100px_rgba(17,104,190,.32)] transform-[perspective(1100px)_rotateY(-2deg)_rotateX(.5deg)_rotate(-1deg)] transition-[transform,box-shadow] duration-[.35s,.3s] ease-[cubic-bezier(.2,.8,.2,1),ease] after:content-[''] after:absolute after:inset-0 after:bg-[linear-gradient(180deg,_transparent_45%,_rgba(3,35,74,.68))] after:pointer-events-none after:transition-[opacity] after:duration-[.4s] after:ease-[ease] [&>img]:w-full [&>img]:h-full [&>img]:object-cover [&>img]:object-[right_center] [&>img]:transform-[scale(1.16)] [&>img]:origin-[right_center] [&>img]:transition-[transform,filter] [&>img]:duration-[.45s,.3s] [&>img]:ease-[cubic-bezier(.2,.8,.2,1),ease] hover:transform-[perspective(1100px)_rotateY(0)_rotateX(0)_translateY(-8px)_scale(1.02)_rotate(0)] hover:shadow-[0_52px_115px_rgba(17,104,190,.38)] [&:hover>img]:transform-[scale(1.22)] [&:hover>img]:filter-[saturate(1.08)_contrast(1.03)] [&:hover_.hero-photo-card__shine]:left-[135%] [&_figcaption]:absolute [&_figcaption]:z-[3] [&_figcaption]:inset-[auto_70px_36px] [&_figcaption]:flex [&_figcaption]:items-center [&_figcaption]:gap-[12px] [&_figcaption]:text-white [&_figcaption]:transform-[translateY(3px)] [&_figcaption]:transition-[transform] [&_figcaption]:duration-[.3s] [&_figcaption]:ease-[ease] [&:hover_figcaption]:transform-[translateY(-3px)] [&_figcaption>span]:grid [&_figcaption>span]:place-items-center [&_figcaption>span]:w-[42px] [&_figcaption>span]:h-[42px] [&_figcaption>span]:border [&_figcaption>span]:border-[rgba(255,255,255,.35)] [&_figcaption>span]:rounded-[13px] [&_figcaption>span]:bg-[rgba(255,255,255,.18)] [&_figcaption>span]:backdrop-blur-[10px] [&_figcaption_svg]:w-[20px] [&_figcaption_div]:grid [&_figcaption_div]:gap-[3px] [&_figcaption_strong]:text-[13px] [&_figcaption_small]:text-[rgba(255,255,255,.78)] [&_figcaption_small]:text-[8px] [&_figcaption_small]:tracking-[.3px] max-[1050px]:w-[min(620px,calc(100%_+_32px))] max-[1050px]:h-[380px] max-[1050px]:mr-[-24px] max-[850px]:w-full max-[850px]:h-[380px] max-[850px]:mx-auto max-[580px]:w-[calc(100%_-_12px)] max-[580px]:h-[255px] max-[580px]:mx-auto max-[580px]:border-[length:6px] max-[580px]:rounded-[54px_18px_64px_24px_/_36px_58px_30px_52px] max-[580px]:[&_figcaption]:inset-[auto_14px_13px] max-[580px]:[&_figcaption]:text-left max-[580px]:[&_figcaption>span]:w-[36px] max-[580px]:[&_figcaption>span]:h-[36px] max-[580px]:[&_figcaption_small]:hidden max-[420px]:h-[225px] max-[420px]:rounded-[43px_15px_52px_19px_/_30px_48px_24px_42px]`}>
            <img src={heroEvent} alt="Tập thể sinh viên tham gia chương trình Sinh viên 5 Tốt" width="876" height="390" />
            <span className={`hero-photo-card__shine absolute z-[2] top-[-40%] left-[-70%] w-[38%] h-[180%] bg-[linear-gradient(90deg,_transparent,_rgba(255,255,255,.45),_transparent)] transform-[rotate(18deg)] transition-[left] duration-[.8s] ease-[ease] pointer-events-none`} aria-hidden="true" />
            <figcaption>
              <span><Icon name="sparkles" /></span>
              <div><strong>Tuổi trẻ tạo dấu ấn</strong><small>Đạo đức · Học tập · Thể lực · Tình nguyện · Hội nhập</small></div>
            </figcaption>
          </figure>
          <figure
            className={`hero-orbit-photo absolute z-[5] right-[-54px] bottom-[18px] w-[172px] h-[172px] m-0 overflow-hidden border-[length:10px] border-solid border-[#fff] rounded-full bg-[#d8efff] shadow-[0_24px_50px_rgba(16,87,151,.3)] transition-[transform] duration-[.3s] ease-[cubic-bezier(.2,.8,.2,1)] [&_img]:w-full [&_img]:h-full [&_img]:object-cover [&_img]:object-[76%_center] [&_img]:transform-[scale(1.8)] max-[1050px]:right-[-28px] max-[1050px]:w-[154px] max-[1050px]:h-[154px] max-[850px]:right-[-12px] max-[850px]:bottom-[12px] max-[580px]:right-[-2px] max-[580px]:bottom-[6px] max-[580px]:w-[94px] max-[580px]:h-[94px] max-[580px]:border-[length:5px]`}
            aria-hidden="true"
          >
            <img src={heroEvent} alt="" />
          </figure>
          <span className={`absolute z-[6] right-[34px] top-[54px] p-[10px_16px] text-white border border-[rgba(255,255,255,.4)] rounded-full bg-[#0c76dd] shadow-[0_12px_26px_rgba(8,103,203,.25)] text-[9px] font-extrabold tracking-[.8px] uppercase transform-[rotate(4deg)] max-[580px]:top-[28px] max-[580px]:right-[16px] max-[580px]:p-[7px_10px] max-[580px]:text-[7px]`}>
            Hành trình · 2025–2026
          </span>
          <div className={`absolute z-[1] right-[-74px] bottom-[-4px] w-[150px] h-[150px] opacity-[.42] bg-[image:radial-gradient(#1683ff_2px,_transparent_2px)] bg-[length:14px_14px] max-[580px]:right-[-12px] max-[580px]:bottom-[2px] max-[580px]:hidden`} aria-hidden="true" />
          <div className={`absolute z-[4] flex items-center gap-[9px] p-[11px_14px] border border-[rgba(218,226,239,.8)] rounded-[13px] bg-[rgba(255,255,255,.94)] shadow-[0_15px_35px_rgba(39,72,131,.16)] backdrop-blur-[10px] transition-[transform,box-shadow] duration-[.25s,.25s] ease-[ease,ease] hover:transform-[translateY(-5px)] hover:shadow-[0_20px_38px_rgba(39,72,131,.2)] [&>span]:grid [&>span]:place-items-center [&>span]:w-[34px] [&>span]:h-[34px] [&>span]:border [&>span]:border-[#d5eaff] [&>span]:rounded-[10px] [&>span]:text-[#147be5] [&>span]:bg-[#eff8ff] [&_svg]:w-[15px] [&_div]:grid [&_div]:gap-[2px] [&_b]:text-[8px] [&_small]:text-[#8b97aa] [&_small]:text-[6.5px] top-[126px] right-[-64px] max-[1050px]:right-[-28px] max-[850px]:right-[-8px] max-[580px]:top-[0] max-[580px]:right-[-5px] max-[580px]:hidden`}>
            <span><Icon name="award" /></span>
            <div><b>5 tiêu chí toàn diện</b><small>Một hành trình đáng tự hào</small></div>
          </div>
          <div className={`absolute z-[4] flex items-center gap-[9px] p-[11px_14px] border border-[rgba(218,226,239,.8)] rounded-[13px] bg-[rgba(255,255,255,.94)] shadow-[0_15px_35px_rgba(39,72,131,.16)] backdrop-blur-[10px] transition-[transform,box-shadow] duration-[.25s,.25s] ease-[ease,ease] hover:transform-[translateY(-5px)] hover:shadow-[0_20px_38px_rgba(39,72,131,.2)] [&>span]:grid [&>span]:place-items-center [&>span]:w-[34px] [&>span]:h-[34px] [&>span]:border [&>span]:border-[#d5eaff] [&>span]:rounded-[10px] [&>span]:text-[#147be5] [&>span]:bg-[#eff8ff] [&_svg]:w-[15px] [&_div]:grid [&_div]:gap-[2px] [&_b]:text-[8px] [&_small]:text-[#8b97aa] [&_small]:text-[6.5px] bottom-[30px] left-[-32px] max-[580px]:bottom-[0] max-[580px]:left-[-5px] max-[580px]:z-[7] max-[580px]:bottom-[-3px] max-[580px]:left-[2px] max-[420px]:p-[9px_10px] max-[420px]:[&_small]:hidden`}>
            <span><Icon name="users" /></span>
            <div><b>2.000+ sinh viên</b><small>Đang cùng nhau tiến bước</small></div>
          </div>
        </div>
      </div>
      <a
        className={`scroll-cue absolute left-[50%] bottom-[21px] grid justify-items-center gap-[5px] text-[#94a0b3] text-[7px] font-bold tracking-[.8px] uppercase transform-[translateX(-50%)] [&_span]:w-[18px] [&_span]:h-[28px] [&_span]:border [&_span]:border-[#b8c4d5] [&_span]:rounded-[10px] [&_span::after]:content-[''] [&_span::after]:block [&_span::after]:w-[3px] [&_span::after]:h-[5px] [&_span::after]:m-[5px_auto] [&_span::after]:rounded-[9px] [&_span::after]:bg-[var(--blue)] max-[850px]:hidden`}
        href="#stats"
        aria-label="Cuộn xuống"
      >
        <span />
        <small>Cuộn để khám phá</small>
      </a>
    </section>
  );
}
