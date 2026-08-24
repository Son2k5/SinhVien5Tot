import { Icon } from '../common/BrandLogo';
import { landingGallery } from './landingData';

export function GallerySection() {
  return (
    <section id="thu-vien" className={`p-[100px_0] max-[580px]:p-[75px_0] max-[420px]:py-[66px] bg-[#f7f9fd]`}>
      <div className={`landing-container w-[min(1180px,_calc(100%_-_48px))] mx-auto max-[850px]:w-[min(100%_-_36px,_680px)] max-[580px]:w-[calc(100%_-_30px)] max-[700px]:w-[calc(100%_-_30px)] max-[420px]:w-[calc(100%_-_24px)]`}>
        <div
          className={`mb-[48px] [&_h2]:m-[17px_0_13px] [&_h2]:font-['Be_Vietnam_Pro',_sans-serif] [&_h2]:text-[clamp(31px,_3.7vw,_44px)] [&_h2]:leading-[1.15] [&_h2]:tracking-[-1.7px] [&_p]:text-[var(--muted)] [&_p]:text-[14px] [&_p]:leading-[1.75] max-[580px]:mb-[35px] max-[580px]:[&_h2]:text-[31px] max-[420px]:[&_h2]:text-[28px] max-[420px]:[&_h2]:tracking-[-1.15px] [&_h2]:text-[var(--landing-heading)] [&_h2]:font-['Be_Vietnam_Pro',_ui-sans-serif,_system-ui,_sans-serif] [&_h2]:font-bold [&>p]:text-[var(--landing-muted)] grid grid-cols-[1fr_.75fr] items-[end] [&_p]:max-w-[450px] [&_p]:m-[0_0_5px_auto] max-[580px]:grid-cols-[1fr] max-[580px]:gap-[10px] max-[580px]:[&_p]:ml-0`}
          data-reveal
        >
          <div>
            <span className={`inline-flex items-center gap-[8px] text-[var(--blue)] p-[7px_11px] border border-[#d7e4fb] rounded-full bg-[rgba(255,255,255,.75)] text-[9.5px] font-extrabold tracking-[1.25px] uppercase`}>
              <span className={`eyebrow__dot relative w-[6px] h-[6px] rounded-full bg-[var(--blue)] shadow-[0_0_0_4px_rgba(36,99,235,.12)]`} /> Khoảnh khắc tuổi trẻ
            </span>
            <h2>
              Những hành trình <span className="inline-block bg-gradient-to-r from-[#0878f5] to-[#24b6f7] bg-clip-text text-transparent [-webkit-text-fill-color:transparent]">đáng nhớ</span>
            </h2>
          </div>
          <p>Mỗi hoạt động là một trải nghiệm, mỗi trải nghiệm là một bước tiến gần hơn đến phiên bản tốt nhất của chính mình.</p>
        </div>
        <div className={`grid grid-cols-[1.15fr_.85fr_.85fr] grid-rows-[repeat(2,_210px)] gap-[13px] max-[850px]:grid-cols-[1fr_1fr] max-[580px]:grid-cols-[1fr] max-[580px]:grid-rows-[repeat(4,230px)] max-[420px]:grid-rows-[repeat(4,205px)]`}>
          {landingGallery.map((item, index) => (
            <figure
              key={item.label}
              className={index === 0
                ? `relative h-full m-0 overflow-hidden rounded-[17px] bg-[#d9e2f0] [&:last-child]:col-span-2 [&_img]:w-full [&_img]:h-full [&_img]:object-cover [&_img]:transition-[transform,filter] [&_img]:duration-[.7s,.4s] [&_img]:ease-[ease,ease] after:[content:''] after:absolute after:inset-[35%_0_0] after:bg-[linear-gradient(transparent,_rgba(7,17,39,.8))] [&_figcaption]:absolute [&_figcaption]:z-[2] [&_figcaption]:inset-[auto_17px_15px] [&_figcaption]:flex [&_figcaption]:justify-between [&_figcaption]:items-center [&_figcaption]:text-white [&_figcaption]:text-[10px] [&_figcaption]:font-bold [&_figcaption]:opacity-[.85] [&_figcaption]:transform-[translateY(4px)] [&_figcaption]:transition-[opacity,transform] [&_figcaption]:duration-[.3s] [&_figcaption]:ease-[ease] [&_figcaption_svg]:w-[16px] [&:hover_img]:transform-[scale(1.06)] [&:hover_figcaption]:opacity-100 [&:hover_figcaption]:transform-none max-[850px]:[&:last-child]:col-[span_1] max-[580px]:[&:last-child]:col-[auto] [@media(hover:_none)]:[&:hover_img]:transform-none row-[span_2] max-[850px]:row-[span_1]`
                : `relative h-full m-0 overflow-hidden rounded-[17px] bg-[#d9e2f0] [&:last-child]:col-span-2 [&_img]:w-full [&_img]:h-full [&_img]:object-cover [&_img]:transition-[transform,filter] [&_img]:duration-[.7s,.4s] [&_img]:ease-[ease,ease] after:[content:''] after:absolute after:inset-[35%_0_0] after:bg-[linear-gradient(transparent,_rgba(7,17,39,.8))] [&_figcaption]:absolute [&_figcaption]:z-[2] [&_figcaption]:inset-[auto_17px_15px] [&_figcaption]:flex [&_figcaption]:justify-between [&_figcaption]:items-center [&_figcaption]:text-white [&_figcaption]:text-[10px] [&_figcaption]:font-bold [&_figcaption]:opacity-[.85] [&_figcaption]:transform-[translateY(4px)] [&_figcaption]:transition-[opacity,transform] [&_figcaption]:duration-[.3s] [&_figcaption]:ease-[ease] [&_figcaption_svg]:w-[16px] [&:hover_img]:transform-[scale(1.06)] [&:hover_figcaption]:opacity-100 [&:hover_figcaption]:transform-none max-[850px]:[&:last-child]:col-[span_1] max-[580px]:[&:last-child]:col-[auto] [@media(hover:_none)]:[&:hover_img]:transform-none`}
              data-reveal
            >
              <img src={item.src} alt={item.alt} loading="lazy" />
              <figcaption>
                <span>{item.label}</span>
                <Icon name="arrow-right" />
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
