import { Icon } from '../common/BrandLogo';

export function AboutSection() {
  return (
    <section id="gioi-thieu" className={`p-[100px_0] max-[580px]:p-[75px_0] max-[420px]:py-[66px] relative bg-white`}>
      <div className={`landing-container w-[min(1180px,_calc(100%_-_48px))] mx-auto max-[850px]:w-[min(100%_-_36px,_680px)] max-[580px]:w-[calc(100%_-_30px)] max-[700px]:w-[calc(100%_-_30px)] max-[420px]:w-[calc(100%_-_24px)] grid grid-cols-[1.02fr_.98fr] items-center gap-[88px] max-[1050px]:gap-[50px] max-[850px]:grid-cols-[1fr] max-[850px]:gap-[45px]`}>
        <div
          className={`relative min-h-[570px] before:content-[''] before:absolute before:inset-[42px_22px_12px_58px] before:rounded-[34px] before:bg-[linear-gradient(145deg,#dff3ff,#f4fbff)] before:transform-[rotate(-3deg)] [&_img]:w-full [&_img]:h-full [&_img]:object-cover [&_img]:transition-[transform] [&_img]:duration-[.4s] [&_img]:ease-[ease] [&_figure:hover_img]:transform-[scale(1.045)] max-[850px]:min-h-[530px] max-[580px]:min-h-[405px] max-[420px]:min-h-[350px]`}
          data-reveal
        >
          <figure className={`absolute m-0 overflow-hidden bg-[#d7eaf8] shadow-[var(--shadow)] inset-[0_74px_68px_0] rounded-[30px] max-[580px]:inset-[0_38px_52px_0] max-[580px]:rounded-[24px]`}>
            <img src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1100&q=84" alt="Sinh viên cùng tham gia hoạt động cộng đồng" loading="lazy" />
          </figure>
          <figure className={`absolute m-0 overflow-hidden bg-[#d7eaf8] shadow-[var(--shadow)] z-[2] right-[0] bottom-[0] w-[47%] h-[42%] border-[length:7px] border-solid border-[#fff] rounded-[24px] max-[580px]:w-[48%] max-[580px]:h-[39%] max-[580px]:border-[length:5px] max-[580px]:rounded-[18px]`}>
            <img src="https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=600&q=82" alt="Sinh viên trao đổi và học tập cùng nhau" loading="lazy" />
          </figure>
          <div className={`absolute z-[3] left-[28px] bottom-[38px] flex items-center gap-[11px] p-[13px_16px] text-[#17436d] border border-[#d5eaff] rounded-[15px] bg-[rgba(255,255,255,.94)] shadow-[0_16px_34px_rgba(25,94,151,.16)] backdrop-blur-[10px] [&>svg]:w-[22px] [&>svg]:text-[#1683ff] [&_span]:grid [&_span]:gap-[2px] [&_strong]:text-[12px] [&_small]:text-[#6b8199] [&_small]:text-[9px] max-[580px]:left-[12px] max-[580px]:bottom-[20px] max-[420px]:right-[0] max-[420px]:left-[6px] max-[420px]:p-[10px_12px]`}>
            <Icon name="award" />
            <span><strong>5 tiêu chí</strong><small>Phát triển toàn diện</small></span>
          </div>
        </div>
        <div
          className={`max-w-[530px] [&_h2]:m-[18px_0_18px] [&_h2]:font-['Be_Vietnam_Pro',_sans-serif] [&_h2]:text-[clamp(36px,4vw,50px)] [&_h2]:leading-[1.08] [&_h2]:tracking-[-2px] [&>p]:m-[0_0_13px] [&>p]:text-[#62748b] [&>p]:text-[14px] [&>p]:leading-[1.8] [&_.about-copy__lead]:text-[#203957] [&_.about-copy__lead]:text-[16px] [&_.about-copy__lead]:font-semibold [&_.about-copy__lead]:leading-[1.7] max-[580px]:[&_h2]:text-[36px] max-[580px]:[&>p]:text-[13px] max-[580px]:[&_.about-copy__lead]:text-[15px] [&_h2]:text-[var(--landing-heading)] [&_h2]:font-['Be_Vietnam_Pro',_ui-sans-serif,_system-ui,_sans-serif] [&_h2]:font-bold [&>p]:text-[var(--landing-muted)]`}
          data-reveal
        >
          <span className={`inline-flex items-center gap-[8px] text-[var(--blue)] p-[7px_11px] border border-[#d7e4fb] rounded-full bg-[rgba(255,255,255,.75)] text-[9.5px] font-extrabold tracking-[1.25px] uppercase`}>
            <span className={`eyebrow__dot relative w-[6px] h-[6px] rounded-full bg-[var(--blue)] shadow-[0_0_0_4px_rgba(36,99,235,.12)]`} /> Hiểu đúng về danh hiệu
          </span>
          <h2>
            Sinh viên 5 Tốt<br />
            <span className="inline-block bg-gradient-to-r from-[#0878f5] to-[#24b6f7] bg-clip-text text-transparent [-webkit-text-fill-color:transparent]">là gì?</span>
          </h2>
          <p className={`about-copy__lead text-[var(--landing-body)]`}>
            Sinh viên 5 Tốt là danh hiệu ghi nhận những sinh viên có quá trình phấn đấu nổi bật và phát triển toàn diện trên năm phương diện.
          </p>
          <p>
            Đây không chỉ là một kết quả để tự hào, mà còn là bộ khung giúp mỗi sinh viên chủ động đặt mục tiêu, tích lũy trải nghiệm và trưởng thành qua từng năm học.
          </p>
          <div className={`grid gap-[13px] m-[25px_0_24px] [&>div]:flex [&>div]:items-center [&>div]:gap-[13px] [&>div]:p-[13px_15px] [&>div]:border [&>div]:border-[#e0edf8] [&>div]:rounded-[15px] [&>div]:bg-[#fbfdff] [&>div]:transition-[border-color,background-color,transform] [&>div]:duration-[.25s] [&>div]:ease-[ease] [&>div:hover]:border-[#b7daf7] [&>div:hover]:bg-[#f4faff] [&>div:hover]:transform-[translateX(5px)] [&>div>span]:grid [&>div>span]:place-items-center [&>div>span]:flex-[0_0_40px] [&>div>span]:h-[40px] [&>div>span]:rounded-[12px] [&>div>span]:text-[#147be5] [&>div>span]:bg-[#ebf6ff] [&_svg]:w-[19px] [&_p]:grid [&_p]:gap-[3px] [&_p]:m-0 [&_strong]:text-[#173657] [&_strong]:text-[13px] [&_small]:text-[#6e8197] [&_small]:text-[11px] [&_small]:leading-[1.5] max-[580px]:[&>div]:p-[12px] [&_small]:text-[var(--landing-body)]`}>
            <div><span><Icon name="target" /></span><p><strong>Mục tiêu rõ ràng</strong><small>Biết mình cần rèn luyện điều gì ở từng tiêu chí.</small></p></div>
            <div><span><Icon name="trend" /></span><p><strong>Hành trình có chiều sâu</strong><small>Mỗi minh chứng kể lại một bước tiến của chính bạn.</small></p></div>
            <div><span><Icon name="award" /></span><p><strong>Giá trị được ghi nhận</strong><small>Tạo nền tảng tốt cho học tập, hoạt động và tương lai.</small></p></div>
          </div>
          <a href="#tieu-chi" className={`text-link inline-flex items-center gap-[8px] text-[var(--blue)] text-[11px] font-extrabold [&_svg]:w-[15px] [&_svg]:transition-[transform] [&_svg]:duration-[.2s] [&_svg]:ease-[ease] [&:hover_svg]:transform-[translateX(4px)]`}>
            Khám phá 5 tiêu chí <Icon name="arrow-right" />
          </a>
        </div>
      </div>
    </section>
  );
}
