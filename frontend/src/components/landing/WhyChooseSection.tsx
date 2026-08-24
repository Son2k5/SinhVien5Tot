import { Icon } from '../common/BrandLogo';

const highlights = [
  ['Minh bạch và công bằng', 'Mọi tiêu chí và kết quả xét duyệt đều rõ ràng.'],
  ['Dữ liệu luôn an toàn', 'Thông tin cá nhân được bảo vệ theo tiêu chuẩn cao.'],
  ['Hỗ trợ xuyên suốt', 'Đội ngũ sẵn sàng đồng hành trong toàn bộ hành trình.'],
];

export function WhyChooseSection() {
  return (
    <section className={`p-[100px_0] max-[580px]:p-[75px_0] max-[420px]:py-[66px] bg-white`}>
      <div className={`landing-container w-[min(1180px,_calc(100%_-_48px))] mx-auto max-[850px]:w-[min(100%_-_36px,_680px)] max-[580px]:w-[calc(100%_-_30px)] max-[700px]:w-[calc(100%_-_30px)] max-[420px]:w-[calc(100%_-_24px)] grid grid-cols-[1fr_.85fr] items-center gap-[90px] max-[1050px]:gap-[50px] max-[850px]:grid-cols-[1fr] max-[850px]:gap-[45px]`}>
        <div
          className={`relative [&>img]:w-full [&>img]:h-[480px] [&>img]:object-cover [&>img]:rounded-[25px] [&>img]:shadow-[var(--shadow)] before:content-[''] before:absolute before:z-[-1] before:inset-[30px_-25px_-25px_30px] before:rounded-[25px] before:bg-[#eaf1ff] max-[850px]:w-[calc(100%_-_20px)] max-[580px]:[&>img]:h-[360px] max-[420px]:[&>img]:h-[320px]`}
          data-reveal
        >
          <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1100&q=84" alt="Nhóm sinh viên cùng học tập và làm việc" loading="lazy" />
          <div className={`absolute right-[-35px] bottom-[35px] flex items-center gap-[12px] p-[16px_20px] text-white border-[length:5px] border-solid border-[white] rounded-[16px] bg-[linear-gradient(135deg,#347cf1,#194ab9)] shadow-[0_16px_35px_rgba(29,76,173,.3)] [&_strong]:font-['Be_Vietnam_Pro'] [&_strong]:text-[26px] [&_span]:text-[8px] [&_span]:leading-[1.5] max-[580px]:right-[-10px]`}>
            <strong>5+</strong><span>Năm đồng hành<br />cùng sinh viên</span>
          </div>
        </div>
        <div
          className={`[&_h2]:m-[17px_0_13px] [&_h2]:font-['Be_Vietnam_Pro',_sans-serif] [&_h2]:text-[clamp(31px,_3.7vw,_44px)] [&_h2]:leading-[1.15] [&_h2]:tracking-[-1.7px] [&>p]:text-[var(--muted)] [&>p]:text-[14px] [&>p]:leading-[1.75] max-w-[460px] [&_ul]:grid [&_ul]:gap-[18px] [&_ul]:m-[26px_0_0] [&_ul]:p-0 [&_ul]:list-none [&_li]:flex [&_li]:gap-[13px] [&_li]:items-start [&_li>span]:grid [&_li>span]:place-items-center [&_li>span]:flex-[0_0_25px] [&_li>span]:h-[25px] [&_li>span]:rounded-[8px] [&_li>span]:text-white [&_li>span]:bg-[var(--blue)] [&_li>span]:shadow-[0_6px_15px_rgba(36,99,235,.22)] [&_li_svg]:w-[13px] [&_li_div]:grid [&_li_div]:gap-[4px] [&_li_strong]:text-[11px] [&_li_small]:text-[#7e899b] [&_li_small]:text-[9px] [&_li_small]:leading-[1.5] max-[850px]:max-w-[600px] max-[850px]:mt-[20px] max-[580px]:[&_h2]:text-[31px] max-[420px]:[&_h2]:text-[28px] max-[420px]:[&_h2]:tracking-[-1.15px] [&_h2]:text-[var(--landing-heading)] [&_h2]:font-['Be_Vietnam_Pro',_ui-sans-serif,_system-ui,_sans-serif] [&_h2]:font-bold [&>p]:text-[var(--landing-muted)] [&_li_small]:text-[var(--landing-muted)] [&_li_strong]:font-bold`}
          data-reveal
        >
          <span className={`inline-flex items-center gap-[8px] text-[var(--blue)] p-[7px_11px] border border-[#d7e4fb] rounded-full bg-[rgba(255,255,255,.75)] text-[9.5px] font-extrabold tracking-[1.25px] uppercase`}>
            <span className={`eyebrow__dot relative w-[6px] h-[6px] rounded-full bg-[var(--blue)] shadow-[0_0_0_4px_rgba(36,99,235,.12)]`} /> Vì sao chọn SV5T?
          </span>
          <h2>
            Thiết kế để bạn <span className="inline-block bg-gradient-to-r from-[#0878f5] to-[#24b6f7] bg-clip-text text-transparent [-webkit-text-fill-color:transparent]">tự tin tiến bước</span>
          </h2>
          <p>Nền tảng lấy trải nghiệm sinh viên làm trung tâm, giúp mọi cột mốc trở nên rõ ràng và đáng nhớ.</p>
          <ul>
            {highlights.map(([title, desc]) => (
              <li key={title}>
                <span><Icon name="check" /></span>
                <div><strong>{title}</strong><small>{desc}</small></div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
