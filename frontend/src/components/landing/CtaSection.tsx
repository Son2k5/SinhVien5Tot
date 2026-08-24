import { Link } from 'react-router-dom';
import { Icon } from '../common/BrandLogo';

export function CtaSection() {
  return (
    <section className={`relative overflow-hidden p-[90px_0] text-white bg-[linear-gradient(115deg,#12327d,#2463e5_55%,#5b8ff1)] max-[580px]:p-[75px_0]`}>
      <div
        className={`absolute inset-0 opacity-[.3] bg-[image:radial-gradient(circle_at_20%_30%,_#8eb8ff_0,_transparent_30%),_radial-gradient(circle_at_80%_60%,_#aecbff_0,_transparent_28%)] after:content-[''] after:absolute after:inset-0 after:bg-[image:linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] after:bg-[length:40px_40px] after:transform-[rotate(-7deg)_scale(1.2)]`}
        aria-hidden="true"
      />
      <div
        className={`landing-container w-[min(1180px,_calc(100%_-_48px))] mx-auto max-[850px]:w-[min(100%_-_36px,_680px)] max-[580px]:w-[calc(100%_-_30px)] max-[700px]:w-[calc(100%_-_30px)] max-[420px]:w-[calc(100%_-_24px)] relative text-center [&_h2]:m-[18px_0_12px] [&_h2]:font-['Be_Vietnam_Pro'] [&_h2]:text-[clamp(34px,4vw,47px)] [&_h2]:leading-[1.16] [&_h2]:tracking-[-1.7px] [&_h2_span]:text-[#bad3ff] [&>p]:max-w-[630px] [&>p]:m-[0_auto_28px] [&>p]:text-[rgba(255,255,255,.74)] [&>p]:text-[11px] [&>div]:flex [&>div]:justify-center [&>div]:gap-[10px] max-[580px]:[&>div]:grid max-[420px]:[&_h2]:text-[30px]`}
        data-reveal
      >
        <span className={`inline-flex items-center gap-[8px] p-[7px_11px] border rounded-full text-[9.5px] font-extrabold tracking-[1.25px] uppercase text-[var(--blue-700)] border-[#cfe8fb] bg-[rgba(255,255,255,.82)] shadow-[0_8px_22px_rgba(22,131,255,.07)] [&_.eyebrow__dot]:bg-[var(--blue)] [&_.eyebrow__dot]:shadow-[0_0_0_5px_rgba(22,131,255,.1)]`}>
          <span className={`eyebrow__dot relative w-[6px] h-[6px] rounded-full bg-[var(--blue)] shadow-[0_0_0_4px_rgba(36,99,235,.12)]`} /> Hành trình bắt đầu từ hôm nay
        </span>
        <h2>
          Sẵn sàng chinh phục danh hiệu<br />
          <span>Sinh viên 5 Tốt?</span>
        </h2>
        <p>Tham gia cùng hàng ngàn sinh viên đang xây dựng phiên bản toàn diện hơn của chính mình.</p>
        <div>
          <Link
            to="/register"
            className={`button inline-flex justify-center items-center gap-[8px] min-h-[42px] p-[0_17px] border border-[transparent] rounded-[11px] text-[12.5px] font-bold cursor-pointer transition-[transform,box-shadow,color,background] duration-[.2s,.2s,.2s,.2s] ease-[ease,ease,ease,ease] [&_svg]:w-[16px] [&_svg]:h-[16px] [&_svg]:transition-[transform] [&_svg]:duration-[.2s] [&_svg]:ease-[ease] hover:transform-[translateY(-2px)] [&:hover_svg]:transform-[translateX(3px)] text-[#1748c7] bg-white shadow-[0_16px_32px_rgba(11,31,77,.18)] min-h-[52px] px-[23px] rounded-[13px] text-[13px]`}
          >
            Tạo tài khoản miễn phí <Icon name="arrow-right" />
          </Link>
          <a
            href="#gioi-thieu"
            className={`button inline-flex justify-center items-center gap-[8px] min-h-[42px] p-[0_17px] border border-[transparent] rounded-[11px] text-[12.5px] font-bold cursor-pointer transition-[transform,box-shadow,color,background] duration-[.2s,.2s,.2s,.2s] ease-[ease,ease,ease,ease] [&_svg]:w-[16px] [&_svg]:h-[16px] [&_svg]:transition-[transform] [&_svg]:duration-[.2s] [&_svg]:ease-[ease] hover:transform-[translateY(-2px)] [&:hover_svg]:transform-[translateX(3px)] text-white border-[rgba(255,255,255,.36)] bg-[rgba(255,255,255,.08)] min-h-[52px] px-[23px] rounded-[13px] text-[13px]`}
          >
            Tìm hiểu thêm
          </a>
        </div>
      </div>
    </section>
  );
}
