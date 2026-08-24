import { Link } from 'react-router-dom';
import { Icon } from '../common/BrandLogo';
import { landingFeatures } from './landingData';

export function FeaturesSection() {
  return (
    <section
      id="tinh-nang"
      className={`p-[100px_0] max-[580px]:p-[75px_0] max-[420px]:py-[66px] relative overflow-hidden bg-[linear-gradient(180deg,#fff,#eef8ff_56%,#fff)] after:content-[''] after:absolute after:z-[0] after:left-[-120px] after:bottom-[12%] after:w-[340px] after:h-[340px] after:rounded-full after:bg-[radial-gradient(circle,rgba(22,131,255,.09),transparent_70%)] after:pointer-events-none [&_.landing-container]:relative [&_.landing-container]:z-[1]`}
    >
      <div className={`landing-container w-[min(1180px,_calc(100%_-_48px))] mx-auto max-[850px]:w-[min(100%_-_36px,_680px)] max-[580px]:w-[calc(100%_-_30px)] max-[700px]:w-[calc(100%_-_30px)] max-[420px]:w-[calc(100%_-_24px)]`}>
        <div
          className={`mb-[48px] [&_h2]:m-[17px_0_13px] [&_h2]:font-['Be_Vietnam_Pro',_sans-serif] [&_h2]:text-[clamp(31px,_3.7vw,_44px)] [&_h2]:leading-[1.15] [&_h2]:tracking-[-1.7px] [&_p]:text-[var(--muted)] [&_p]:text-[14px] [&_p]:leading-[1.75] max-[580px]:mb-[35px] max-[580px]:[&_h2]:text-[31px] max-[420px]:[&_h2]:text-[28px] max-[420px]:[&_h2]:tracking-[-1.15px] [&_h2]:text-[var(--landing-heading)] [&_h2]:font-['Be_Vietnam_Pro',_ui-sans-serif,_system-ui,_sans-serif] [&_h2]:font-bold [&>p]:text-[var(--landing-muted)] max-w-[720px] mx-auto text-center [&_p]:max-w-[580px] [&_p]:m-[auto]`}
          data-reveal
        >
          <span className={`inline-flex items-center gap-[8px] text-[var(--blue)] p-[7px_11px] border border-[#d7e4fb] rounded-full bg-[rgba(255,255,255,.75)] text-[9.5px] font-extrabold tracking-[1.25px] uppercase`}>
            <span className={`eyebrow__dot relative w-[6px] h-[6px] rounded-full bg-[var(--blue)] shadow-[0_0_0_4px_rgba(36,99,235,.12)]`} /> Website giúp bạn làm được gì?
          </span>
          <h2>
            Mọi chức năng cần thiết,<br />
            <span className="inline-block bg-gradient-to-r from-[#0878f5] to-[#24b6f7] bg-clip-text text-transparent [-webkit-text-fill-color:transparent]">trong một nền tảng</span>
          </h2>
          <p>Từ lúc tạo hồ sơ đến khi được công nhận, SV5T giúp từng bước trở nên rõ ràng, nhanh gọn và dễ theo dõi.</p>
        </div>
        <div className={`grid grid-cols-[repeat(4,1fr)] grid-flow-[dense] gap-[18px] max-[1050px]:grid-cols-[repeat(2,1fr)] max-[850px]:grid-cols-[repeat(2,1fr)] max-[580px]:grid-cols-[1fr]`}>
          {landingFeatures.map((feature, index) => (
            <article
              key={feature.title}
              className={`feature-card relative grid min-h-[205px] content-[start] gap-[20px] overflow-hidden p-[27px] border border-[#d5e8f7] rounded-[25px] bg-[rgba(255,255,255,.96)] shadow-[0_13px_32px_rgba(24,101,166,.08)] transition-[transform,border-color,box-shadow,background] duration-[.35s,.3s,.35s,.3s] ease-[cubic-bezier(.2,.8,.2,1),ease,ease,ease] delay-[var(--delay)] before:content-[''] before:absolute before:inset-[0_auto_0_0] before:w-[4px] before:bg-[linear-gradient(var(--blue),var(--process-cyan,#24b6f7))] before:opacity-[.22] before:transition-[width,opacity] before:duration-[.3s,.3s] before:ease-[ease,ease] [&:nth-child(even)]:rounded-[25px_25px_13px_25px] [&:nth-child(odd)]:rounded-[13px_25px_25px_25px] [&:first-child]:grid-cols-[auto_1fr] [&:first-child]:col-span-2 [&:first-child]:items-[start] [&:first-child]:min-h-[205px] [&:last-child]:grid-cols-[auto_1fr] [&:last-child]:col-span-2 [&:last-child]:items-[start] [&:last-child]:min-h-[205px] [&:first-child]:text-[var(--blue-700)] [&:first-child]:border-[#8dccf7] [&:first-child]:rounded-[30px_17px_30px_17px] [&:first-child]:bg-[linear-gradient(135deg,#fff,#e4f4ff_70%,#d5efff)] [&:first-child]:shadow-[0_24px_55px_rgba(22,131,255,.17)] [&:first-child::after]:content-[''] [&:first-child::after]:absolute [&:first-child::after]:right-[-60px] [&:first-child::after]:top-[-75px] [&:first-child::after]:w-[200px] [&:first-child::after]:h-[200px] [&:first-child::after]:border [&:first-child::after]:border-[rgba(22,131,255,.11)] [&:first-child::after]:rounded-full [&:first-child::after]:shadow-[0_0_0_32px_rgba(22,131,255,.035)] [&:last-child]:border-[#b9e2f7] [&:last-child]:bg-[linear-gradient(135deg,#fff,#eaf8ff)] [&.is-visible:hover]:z-[2] [&.is-visible:hover]:border-[#71bff5] [&.is-visible:hover]:bg-[#fff] [&.is-visible:hover]:shadow-[0_27px_56px_rgba(20,112,187,.17)] [&.is-visible:hover]:transform-[translateY(-9px)] [&.is-visible]:delay-[0ms] [&:hover::before]:w-[7px] [&:hover::before]:opacity-100 [&>span]:relative [&>span]:z-[1] [&>span]:grid [&>span]:place-items-center [&>span]:w-[54px] [&>span]:h-[54px] [&>span]:border [&>span]:border-[#c8e3f7] [&>span]:rounded-[17px] [&>span]:text-[#147be5] [&>span]:bg-[#edf8ff] [&>span]:shadow-[0_9px_20px_rgba(22,131,255,.11)] [&>span]:transition-[transform,color,background] [&>span]:duration-[.35s,.3s,.3s] [&>span]:ease-[ease,ease,ease] [&:nth-child(2)>span]:text-[#0787b5] [&:nth-child(2)>span]:border-[#c6eaf5] [&:nth-child(2)>span]:bg-[#ebfaff] [&:nth-child(5)>span]:text-[#0787b5] [&:nth-child(5)>span]:border-[#c6eaf5] [&:nth-child(5)>span]:bg-[#ebfaff] [&:nth-child(3)>span]:text-[#0b8c85] [&:nth-child(3)>span]:border-[#caebe7] [&:nth-child(3)>span]:bg-[#edfaf8] [&:nth-child(6)>span]:text-[#0b8c85] [&:nth-child(6)>span]:border-[#caebe7] [&:nth-child(6)>span]:bg-[#edfaf8] [&:nth-child(4)>span]:text-[#2563c7] [&:nth-child(4)>span]:border-[#d4e2fa] [&:nth-child(4)>span]:bg-[#f0f5ff] [&:hover>span]:transform-[rotate(-5deg)_scale(1.08)] [&_svg]:w-[22px] [&_h3]:m-[0_0_8px] [&_h3]:text-[#143452] [&_h3]:font-['Be_Vietnam_Pro',sans-serif] [&_h3]:text-[17px] [&_h3]:font-extrabold [&_h3]:tracking-[-.35px] [&_p]:m-0 [&_p]:text-[#5e758d] [&_p]:text-[12px] [&_p]:leading-[1.75] [&:first-child>span]:text-[var(--blue-700)] [&:first-child>span]:border-[#b9def7] [&:first-child>span]:bg-[rgba(255,255,255,.82)] [&:first-child>span]:shadow-[0_12px_25px_rgba(22,131,255,.13)] [&:first-child_h3]:text-[#123657] [&:first-child_p]:text-[#58738d] [&:first-child:hover]:bg-[linear-gradient(135deg,#fff,#e4f4ff_70%,#d5efff)] max-[1050px]:[&:first-child]:grid-cols-[1fr] max-[1050px]:[&:first-child]:col-[span_1] max-[1050px]:[&:last-child]:grid-cols-[1fr] max-[1050px]:[&:last-child]:col-[span_1] max-[580px]:min-h-[175px] max-[580px]:[&:first-child]:min-h-[190px] max-[580px]:[&:last-child]:min-h-[190px] max-[420px]:min-h-0 max-[420px]:p-[23px_20px] max-[420px]:rounded-[22px_13px_22px_13px] max-[420px]:[&:first-child]:min-h-0 max-[420px]:[&:first-child]:p-[23px_20px] max-[420px]:[&:first-child]:rounded-[22px_13px_22px_13px] max-[420px]:[&:last-child]:min-h-0 max-[420px]:[&:last-child]:p-[23px_20px] max-[420px]:[&:last-child]:rounded-[22px_13px_22px_13px] max-[420px]:[&>span]:w-[50px] max-[420px]:[&>span]:h-[50px] [@media(hover:_none)]:[&.is-visible:hover]:transform-none [@media(hover:_none)]:[&:hover>span]:transform-none [&_h3]:text-[var(--landing-heading)] [&_h3]:font-['Be_Vietnam_Pro',_ui-sans-serif,_system-ui,_sans-serif] [&_h3]:font-bold [&_p]:text-[var(--landing-muted)]`}
              data-reveal
              style={{ '--delay': `${index * 70}ms` } as React.CSSProperties}
            >
              <span><Icon name={feature.icon} /></span>
              <div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            </article>
          ))}
        </div>
        <div className={`flex justify-center mt-[34px]`} data-reveal>
          <Link
            to="/register"
            className={`button inline-flex justify-center items-center gap-[8px] min-h-[42px] p-[0_17px] border border-[transparent] rounded-[11px] text-[12.5px] font-bold cursor-pointer transition-[transform,box-shadow,color,background] duration-[.2s,.2s,.2s,.2s] ease-[ease,ease,ease,ease] [&_svg]:w-[16px] [&_svg]:h-[16px] [&_svg]:transition-[transform] [&_svg]:duration-[.2s] [&_svg]:ease-[ease] hover:transform-[translateY(-2px)] [&:hover_svg]:transform-[translateX(3px)] text-white bg-[linear-gradient(135deg,_#20a4ff,_#0876ef)] shadow-[0_10px_25px_rgba(8,118,239,.25)] hover:shadow-[0_14px_30px_rgba(8,118,239,.38)] min-h-[52px] px-[23px] rounded-[13px] text-[13px]`}
          >
            Trải nghiệm các chức năng <Icon name="arrow-right" />
          </Link>
        </div>
      </div>
    </section>
  );
}
