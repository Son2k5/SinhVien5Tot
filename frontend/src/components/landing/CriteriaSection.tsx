import { Icon } from '../common/BrandLogo';
import { landingCriteria } from './landingData';

export function CriteriaSection() {
  return (
    <section
      id="tieu-chi"
      className={`p-[100px_0] max-[580px]:p-[75px_0] max-[420px]:py-[66px] bg-[linear-gradient(180deg,_#f0f9ff,_#fff)] relative overflow-hidden before:content-[''] before:absolute before:right-[-150px] before:top-[70px] before:w-[380px] before:h-[380px] before:rounded-full before:bg-[radial-gradient(circle,rgba(36,182,247,.11),transparent_68%)] before:pointer-events-none`}
    >
      <div className={`landing-container w-[min(1180px,_calc(100%_-_48px))] mx-auto max-[850px]:w-[min(100%_-_36px,_680px)] max-[580px]:w-[calc(100%_-_30px)] max-[700px]:w-[calc(100%_-_30px)] max-[420px]:w-[calc(100%_-_24px)]`}>
        <div
          className={`mb-[48px] [&_h2]:m-[17px_0_13px] [&_h2]:font-['Be_Vietnam_Pro',_sans-serif] [&_h2]:text-[clamp(31px,_3.7vw,_44px)] [&_h2]:leading-[1.15] [&_h2]:tracking-[-1.7px] [&_p]:text-[var(--muted)] [&_p]:text-[14px] [&_p]:leading-[1.75] max-[580px]:mb-[35px] max-[580px]:[&_h2]:text-[31px] max-[420px]:[&_h2]:text-[28px] max-[420px]:[&_h2]:tracking-[-1.15px] [&_h2]:text-[var(--landing-heading)] [&_h2]:font-['Be_Vietnam_Pro',_ui-sans-serif,_system-ui,_sans-serif] [&_h2]:font-bold [&>p]:text-[var(--landing-muted)] max-w-[720px] mx-auto text-center [&_p]:max-w-[580px] [&_p]:m-[auto]`}
          data-reveal
        >
          <span className={`inline-flex items-center gap-[8px] text-[var(--blue)] p-[7px_11px] border border-[#d7e4fb] rounded-full bg-[rgba(255,255,255,.75)] text-[9.5px] font-extrabold tracking-[1.25px] uppercase`}>
            <span className={`eyebrow__dot relative w-[6px] h-[6px] rounded-full bg-[var(--blue)] shadow-[0_0_0_4px_rgba(36,99,235,.12)]`} /> Danh hiệu cao quý
          </span>
          <h2>
            Trở thành phiên bản <span className="inline-block bg-gradient-to-r from-[#0878f5] to-[#24b6f7] bg-clip-text text-transparent [-webkit-text-fill-color:transparent]">tốt hơn mỗi ngày</span>
          </h2>
          <p>Sinh viên 5 Tốt không chỉ là một danh hiệu, mà là hành trình rèn luyện để trưởng thành toàn diện.</p>
        </div>
        <div className={`relative grid grid-cols-[repeat(5,_1fr)] items-stretch gap-[16px] max-[1050px]:grid-cols-[repeat(3,1fr)] max-[850px]:grid-cols-[repeat(2,1fr)] max-[580px]:grid-cols-[1fr]`}>
          {landingCriteria.map((item) => (
            <article
              className={`relative min-h-[270px] p-[27px_22px] overflow-hidden border border-[color-mix(in_srgb,currentColor_20%,#dfe9f3)] rounded-[25px_15px_25px_15px] bg-[linear-gradient(155deg,#fff_45%,color-mix(in_srgb,currentColor_7%,#fff))] shadow-[0_13px_32px_rgba(28,76,124,.08)] transition-[transform,border-color,box-shadow] duration-[.35s,.3s,.35s] ease-[cubic-bezier(.2,.8,.2,1),ease,ease] [&:nth-child(even)]:rounded-[15px_25px_15px_25px] before:content-[''] before:absolute before:inset-[0_0_auto] before:h-[5px] before:bg-[linear-gradient(90deg,currentColor,color-mix(in_srgb,currentColor_35%,#fff))] before:transform-[scaleX(.38)] before:origin-[left] before:transition-[transform] before:duration-[.35s] before:ease-[ease] [&.is-visible:hover]:z-[2] [&.is-visible:hover]:transform-[translateY(-11px)] [&.is-visible:hover]:border-[color-mix(in_srgb,currentColor_55%,#fff)] [&.is-visible:hover]:shadow-[0_26px_55px_rgba(24,91,151,.17)] [&:hover::before]:transform-[scaleX(1)] [&:hover_.criteria-card__icon]:text-white [&:hover_.criteria-card__icon]:bg-[var(--blue)] [&:hover_.criteria-card__icon]:transform-[rotate(-6deg)_scale(1.08)] [&_h3]:m-[0_0_10px] [&_h3]:text-[#142f4d] [&_h3]:font-['Be_Vietnam_Pro',sans-serif] [&_h3]:text-[17px] [&_h3]:font-extrabold [&_h3]:tracking-[-.35px] [&_p]:m-0 [&_p]:text-[#5f748b] [&_p]:text-[12px] [&_p]:leading-[1.75] [&>a]:absolute [&>a]:bottom-[19px] [&>a]:left-[22px] [&>a]:grid [&>a]:place-items-center [&>a]:w-[34px] [&>a]:h-[34px] [&>a]:rounded-[12px] [&>a]:bg-[color-mix(in_srgb,currentColor_13%,white)] [&>a]:transition-[transform,background,color] [&>a]:duration-[.25s,.25s,.25s] [&>a]:ease-[ease,ease,ease] [&>a_svg]:w-[14px] [&>a:hover]:text-white [&>a:hover]:bg-[var(--blue)] [&>a:hover]:transform-[translateX(4px)] [&:nth-child(3)]:min-h-[290px] [&:nth-child(3)]:my-[-10px] [&:nth-child(3)]:text-[#147be5] [&:nth-child(3)]:border-[#8bcbf7] [&:nth-child(3)]:rounded-[30px_17px_30px_17px] [&:nth-child(3)]:bg-[linear-gradient(145deg,#fff,#e5f5ff_72%,#d8f1ff)] [&:nth-child(3)]:shadow-[0_25px_55px_rgba(22,131,255,.17)] [&:nth-child(3)::after]:content-[''] [&:nth-child(3)::after]:absolute [&:nth-child(3)::after]:right-[-60px] [&:nth-child(3)::after]:bottom-[-70px] [&:nth-child(3)::after]:w-[180px] [&:nth-child(3)::after]:h-[180px] [&:nth-child(3)::after]:border [&:nth-child(3)::after]:border-[rgba(22,131,255,.12)] [&:nth-child(3)::after]:rounded-full [&:nth-child(3)::after]:shadow-[0_0_0_28px_rgba(22,131,255,.035),0_0_0_58px_rgba(22,131,255,.02)] [&:nth-child(3)_.criteria-card__number]:text-[rgba(22,131,255,.1)] [&:nth-child(3)_.criteria-card__icon]:text-[var(--blue-700)] [&:nth-child(3)_.criteria-card__icon]:border-[#b7dcf7] [&:nth-child(3)_.criteria-card__icon]:bg-white [&:nth-child(3)_.criteria-card__icon]:shadow-[0_12px_30px_rgba(22,131,255,.14)] [&:nth-child(3)_h3]:text-[#123657] [&:nth-child(3)_p]:text-[#58738d] [&:nth-child(3)>a]:z-[1] [&:nth-child(3)>a]:text-[var(--blue-700)] [&:nth-child(3)>a]:bg-[rgba(255,255,255,.78)] max-[1050px]:[&:last-child]:col-[2] max-[850px]:[&:last-child]:col-[auto] max-[580px]:min-h-[235px] max-[580px]:[&:nth-child(3)]:min-h-[250px] max-[580px]:[&:nth-child(3)]:my-[0] max-[580px]:[&:last-child]:col-[auto] max-[700px]:[&:nth-child(3)]:min-h-[260px] max-[700px]:[&:nth-child(3)]:my-[0] max-[420px]:min-h-[238px] max-[420px]:p-[24px_20px] max-[420px]:rounded-[22px_13px_22px_13px] max-[420px]:[&:nth-child(3)]:min-h-[238px] max-[420px]:[&:nth-child(3)]:p-[24px_20px] max-[420px]:[&:nth-child(3)]:rounded-[22px_13px_22px_13px] [@media(hover:_none)]:[&.is-visible:hover]:transform-none [@media(hover:_none)]:[&:hover_.criteria-card__icon]:transform-none [&_h3]:text-[var(--landing-heading)] [&_h3]:font-['Be_Vietnam_Pro',_ui-sans-serif,_system-ui,_sans-serif] [&_h3]:font-bold [&_p]:text-[var(--landing-muted)] tone-${item.tone}`}
              key={item.title}
              data-reveal
            >
              <span className={`criteria-card__number absolute top-[13px] right-[17px] text-[color-mix(in_srgb,currentColor_10%,transparent)] font-['Be_Vietnam_Pro',sans-serif] text-[45px] font-extrabold tracking-[-2px]`}>
                {item.number}
              </span>
              <span className={`criteria-card__icon grid place-items-center w-[54px] h-[54px] mb-[36px] border border-[color-mix(in_srgb,currentColor_25%,white)] rounded-[17px_11px_17px_11px] bg-[color-mix(in_srgb,currentColor_12%,white)] shadow-[0_9px_22px_color-mix(in_srgb,currentColor_14%,transparent)] transition-[transform,background,color] duration-[.35s,.3s,.3s] ease-[cubic-bezier(.2,.8,.2,1),ease,ease] [&_svg]:w-[23px] [&_svg]:text-current max-[420px]:w-[50px] max-[420px]:h-[50px] max-[420px]:mb-[28px]`}>
                <Icon name={item.icon} />
              </span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <a href="#tinh-nang" aria-label={`Tìm hiểu ${item.title}`}>
                <Icon name="arrow-right" />
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
